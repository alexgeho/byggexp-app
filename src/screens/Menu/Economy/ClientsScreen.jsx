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
  Switch,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { clientService } from "../../../services/client.service";
import { companyService } from "../../../services/company.service";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { getApiErrorMessage } from "../../../utils/apiError";

// Clients — mirrors the admin ClientCreateForm (same fields, one scroll form on
// mobile instead of a 3-step wizard): identity (company/private), address,
// contact, payment. Auto customer number, country-driven currency default.
const PAYMENT_TERMS = ["10", "20", "30", "40", "50"];
const CURRENCIES = ["SEK", "EUR", "USD", "NOK", "DKK"];
const currencyForCountry = (co) => (co === "NO" ? "NOK" : "SEK");
const countryName = (co) => (co === "NO" ? "Norge" : "Sverige");

const EMPTY = {
  clientType: "company",
  companyName: "",
  customerNumber: "",
  orgNumber: "",
  vatNumber: "",
  contactPerson: "",
  firstName: "",
  lastName: "",
  personalNumber: "",
  address: "",
  postalCode: "",
  city: "",
  country: "Sverige",
  email: "",
  phone: "",
  mobile: "",
  website: "",
  paymentTerms: "30",
  currency: "SEK",
  discount: "0",
  hourlyRate: "",
  reverseVAT: false,
  notes: "",
};

// Module-level (stable) input row so typing doesn't remount and drop focus.
function LabeledInput({
  label,
  value,
  onChangeText,
  styles,
  placeholderColor,
  editable = true,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          !editable && styles.readOnly,
          multiline && styles.textarea,
        ]}
        value={String(value ?? "")}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={label}
        placeholderTextColor={placeholderColor}
      />
    </View>
  );
}

