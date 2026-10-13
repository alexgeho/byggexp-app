import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";

import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { clientService } from "../../../services/client.service";
import { companyService } from "../../../services/company.service";
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import {
  Button,
  ChoiceChips,
  FormFooter,
  FormHeader,
  FormScreen,
  SectionTitle,
} from "../../../components/common/ui";
import { layout } from "../../../theme/spacing";
import { getApiErrorMessage } from "../../../utils/apiError";

// New / edit client — mirrors the admin ClientCreateForm (same fields, one scroll form on
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

// A saved client back into form values — the inputs only take strings, and
// fields the client never had fall back to the empty defaults.
const toForm = (client) => {
  const form = { ...EMPTY };
  Object.keys(EMPTY).forEach((key) => {
    const value = client?.[key];
    if (value === undefined || value === null) return;
    form[key] =
      typeof EMPTY[key] === "boolean" ? Boolean(value) : String(value);
  });
  return form;
};

export default function CreateClientScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();
  // Tapping a client in the list opens this same form, filled in.
  const editingClient = useRoute().params?.client;
  const editingId = editingClient?._id || editingClient?.id;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() =>
    editingClient ? toForm(editingClient) : EMPTY,
  );
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
    // An existing client keeps its own number, country and currency.
    if (editingId) return undefined;
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
      const payload = {
        ...form,
        hourlyRate: Number(form.hourlyRate) || 0,
        reverseVAT: isCompany && Boolean(form.reverseVAT),
      };
      if (editingId) {
        await clientService.update(editingId, payload);
      } else {
        await clientService.create({ ...payload, companyId: user?.companyId });
        await resetForm();
      }
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

  const saveLabel = editingId
    ? t("common.save", "Spara")
    : t("clientForm.add", "Lägg till klient");

  // One input row inside a FieldCard: the label is shown once (no placeholder
  // echoing it). `last` drops the separator under the final row of a card.
  const field = (k, label, opts = {}) => {
    const { editable = true, last = false, icon, ...rest } = opts;
    return (
      <FieldRow
        key={k}
        icon={icon}
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
    <FormScreen style={styles.safe} edges={["top"]}>
      <FormHeader
        title={
          editingId
            ? t("clientForm.editTitle", "Redigera klient")
            : t("clientForm.addTitle", "Ny klient")
        }
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        saving={saving}
        saveLabel={saveLabel}
      />

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
                  { icon: "briefcase" },
                )}
                {field(
                  "customerNumber",
                  t("clientForm.customerNumber", "Kundnr"),
                  { editable: false, icon: "hash" },
                )}
                {field("orgNumber", t("clientForm.orgNumber", "Org.nr"), {
                  icon: "id-card",
                })}
                {field("vatNumber", t("clientForm.vatNumber", "Momsreg.nr"), {
                  icon: "receipt",
                })}
                {field(
                  "contactPerson",
                  t("clientForm.contactPerson", "Kontaktperson"),
                  { last: true, icon: "user" },
                )}
              </>
            ) : (
              <>
                {field(
                  "firstName",
                  `${t("clientForm.firstName", "Förnamn")} *`,
                  { icon: "user" },
                )}
                {field("lastName", t("clientForm.lastName", "Efternamn"), {
                  icon: "user",
                })}
                {field(
                  "personalNumber",
                  t("clientForm.personalNumber", "Personnummer"),
                  { icon: "id-card" },
                )}
                {field(
                  "customerNumber",
                  t("clientForm.customerNumber", "Kundnr"),
                  { editable: false, last: true, icon: "hash" },
                )}
              </>
            )}
          </FieldCard>

          <View>
            <SectionTitle inset>
              {t("clientForm.address", "Adress")}
            </SectionTitle>
            <FieldCard>
              {field("address", t("clientForm.address", "Adress"), {
                icon: "map-pin",
              })}
              {field("postalCode", t("clientForm.postalCode", "Postnummer"), {
                icon: "inbox",
              })}
              {field("city", t("clientForm.city", "Ort"), { icon: "map" })}
              {field("country", t("clientForm.country", "Land"), {
                icon: "flag",
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
                icon: "mail",
                keyboardType: "email-address",
                autoCapitalize: "none",
              })}
              {field("phone", t("clientForm.phone", "Telefon"), {
                icon: "phone",
                keyboardType: "phone-pad",
              })}
              {field("mobile", t("clientForm.mobile", "Mobil"), {
                icon: "smartphone",
                keyboardType: "phone-pad",
              })}
              {field("website", t("clientForm.website", "Webbplats"), {
                icon: "globe",
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
                icon="calendar"
                label={`${t("clientForm.paymentTerms", "Betalningsvillkor")} · ${t("clientForm.daysNet", "dagar netto")}`}
              >
                <ChoiceChips
                  values={PAYMENT_TERMS}
                  value={form.paymentTerms}
                  onChange={(v) => set("paymentTerms", v)}
                />
              </FieldRow>
              <FieldRow
                icon="dollar-sign"
                label={t("clientForm.currency", "Valuta")}
              >
                <ChoiceChips
                  values={CURRENCIES}
                  value={form.currency}
                  onChange={(v) => set("currency", v)}
                />
              </FieldRow>
              {field("discount", t("clientForm.discount", "Kundrabatt %"), {
                icon: "percent",
                keyboardType: "numeric",
              })}
              {field(
                "hourlyRate",
                t("clientForm.hourlyRate", "Timpris (SEK)"),
                { keyboardType: "numeric", last: !isCompany, icon: "clock" },
              )}
              {/* Byggmoms is between businesses — a private person never carries
                  it, so the toggle isn't offered (same as the web form). */}
              {isCompany ? (
                <FieldRow
                  variant="toggle"
                  icon="repeat"
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
              icon: "file-text",
              multiline: true,
              last: true,
            })}
          </FieldCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <FormFooter>
        <Button title={saveLabel} onPress={handleSave} loading={saving} />
      </FormFooter>
    </FormScreen>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
      gap: layout.betweenCards * 2,
    },
  });
}
