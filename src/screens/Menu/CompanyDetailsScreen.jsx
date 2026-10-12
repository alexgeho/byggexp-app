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
import { SafeAreaView } from "react-native-safe-area-context";

import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { companyService } from "../../services/company.service";
import { FieldCard, FieldRow } from "../../components/common/FieldRow/FieldRow";
import { FormHeader } from "../../components/common/ui";
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
    { key: "orgNumber", labelKey: "companyDetails.orgNumber", icon: "hash" },
    { key: "vatNumber", labelKey: "companyDetails.vatNumber", icon: "percent" },
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
  // Where the customer actually pays. Without these the invoice printed an
  // empty Bankgiro box and there was nowhere in the app to fill it in.
  [
    {
      key: "bankgiro",
      labelKey: "companyDetails.bankgiro",
      icon: "credit-card",
    },
    {
      key: "plusgiro",
      labelKey: "companyDetails.plusgiro",
      icon: "credit-card",
    },
  ],
];
const FIELDS = GROUPS.flat();

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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
    </SafeAreaView>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    loader: { flex: 1, alignItems: "center", justifyContent: "center" },
    group: { marginBottom: 12 },
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
    },
  });
}
