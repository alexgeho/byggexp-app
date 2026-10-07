import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
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
import { createStyles, PRIMARY } from "./billingForm.styles";
import { useTheme } from "../../../theme/ThemeContext";
import LineItemsEditor from "./LineItemsEditor";
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import {
  Button,
  FormFooter,
  HeaderCheckButton,
} from "../../../components/common/ui";
import ClientPickerModal from "./ClientPickerModal";

export default function CreateOfferScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // A draft opened from the list fills the form in, and saving updates it.
  const editingOffer = route.params?.offer || null;
  const editingId = editingOffer?._id || editingOffer?.id || null;
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

  useEffect(
    function prefillFromOffer() {
      if (!editingOffer) return;
      setCompanyName(editingOffer.companyName || "");
      setEmail(editingOffer.email || "");
      setSubtitle(editingOffer.subtitle || "");
      setDescription(editingOffer.description || "");
      setClarifications(editingOffer.clarifications || "");
      if (editingOffer.validUntil) setValidUntil(editingOffer.validUntil);
      setItems(
        Array.isArray(editingOffer.items) && editingOffer.items.length
          ? editingOffer.items.map((item) => ({ ...emptyLineItem(), ...item }))
          : [emptyLineItem()],
      );
      const contact = Array.isArray(editingOffer.contactPersons)
        ? editingOffer.contactPersons[0]
        : null;
      if (contact) {
        setContactRole(contact.role || "Projektledare");
        setContactName(contact.name || "");
      }
    },
    [editingOffer],
  );

  const createOffer = async () => {
    const created = editingId
      ? await offerService.update(editingId, buildPayload())
      : await offerService.create(buildPayload());
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
        <Text style={styles.title}>
          {editingId ? t("billing.editOfferTitle") : t("billing.newOfferTitle")}
        </Text>
        {/* Save the draft straight from the header — the buttons at the end
            of the form are a long scroll away. */}
        <HeaderCheckButton
          onPress={handleSaveDraft}
          loading={saving}
          accessibilityLabel={t("billing.saveDraft", "Spara utkast")}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FieldCard>
          <FieldRow
            variant="select"
            floating
            label={t("billing.selectClientCompany")}
            value={companyName}
            onPress={() => setClientPickerVisible(true)}
          />
          <FieldRow
            variant="input"
            floating
            label={t("billing.subtitle")}
            value={subtitle}
            onChangeText={setSubtitle}
          />
          <FieldRow
            variant="select"
            floating
            label={t("billing.validUntil")}
            value={formatDisplayDate(validUntil)}
            onPress={() => setShowDatePicker(true)}
          />
          <FieldRow
            variant="input"
            multiline
            label={t("billing.offerDescription")}
            value={description}
            onChangeText={setDescription}
            isLast
          />
        </FieldCard>

        {/* Offer rows */}
        <LineItemsEditor
          items={items}
          onChange={setItems}
          label={t("billing.offerRows")}
          rowLabel={t("billing.itemDescription")}
        />

        <FieldCard>
          <FieldRow
            variant="input"
            multiline
            label={t("billing.clarifications")}
            value={clarifications}
            onChangeText={setClarifications}
          />
          {/* Contact person printed on the offer. */}
          <FieldRow
            variant="input"
            floating
            label={t("billing.contactPerson")}
            value={contactName}
            onChangeText={setContactName}
          />
          <FieldRow
            variant="input"
            floating
            label={t("billing.contactRole")}
            value={contactRole}
            onChangeText={setContactRole}
            isLast
          />
        </FieldCard>

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

      <FormFooter>
        <Button
          variant="outline"
          title={t("billing.saveDraft")}
          onPress={handleSaveDraft}
          disabled={saving}
        />
        <Button
          icon="share"
          title={t("billing.createAndShare")}
          onPress={handleCreateAndShare}
          loading={saving}
        />
      </FormFooter>

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
