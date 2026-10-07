import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import {
  Button,
  ChoiceChips,
  HeaderCheckButton,
  SectionTitle,
} from "../../../components/common/ui";
import { layout } from "../../../theme/spacing";
import { getApiErrorMessage } from "../../../utils/apiError";

// New client — mirrors the admin ClientCreateForm (same fields, one scroll form on
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

export default function CreateClientScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();

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
        const company = await companyService.getMyCompany().catch(() => null);
        if (!active) return;
        const co = company?.country || "SE";
        setForm((prev) => ({
          ...prev,
          country: countryName(co),
          currency: currencyForCountry(co),
        }));
      } catch {
        /* the country default is best-effort */
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
    if (!isCompany && !form.firstName.trim()) {
      showError({ message: t("clientForm.nameRequired") });
      return;
    }
    setSaving(true);
    try {
      await clientService.create({
        ...form,
        companyId: user?.companyId,
        hourlyRate: Number(form.hourlyRate) || 0,
        reverseVAT: isCompany && Boolean(form.reverseVAT),
      });
      await resetForm();
      showSuccess({ title: t("clientForm.savedTitle") });
      // Back to the list, which refetches on focus and shows the new client.
      navigation.goBack();
    } catch (error) {
      showError({
        message: getApiErrorMessage(error, t("common.error", "Fel")),
      });
    } finally {
      setSaving(false);
    }
  };

  // One input row inside a FieldCard: the label is shown once (no placeholder
  // echoing it). `last` drops the separator under the final row of a card.
  const field = (k, label, opts = {}) => {
    const { editable = true, last = false, ...rest } = opts;
    return (
      <FieldRow
        key={k}
        variant={editable ? "input" : "readonly"}
        floating
        label={label}
        value={String(form[k] ?? "")}
        onChangeText={(v) => set(k, v)}
        isLast={last}
        {...rest}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text style={styles.headerTitle}>
          {t("clientForm.addTitle", "Ny klient")}
        </Text>
        {/* Save from the header too — the button at the far end of the form
            is a long scroll away once the company name is all you needed. */}
        <HeaderCheckButton
          onPress={handleSave}
          loading={saving}
          accessibilityLabel={t("clientForm.add", "Lägg till klient")}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <FieldCard>
            <FieldRow label={t("clientForm.clientType", "Kundtyp")} isLast>
              <ChoiceChips
                values={["company", "private"]}
                value={form.clientType}
                onChange={(v) => set("clientType", v)}
                format={(v) =>
                  v === "company"
                    ? t("clientForm.business", "Företag")
                    : t("clientForm.private", "Privatperson")
                }
              />
            </FieldRow>
          </FieldCard>

          <FieldCard>
            {isCompany ? (
              <>
                {field(
                  "companyName",
                  `${t("clientForm.companyName", "Företagsnamn")} *`,
                )}
                {field(
                  "customerNumber",
                  t("clientForm.customerNumber", "Kundnr"),
                  { editable: false },
                )}
                {field("orgNumber", t("clientForm.orgNumber", "Org.nr"))}
                {field("vatNumber", t("clientForm.vatNumber", "Momsreg.nr"))}
                {field(
                  "contactPerson",
                  t("clientForm.contactPerson", "Kontaktperson"),
                  { last: true },
                )}
              </>
            ) : (
              <>
                {field(
                  "firstName",
                  `${t("clientForm.firstName", "Förnamn")} *`,
                )}
                {field("lastName", t("clientForm.lastName", "Efternamn"))}
                {field(
                  "personalNumber",
                  t("clientForm.personalNumber", "Personnummer"),
                )}
                {field(
                  "customerNumber",
                  t("clientForm.customerNumber", "Kundnr"),
                  { editable: false, last: true },
                )}
              </>
            )}
          </FieldCard>

          <View>
            <SectionTitle inset>
              {t("clientForm.address", "Adress")}
            </SectionTitle>
            <FieldCard>
              {field("address", t("clientForm.address", "Adress"))}
              {field("postalCode", t("clientForm.postalCode", "Postnummer"))}
              {field("city", t("clientForm.city", "Ort"))}
              {field("country", t("clientForm.country", "Land"), {
                last: true,
              })}
            </FieldCard>
          </View>

          <View>
            <SectionTitle inset>
              {t("clientForm.contact", "Kontakt")}
            </SectionTitle>
            <FieldCard>
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
                last: true,
              })}
            </FieldCard>
          </View>

          <View>
            <SectionTitle inset>
              {t("clientForm.payment", "Betalning")}
            </SectionTitle>
            <FieldCard>
              <FieldRow
                label={`${t("clientForm.paymentTerms", "Betalningsvillkor")} · ${t("clientForm.daysNet", "dagar netto")}`}
              >
                <ChoiceChips
                  values={PAYMENT_TERMS}
                  value={form.paymentTerms}
                  onChange={(v) => set("paymentTerms", v)}
                />
              </FieldRow>
              <FieldRow label={t("clientForm.currency", "Valuta")}>
                <ChoiceChips
                  values={CURRENCIES}
                  value={form.currency}
                  onChange={(v) => set("currency", v)}
                />
              </FieldRow>
              {field("discount", t("clientForm.discount", "Kundrabatt %"), {
                keyboardType: "numeric",
              })}
              {field(
                "hourlyRate",
                t("clientForm.hourlyRate", "Timpris (SEK)"),
                { keyboardType: "numeric", last: !isCompany },
              )}
              {/* Byggmoms is between businesses — a private person never carries
                  it, so the toggle isn't offered (same as the web form). */}
              {isCompany ? (
                <FieldRow
                  variant="toggle"
                  floating
                  label={t("clientForm.reverseVAT", "Omvänd moms")}
                  switchValue={form.reverseVAT}
                  onSwitchChange={(v) => set("reverseVAT", v)}
                  isLast
                />
              ) : null}
            </FieldCard>
          </View>

          <FieldCard>
            {field("notes", t("clientForm.notes", "Anteckningar"), {
              multiline: true,
              last: true,
            })}
          </FieldCard>

          <Button
            title={t("clientForm.add", "Lägg till klient")}
            onPress={handleSave}
            loading={saving}
          />
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
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
      gap: layout.betweenCards * 2,
    },
  });
}