export default function ClientsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const isCompany = form.clientType === "company";

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadNextNumber = async () => {
    try {
      const next = await clientService.getNextNumber();
      set(
        "customerNumber",
        typeof next === "string" ? next : next?.number || "",
      );
    } catch {
      /* best-effort */
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [list, company] = await Promise.all([
          clientService.getAll().catch(() => []),
          companyService.getMyCompany().catch(() => null),
        ]);
        if (!active) return;
        setClients(Array.isArray(list) ? list : []);
        const co = company?.country || "SE";
        setForm((prev) => ({
          ...prev,
          country: countryName(co),
          currency: currencyForCountry(co),
        }));
      } finally {
        if (active) setLoading(false);
      }
    })();
    loadNextNumber();
    return () => {
      active = false;
    };
  }, []);

  const resetForm = async () => {
    setForm(EMPTY);
    await loadNextNumber();
  };

  const handleSave = async () => {
    if (saving) return;
    if (isCompany && !form.companyName.trim()) {
      showError({ message: t("clientForm.companyNameRequired") });
      return;
    }
    if (!isCompany && (!form.firstName.trim() || !form.lastName.trim())) {
      showError({ message: t("clientForm.nameRequired") });
      return;
    }
    setSaving(true);
    try {
      const created = await clientService.create({
        ...form,
        companyId: user?.companyId,
        hourlyRate: Number(form.hourlyRate) || 0,
        reverseVAT: Boolean(form.reverseVAT),
      });
      setClients((prev) => [created, ...prev]);
      await resetForm();
      showSuccess({ title: t("clientForm.savedTitle") });
    } catch (error) {
      showError({
        message: getApiErrorMessage(error, t("common.error", "Fel")),
      });
    } finally {
      setSaving(false);
    }
  };

  // Field helper — returns a <LabeledInput> element (stable type), so calling it
  // each render does NOT remount the input.
  const field = (k, label, opts = {}) => (
    <LabeledInput
      label={label}
      value={form[k]}
      onChangeText={(v) => set(k, v)}
      styles={styles}
      placeholderColor={theme.content.placeholder}
      {...opts}
    />
  );

  const chipRow = (values, current, onPick, fmt) => (
    <View style={styles.chips}>
      {values.map((v) => {
        const active = current === v;
        return (
          <TouchableOpacity
            key={v}
            style={[
              styles.chip,
              active && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => onPick(v)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && { color: "#FFFFFF" }]}>
              {fmt ? fmt(v) : v}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text style={styles.headerTitle}>
          {t("clientForm.title", "Klienter")}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>
            {t("clientForm.details", "Uppgifter")}
          </Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              {t("clientForm.clientType", "Kundtyp")}
            </Text>
            {chipRow(
              ["company", "private"],
              form.clientType,
              (v) => set("clientType", v),
              (v) =>
                v === "company"
                  ? t("clientForm.business", "Företag")
                  : t("clientForm.private", "Privatperson"),
            )}
          </View>

          {isCompany ? (
            <>
              {field(
                "companyName",
                `${t("clientForm.companyName", "Företagsnamn")} *`,
              )}
              {field(
                "customerNumber",
                t("clientForm.customerNumber", "Kundnr"),
                {
                  editable: false,
                },
              )}
              {field("orgNumber", t("clientForm.orgNumber", "Org.nr"))}
              {field("vatNumber", t("clientForm.vatNumber", "Momsreg.nr"))}
              {field(
                "contactPerson",
                t("clientForm.contactPerson", "Kontaktperson"),
              )}
            </>
          ) : (
            <>
              {field("firstName", `${t("clientForm.firstName", "Förnamn")} *`)}
              {field("lastName", `${t("clientForm.lastName", "Efternamn")} *`)}
              {field(
                "personalNumber",
                t("clientForm.personalNumber", "Personnummer"),
              )}
              {field(
                "customerNumber",
                t("clientForm.customerNumber", "Kundnr"),
                {
                  editable: false,
                },
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>
            {t("clientForm.address", "Adress")}
          </Text>
          {field("address", t("clientForm.address", "Adress"))}
          {field("postalCode", t("clientForm.postalCode", "Postnummer"))}
          {field("city", t("clientForm.city", "Ort"))}
          {field("country", t("clientForm.country", "Land"))}

          <Text style={styles.sectionTitle}>
            {t("clientForm.contact", "Kontakt")}
          </Text>
          {field("email", t("clientForm.email", "E-post"), {
            keyboardType: "email-address",
            autoCapitalize: "none",
          })}
          {field("phone", t("clientForm.phone", "Telefon"), {
            keyboardType: "phone-pad",
          })}
          {field("mobile", t("clientForm.mobile", "Mobil"), {
            keyboardType: "phone-pad",
          })}
          {field("website", t("clientForm.website", "Webbplats"), {
            autoCapitalize: "none",
          })}

          <Text style={styles.sectionTitle}>
            {t("clientForm.payment", "Betalning")}
          </Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              {t("clientForm.paymentTerms", "Betalningsvillkor")}
            </Text>
            {chipRow(
              PAYMENT_TERMS,
              form.paymentTerms,
              (v) => set("paymentTerms", v),
              (v) => `${v} ${t("clientForm.daysNet", "dagar netto")}`,
            )}
          </View>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              {t("clientForm.currency", "Valuta")}
            </Text>
            {chipRow(CURRENCIES, form.currency, (v) => set("currency", v))}
          </View>
          {field("discount", t("clientForm.discount", "Kundrabatt %"), {
            keyboardType: "numeric",
          })}
          {field("hourlyRate", t("clientForm.hourlyRate", "Timpris (SEK)"), {
            keyboardType: "numeric",
          })}
          <View style={[styles.fieldBlock, styles.switchRow]}>
            <Text style={styles.label}>
              {t("clientForm.reverseVAT", "Omvänd moms")}
            </Text>
            <Switch
              value={form.reverseVAT}
              onValueChange={(v) => set("reverseVAT", v)}
              trackColor={{ true: "#34C759" }}
            />
          </View>
          {field("notes", t("clientForm.notes", "Anteckningar"), {
            multiline: true,
          })}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {t("clientForm.add", "Lägg till klient")}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            {t("clientForm.existing", "Dina klienter")}
          </Text>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : clients.length === 0 ? (
            <Text style={styles.empty}>
              {t("clientForm.emptyList", "Inga klienter än.")}
            </Text>
          ) : (
            clients.map((cl, i) => (
              <View key={cl._id || cl.id || i} style={styles.listRow}>
                <Text style={styles.listName} numberOfLines={1}>
                  {cl.companyName ||
                    [cl.firstName, cl.lastName].filter(Boolean).join(" ") ||
                    t("common.noName", "—")}
                </Text>
                <Text style={styles.listMeta}>{cl.customerNumber || ""}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 16,
      fontFamily: theme.text.fontFamily.semiBold,
      marginTop: 8,
    },
    fieldBlock: { gap: 8 },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
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
    readOnly: { opacity: 0.6 },
    textarea: { minHeight: 80, textAlignVertical: "top" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipText: {
      color: c.textPrimary,
      fontSize: 14,
      fontFamily: theme.text.fontFamily.medium,
    },
    saveBtn: {
      marginTop: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      paddingVertical: 15,
      alignItems: "center",
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    empty: { color: c.textMuted, fontSize: 14 },
    listRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      gap: 12,
    },
    listName: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
    },
    listMeta: { color: c.textMuted, fontSize: 13 },
  });
}
