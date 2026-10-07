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
// edit the invoice/offer-relevant fields, save. Theme-aware throughout.
const FIELDS = [
  { key: "name", labelKey: "companyDetails.name", keyboard: "default" },
  {
    key: "orgNumber",
    labelKey: "companyDetails.orgNumber",
    keyboard: "default",
  },
  { key: "address", labelKey: "companyDetails.address", keyboard: "default" },
  { key: "email", labelKey: "companyDetails.email", keyboard: "email-address" },
  { key: "phone", labelKey: "companyDetails.phone", keyboard: "phone-pad" },
  // Where the customer actually pays. Without these the invoice printed an
  // empty Bankgiro box and there was nowhere in the app to fill it in.
  { key: "bankgiro", labelKey: "companyDetails.bankgiro", keyboard: "default" },
  { key: "plusgiro", labelKey: "companyDetails.plusgiro", keyboard: "default" },
];

export default function CompanyDetailsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();

  const [companyId, setCompanyId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    orgNumber: "",
    address: "",
    email: "",
    phone: "",
    bankgiro: "",
    plusgiro: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const company = await companyService.getMyCompany();
        if (!active || !company) return;
        setCompanyId(getEntityId(company));
        setForm({
          name: company.name || "",
          orgNumber: company.orgNumber || "",
          address: company.address || "",
          email: company.email || "",
          phone: company.phone || "",
          bankgiro: company.bankgiro || "",
          plusgiro: company.plusgiro || "",
        });
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
        name: form.name.trim(),
        orgNumber: form.orgNumber.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bankgiro: form.bankgiro.trim(),
        plusgiro: form.plusgiro.trim(),
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
            <FieldCard>
              {FIELDS.map((f, i) => (
                <FieldRow
                  key={f.key}
                  variant="input"
                  floating
                  label={t(f.labelKey)}
                  value={form[f.key]}
                  onChangeText={(v) => handleChange(f.key, v)}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.key === "email" ? "none" : "sentences"}
                  isLast={i === FIELDS.length - 1}
                />
              ))}
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
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
    },
  });
}
