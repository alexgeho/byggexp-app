import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { companyService } from "../../services/company.service";
import { BackButton } from "../../components/common/BackButton/BackButton";
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
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          iconSource={require("../../assets/Arrow-left.png")}
        />
        <Text style={styles.headerTitle}>
          {t("companyDetails.title", "Företagsuppgifter")}
        </Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Icon name="check" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

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
            <Text style={styles.hint}>
              {t("companyDetails.hint", "Används på varje offert och faktura.")}
            </Text>
            {FIELDS.map((f) => (
              <View key={f.key} style={styles.fieldBlock}>
                <Text style={styles.label}>{t(f.labelKey)}</Text>
                <TextInput
                  style={styles.input}
                  value={form[f.key]}
                  onChangeText={(v) => handleChange(f.key, v)}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.key === "email" ? "none" : "sentences"}
                  placeholder={t(f.labelKey)}
                  placeholderTextColor={theme.content.placeholder}
                />
              </View>
            ))}
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: c.textPrimary,
      fontSize: 18,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    saveBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    loader: { flex: 1, alignItems: "center", justifyContent: "center" },
    content: { padding: 16, gap: 16 },
    hint: { color: c.textMuted, fontSize: 13, marginBottom: 4 },
    fieldBlock: { gap: 8 },
    label: {
      color: c.textPrimary,
      fontSize: 13,
      fontFamily: theme.text.fontFamily.medium,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.textPrimary,
      fontSize: 15,
    },
  });
}
