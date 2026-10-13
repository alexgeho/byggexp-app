import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { companyService } from "../../services/company.service";
import { FieldCard, FieldRow } from "../../components/common/FieldRow/FieldRow";
import { FormHeader, FormScreen } from "../../components/common/ui";
import { layout } from "../../theme/spacing";
import { getApiErrorMessage } from "../../utils/apiError";
import { getEntityId } from "../../utils/entityId";

// Company details (org number, address, contact) — the mobile counterpart of the
// admin's "Fill in your company details". Kept simple: load the admin's company,
// edit the invoice/offer-relevant fields, save. Theme-aware throughout. The
// field set mirrors the web form so an app-made invoice prints the same footer
// (Momsreg.nr, town, website, F-skatt) as one made on the web.
// Grouped like Create project: one card per topic, an icon on every row.
const GROUPS = [
  [
    { key: "name", labelKey: "companyDetails.name", icon: "briefcase" },
    {
      key: "orgNumber",
      labelKey: "companyDetails.orgNumber",
      icon: "id-card",
    },
    {
      key: "vatNumber",
      labelKey: "companyDetails.vatNumber",
      icon: "receipt",
    },
  ],
  [
    { key: "address", labelKey: "companyDetails.address", icon: "map-pin" },
    { key: "city", labelKey: "companyDetails.city", icon: "map" },
  ],
  [
    {
      key: "email",
      labelKey: "companyDetails.email",
      icon: "mail",
      keyboard: "email-address",
    },
    {
      key: "phone",
      labelKey: "companyDetails.phone",
      icon: "phone",
      keyboard: "phone-pad",
    },
    {
      key: "website",
      labelKey: "companyDetails.website",
      icon: "globe",
      keyboard: "url",
    },
  ],
];
const FIELDS = GROUPS.flat();
// Where the customer actually pays: a company has one or the other, so one
// "Bankgiro/Plusgiro" cell. The format tells them apart — a plusgiro number
// has its dash before the last digit (12345-6), a bankgiro after 3–4 (5052-8272).
const isPlusgiro = (v) => /^\d{1,7}-\d$/.test(String(v).replace(/\s/g, ""));

export default function CompanyDetailsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();

  const [companyId, setCompanyId] = useState(null);
  const [form, setForm] = useState(
    Object.fromEntries(FIELDS.map((f) => [f.key, ""])),
  );
  const [fSkatt, setFSkatt] = useState(false);
  const [giro, setGiro] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const company = await companyService.getMyCompany();
        if (!active || !company) return;
        setCompanyId(getEntityId(company));
        setForm(
          Object.fromEntries(FIELDS.map((f) => [f.key, company[f.key] || ""])),
        );
        setGiro(company.bankgiro || company.plusgiro || "");
        setBankAccount(company.bankAccount || "");
        // Stored as free text ("Godkänd för F-skatt") or a legacy "true"/"false".
        setFSkatt(Boolean(company.vatStatus) && company.vatStatus !== "false");
      } catch (error) {
        console.error("Failed to load company:", error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (saving || !companyId) return;
    setSaving(true);
    try {
      await companyService.update(companyId, {
        ...Object.fromEntries(FIELDS.map((f) => [f.key, form[f.key].trim()])),
        // Only the chosen giro is kept; the other is cleared.
        bankgiro: isPlusgiro(giro) ? "" : giro.trim(),
        plusgiro: isPlusgiro(giro) ? giro.trim() : "",
        bankAccount: bankAccount.trim(),
        // Same label the web saves — printed verbatim in the invoice footer.
        vatStatus: fSkatt ? "Godkänd för F-skatt" : "",
      });
      showSuccess({
        title: t("companyDetails.savedTitle", "Sparat"),
        message: t(
          "companyDetails.savedMessage",
          "Företagsuppgifterna sparades.",
        ),
      });
      navigation.goBack();
    } catch (error) {
      showError({
        message: getApiErrorMessage(error, t("common.error", "Fel")),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen style={styles.safe} edges={["top", "bottom"]}>
      <FormHeader
        title={t("companyDetails.title", "Företagsuppgifter")}
        onBack={() => navigation.goBack()}
        onSave={loading ? undefined : handleSave}
        saving={saving}
        saveLabel={t("common.save", "Spara")}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {GROUPS.map((group) => (
              <FieldCard key={group[0].key} style={styles.group}>
                {group.map((f, i) => (
                  <FieldRow
                    key={f.key}
                    variant="input"
                    floating
                    icon={f.icon}
                    label={t(f.labelKey)}
                    value={form[f.key]}
                    onChangeText={(v) => handleChange(f.key, v)}
                    keyboardType={f.keyboard || "default"}
                    autoCapitalize={
                      f.key === "email" || f.key === "website"
                        ? "none"
                        : "sentences"
                    }
                    isLast={i === group.length - 1}
                  />
                ))}
              </FieldCard>
            ))}
            <FieldCard style={styles.group}>
              <FieldRow
                variant="input"
                floating
                icon="bank"
                label={t("companyDetails.giro")}
                value={giro}
                onChangeText={setGiro}
                keyboardType="numbers-and-punctuation"
              />
              <FieldRow
                variant="input"
                floating
                icon="credit-card"
                label={t("companyDetails.bankAccount")}
                value={bankAccount}
                onChangeText={setBankAccount}
                keyboardType="numbers-and-punctuation"
                isLast
              />
            </FieldCard>
            <FieldCard style={styles.group}>
              <FieldRow
                variant="toggle"
                floating
                icon="check-circle"
                label={t("companyDetails.fSkatt")}
                switchValue={fSkatt}
                onSwitchChange={setFSkatt}
                isLast
              />
            </FieldCard>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </FormScreen>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    loader: { flex: 1, alignItems: "center", justifyContent: "center" },
    group: { marginBottom: layout.betweenCards * 2 },
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
    },
  });
}
