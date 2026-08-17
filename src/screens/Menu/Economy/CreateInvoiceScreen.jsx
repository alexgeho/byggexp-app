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
import { invoiceService } from "../../../services";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { getDateLocale, formatDisplayDate } from "../../../utils/dateLocale";
import {
  computeTotals,
  deriveSettlement,
  formatMoney,
  toIsoDate,
  addDaysIso,
  emptyLineItem,
} from "../../../utils/billingTotals";
import { createStyles, PRIMARY, PLACEHOLDER } from "./billingForm.styles";
import { useTheme } from "../../../theme/ThemeContext";
import LineItemsEditor from "./LineItemsEditor";
import ClientPickerModal from "./ClientPickerModal";

const DEFAULT_TERMS_DAYS = 20;

export default function CreateInvoiceScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { t } = useTranslation();
  const { showSuccess } = useFeedback();
  const insets = useSafeAreaInsets();

  const [client, setClient] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState(
    addDaysIso(toIsoDate(new Date()), DEFAULT_TERMS_DAYS),
  );
  const [items, setItems] = useState([emptyLineItem()]);
  const [rotEnabled, setRotEnabled] = useState(false);
  const [rotLaborAmount, setRotLaborAmount] = useState("");

  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const locale = getDateLocale();
  const totals = useMemo(() => computeTotals(items), [items]);
  const settlement = useMemo(
    () =>
      deriveSettlement(totals.total, {
        rotEnabled,
        rotLaborAmount: Number(String(rotLaborAmount).replace(",", ".")) || 0,
      }),
    [totals.total, rotEnabled, rotLaborAmount],
  );

  const onSelectClient = (picked) => {
    setClient(picked);
    setCompanyName(picked.companyName || "");
    setEmail(picked.email || "");
    const termDays = Number(picked.paymentTerms) || DEFAULT_TERMS_DAYS;
    setDueDate(addDaysIso(toIsoDate(new Date()), termDays));
    setClientPickerVisible(false);
  };

  const buildPayload = () => ({
    companyName: companyName.trim(),
    customerNumber: client?.customerNumber || "",
    vatNumber: client?.vatNumber || "",
    address: client?.address || "",
    postalCode: client?.postalCode || "",
    phone: client?.phone || "",
    email: email.trim(),
    date: toIsoDate(new Date()),
    dueDate,
    reverseVAT: "false",
    rotEnabled,
    rotLaborAmount: Number(String(rotLaborAmount).replace(",", ".")) || 0,
    items: items.map(({ _key, ...item }) => item),
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

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await invoiceService.create(buildPayload());
      showSuccess({ title: t("billing.invoiceSaved") });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      Alert.alert(t("billing.saveFailedTitle"), t("billing.invoiceSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSend = async () => {
    if (!validate()) return;
    if (!email.trim()) {
      Alert.alert(t("billing.missingEmailTitle"), t("billing.missingEmail"));
      return;
    }
    try {
      setSaving(true);
      const created = await invoiceService.create(buildPayload());
      const id = created?._id || created?.id;
      const result = await invoiceService.send(id, { email: email.trim() });
      if (result?.sent) {
        showSuccess({ title: t("billing.invoiceSent") });
      } else {
        Alert.alert(t("billing.notSentTitle"), t("billing.notSentMessage"));
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to send invoice:", error);
      Alert.alert(t("billing.saveFailedTitle"), t("billing.invoiceSendFailed"));
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
          <Icon
            name="chevron-left"
            size={22}
            color={theme.content.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t("billing.newInvoiceTitle")}</Text>
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
              {companyName || t("billing.selectClient")}
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

        {/* Due date */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.dueDate")}</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputRowText}>
              {formatDisplayDate(dueDate)}
            </Text>
            <Icon name="calendar" size={18} color={theme.content.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Invoice rows */}
        <LineItemsEditor
          items={items}
          onChange={setItems}
          label={t("billing.invoiceRows")}
        />

        {/* ROT deduction */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.rot")}</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            activeOpacity={0.85}
            onPress={() => setRotEnabled((prev) => !prev)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>{t("billing.rotApply")}</Text>
              <Text style={styles.toggleSub}>{t("billing.rotHint")}</Text>
            </View>
            <View
              style={[
                styles.toggleTrack,
                {
                  backgroundColor: rotEnabled ? PRIMARY : "#E2E5EA",
                  alignItems: rotEnabled ? "flex-end" : "flex-start",
                },
              ]}
            >
              <View style={styles.toggleKnob} />
            </View>
          </TouchableOpacity>
        </View>

        {rotEnabled && (
          <View style={styles.field}>
            <Text style={styles.label}>{t("billing.rotLabor")}</Text>
            <TextInput
              style={styles.input}
              value={String(rotLaborAmount)}
              onChangeText={setRotLaborAmount}
              placeholder="0"
              placeholderTextColor={PLACEHOLDER}
              keyboardType="decimal-pad"
            />
          </View>
        )}

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
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{t("billing.total")}</Text>
            <Text style={styles.totalValue}>
              {formatMoney(totals.total, locale)}
            </Text>
          </View>
          {rotEnabled && settlement.rotDeduction > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t("billing.rotDeduction")}</Text>
              <Text style={[styles.totalValue, styles.totalValueNeg]}>
                −{formatMoney(settlement.rotDeduction, locale)}
              </Text>
            </View>
          )}
          {settlement.rounding !== 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t("billing.rounding")}</Text>
              <Text style={styles.totalValue}>
                {formatMoney(settlement.rounding, locale)}
              </Text>
            </View>
          )}
          <View style={styles.grandLine}>
            <Text style={styles.grandLabel}>{t("billing.toPay")}</Text>
            <Text style={styles.grandValue}>
              {formatMoney(settlement.roundedTotal, locale)}
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
          onPress={handleCreateAndSend}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="mail" size={16} color="#fff" />
              <Text style={[styles.btnText, styles.btnTextPrimary]}>
                {t("billing.createAndSend")}
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
          value={dueDate ? new Date(dueDate) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) setDueDate(toIsoDate(date));
          }}
          accentColor={PRIMARY}
        />
      )}
    </View>
  );
}
