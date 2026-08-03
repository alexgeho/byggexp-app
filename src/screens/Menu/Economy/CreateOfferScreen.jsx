import React, { useMemo, useState } from "react";
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
import { getDateLocale } from "../../../utils/dateLocale";
import {
  computeTotals,
  formatMoney,
  toIsoDate,
  addDaysIso,
  emptyLineItem,
} from "../../../utils/billingTotals";
import { styles, PRIMARY, INK, PLACEHOLDER } from "./billingForm.styles";
import LineItemsEditor from "./LineItemsEditor";
import ClientPickerModal from "./ClientPickerModal";

const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function CreateOfferScreen() {
  const navigation = useNavigation();
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

  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => computeTotals(items), [items]);
  const locale = getDateLocale();

  const onSelectClient = (client) => {
    setCompanyName(client.companyName || "");
    setEmail(client.email || "");
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
    items,
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
    if (!validate()) return;
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
    }
  };

  const handleCreateAndShare = async () => {
    if (!validate()) return;
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
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { marginTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("billing.newOfferTitle")}</Text>
        <View style={{ width: 44 }} />
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
            <Icon name="chevron-down" size={16} color={INK} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.customerAdd}
            onPress={() => setClientPickerVisible(true)}
          >
            <Icon name="plus" size={20} color={INK} />
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
            <Icon name="calendar" size={18} color={INK} />
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
