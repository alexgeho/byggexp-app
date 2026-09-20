import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { offerService } from "../../../services";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { downloadAndShareDocument } from "../../../utils/documentPreview";
import { API_BASE_URL } from "../../../config/env";
import { getDateLocale, formatDisplayDate } from "../../../utils/dateLocale";
import {
  computeTotals,
  formatMoney,
  toIsoDate,
  addDaysIso,
  emptyLineItem,
} from "../../../utils/billingTotals";
import { createStyles, PRIMARY, PLACEHOLDER } from "./billingForm.styles";
import { useTheme } from "../../../theme/ThemeContext";
import LineItemsEditor from "./LineItemsEditor";
import ClientPickerModal from "./ClientPickerModal";

export default function CreateOfferScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { t } = useTranslation();
  const { showSuccess } = useFeedback();
  const insets = useSafeAreaInsets();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [clarifications, setClarifications] = useState("");
  const [validUntil, setValidUntil] = useState(
    addDaysIso(toIsoDate(new Date()), 30),
  );
  const [items, setItems] = useState([emptyLineItem()]);
  // Contact person shown on the offer — same single default row the admin
  // OfferForm starts with (role "Projektledare", empty name).
  const [contactRole, setContactRole] = useState("Projektledare");
  const [contactName, setContactName] = useState("");

  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Guard against a double-tap: `saving` is state, so a second tap fires before
  // React re-renders the disabled button and creates a second document. A ref
  // blocks the re-entrant call synchronously (same fix the admin forms use).
  const submittingRef = useRef(false);

  const totals = useMemo(() => computeTotals(items), [items]);
  const locale = getDateLocale();

  const onSelectClient = (client) => {
    setCompanyName(client.companyName || "");
    setEmail(client.email || "");
    // The client's contact person is the natural "your reference" on the offer.
    setContactName((prev) => client.contactPerson || prev);
    setClientPickerVisible(false);
  };

  const buildPayload = () => ({
    companyName: companyName.trim(),
    email: email.trim(),
    subtitle: subtitle.trim(),
    description: description.trim(),
    clarifications: clarifications.trim(),
    validUntil,
    date: toIsoDate(new Date()),
    status: "draft",
    // Empty rows are dropped, like the admin form does.
    contactPersons: [
      { role: contactRole.trim(), name: contactName.trim() },
    ].filter((contact) => contact.role || contact.name),
    // Strip the client-only keys (row id, remembered article name).
    items: items.map((item) =>
      Object.fromEntries(
        Object.entries(item).filter(([key]) => !key.startsWith("_")),
      ),
    ),
  });

  const validate = () => {
    if (!companyName.trim()) {
      Alert.alert(
        t("billing.missingCustomerTitle"),
        t("billing.missingCustomer"),
      );
      return false;
    }
    return true;
  };

  const createOffer = async () => {
    const created = await offerService.create(buildPayload());
    return created;
  };

  const handleSaveDraft = async () => {
    if (!validate() || submittingRef.current) return;
    submittingRef.current = true;
    try {
      setSaving(true);
      await createOffer();
      showSuccess({ title: t("billing.offerSaved") });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save offer:", error);
      Alert.alert(t("billing.saveFailedTitle"), t("billing.offerSaveFailed"));
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  const handleCreateAndShare = async () => {
    if (!validate() || submittingRef.current) return;
    submittingRef.current = true;
    try {
      setSaving(true);
      const created = await createOffer();
      const id = created?._id || created?.id;
      const number = created?.offerNumber;
      if (id) {
        await downloadAndShareDocument({
          url: `${API_BASE_URL}/offers/${id}/pdf`,
          fileName: `offert-${number || id}.pdf`,
        });
        await offerService.markSent(id);
      }
      showSuccess({ title: t("billing.offerShared") });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to share offer:", error);
      Alert.alert(t("billing.shareFailedTitle"), t("billing.offerShareFailed"));
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { marginTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon
            name="chevron-left"
            size={22}
            color={theme.content.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t("billing.newOfferTitle")}</Text>
        {/* Save the draft straight from the header — the buttons at the end
            of the form are a long scroll away. */}
        <TouchableOpacity
          style={styles.headerSave}
          onPress={handleSaveDraft}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t("billing.saveDraft", "Spara utkast")}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Icon name="check" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Customer + add */}
        <View style={styles.customerRow}>
          <TouchableOpacity
            style={[styles.inputRow, styles.customerField]}
            onPress={() => setClientPickerVisible(true)}
          >
            <Text
              style={[
                styles.inputRowText,
                !companyName && styles.inputRowPlaceholder,
              ]}
              numberOfLines={1}
            >
              {companyName || t("billing.selectClientCompany")}
            </Text>
            <Icon
              name="chevron-down"
              size={16}
              color={theme.content.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.customerAdd}
            onPress={() => setClientPickerVisible(true)}
          >
            <Icon name="plus" size={20} color={theme.content.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.subtitle")}</Text>
          <TextInput
            style={styles.input}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder={t("billing.subtitlePlaceholder")}
            placeholderTextColor={PLACEHOLDER}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.offerDescription")}</Text>
          <View style={styles.textareaCard}>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder={t("billing.offerDescriptionPlaceholder")}
              placeholderTextColor={PLACEHOLDER}
              multiline
            />
          </View>
        </View>

        {/* Valid until */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.validUntil")}</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputRowText}>
              {formatDisplayDate(validUntil)}
            </Text>
            <Icon name="calendar" size={18} color={theme.content.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Offer rows */}
        <LineItemsEditor
          items={items}
          onChange={setItems}
          label={t("billing.offerRows")}
          rowLabel={t("billing.itemDescription")}
        />

        {/* Clarifications */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.clarifications")}</Text>
          <View style={styles.textareaCard}>
            <TextInput
              style={[styles.textarea, styles.textareaShort]}
              value={clarifications}
              onChangeText={setClarifications}
              placeholder={t("billing.clarificationsPlaceholder")}
              placeholderTextColor={PLACEHOLDER}
              multiline
            />
          </View>
        </View>

        {/* Contact person printed on the offer. */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.contactPerson")}</Text>
          <TextInput
            style={styles.input}
            value={contactName}
            onChangeText={setContactName}
            placeholder={t("billing.contactPerson")}
            placeholderTextColor={PLACEHOLDER}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.contactRole")}</Text>
          <TextInput
            style={styles.input}
            value={contactRole}
            onChangeText={setContactRole}
            placeholder={t("billing.contactRole")}
            placeholderTextColor={PLACEHOLDER}
          />
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{t("billing.exVat")}</Text>
            <Text style={styles.totalValue}>
              {formatMoney(totals.subtotal, locale)}
            </Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{t("billing.vat")}</Text>
            <Text style={styles.totalValue}>
              {formatMoney(totals.vat, locale)}
            </Text>
          </View>
          <View style={styles.grandLine}>
            <Text style={styles.grandLabel}>{t("billing.toPay")}</Text>
            <Text style={styles.grandValue}>
              {formatMoney(totals.total, locale)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.btn, styles.btnGhost, saving && styles.btnDisabled]}
          onPress={handleSaveDraft}
          disabled={saving}
        >
          <Text style={[styles.btnText, styles.btnTextGhost]}>
            {t("billing.saveDraft")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
          onPress={handleCreateAndShare}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="share" size={16} color="#fff" />
              <Text style={[styles.btnText, styles.btnTextPrimary]}>
                {t("billing.createAndShare")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ClientPickerModal
        visible={clientPickerVisible}
        onClose={() => setClientPickerVisible(false)}
        onSelect={onSelectClient}
      />

      {showDatePicker && (
        <DateTimePicker
          value={validUntil ? new Date(validUntil) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) setValidUntil(toIsoDate(date));
          }}
          accentColor={PRIMARY}
        />
      )}
    </View>
  );
}
