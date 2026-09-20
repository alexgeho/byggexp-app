import React, { useContext, useMemo, useRef, useState } from "react";
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
import AuthContext from "../../../contexts/AuthContext";
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
import ProjectPickerModal from "./ProjectPickerModal";

const DEFAULT_TERMS_DAYS = 20;

export default function CreateInvoiceScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { t } = useTranslation();
  const { showSuccess } = useFeedback();
  const { user } = useContext(AuthContext);
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
  // Skatteverket needs the buyer's personnummer and the property designation on
  // a ROT invoice — without them the deduction can't be claimed.
  const [rotPersonalNumber, setRotPersonalNumber] = useState("");
  const [rotProperty, setRotProperty] = useState("");
  // Byggmoms (reverse charge): carried from the client, like the admin form.
  const [reverseVAT, setReverseVAT] = useState(false);
  // References printed on the invoice: ours defaults to the person issuing it,
  // yours to the client's contact person.
  const [ourReference, setOurReference] = useState(() => user?.name || "");
  const [yourReference, setYourReference] = useState("");
  // Optional link to a project — makes the invoice roll up into that project's
  // economy ("Fakturerat"). null = not linked.
  const [project, setProject] = useState(null);
  // Order reference (littera). Auto-filled from the chosen project, editable.
  const [orderReference, setOrderReference] = useState("");

  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const isPrivateClient = client?.clientType === "private";
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Guard against a double-tap: `saving` is state, so a second tap fires before
  // React re-renders the disabled button and creates a second document. A ref
  // blocks the re-entrant call synchronously (same fix the admin forms use).
  const submittingRef = useRef(false);

  const locale = getDateLocale();
  const totals = useMemo(
    () => computeTotals(items, { reverseVAT }),
    [items, reverseVAT],
  );
  const settlement = useMemo(
    () =>
      deriveSettlement(totals.total, {
        rotEnabled: isPrivateClient && rotEnabled,
        rotLaborAmount: Number(String(rotLaborAmount).replace(",", ".")) || 0,
      }),
    [totals.total, rotEnabled, rotLaborAmount, isPrivateClient],
  );

  const onSelectClient = (picked) => {
    setClient(picked);
    // Same carry-over the admin InvoiceForm does when a client is picked.
    setReverseVAT(Boolean(picked?.reverseVAT));
    setYourReference((prev) => picked?.contactPerson || prev);
    // ROT is a deduction on a private person's labour cost — a company customer
    // can't have it. Same rule the admin InvoiceForm applies: switching to a
    // company clears the flag so a stale toggle can't ride along.
    if (picked?.clientType !== "private") {
      setRotEnabled(false);
      setRotLaborAmount("");
      setRotPersonalNumber("");
      setRotProperty("");
    }
    setCompanyName(picked.companyName || "");
    setEmail(picked.email || "");
    const termDays = Number(picked.paymentTerms) || DEFAULT_TERMS_DAYS;
    setDueDate(addDaysIso(toIsoDate(new Date()), termDays));
    setClientPickerVisible(false);
  };

  // Mirrors the admin InvoiceForm: selecting a project drops its name into the
  // first line's description (only when empty) and its order reference (littera)
  // into Orderreferens (only when empty). null clears the link.
  const onSelectProject = (picked) => {
    setProjectPickerVisible(false);
    setProject(picked);
    if (!picked) return;
    if (picked.littera && !orderReference.trim()) {
      setOrderReference(String(picked.littera));
    }
    if (picked.name) {
      setItems((prev) => {
        const next = prev.length ? [...prev] : [emptyLineItem()];
        if (!String(next[0].description || "").trim()) {
          next[0] = { ...next[0], description: picked.name };
        }
        return next;
      });
    }
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
    city: client?.city || "",
    deliveryDate: toIsoDate(new Date()),
    status: "draft",
    // The backend stores reverseVAT as a string, like the admin form sends it.
    reverseVAT: reverseVAT ? "true" : "false",
    ...(client?.paymentTerms
      ? { paymentTerms: String(client.paymentTerms) }
      : {}),
    ...(ourReference.trim() ? { ourReference: ourReference.trim() } : {}),
    ...(yourReference.trim() ? { yourReference: yourReference.trim() } : {}),
    // Belt and braces: a company customer never carries ROT, whatever the
    // toggle happened to be before the customer was switched.
    rotEnabled: isPrivateClient && rotEnabled,
    rotLaborAmount:
      isPrivateClient && rotEnabled
        ? Number(String(rotLaborAmount).replace(",", ".")) || 0
        : 0,
    ...(isPrivateClient && rotEnabled
      ? {
          rotPersonalNumber: rotPersonalNumber.trim(),
          rotProperty: rotProperty.trim(),
        }
      : {}),
    // Optional: link to a project so it counts toward the project economy.
    ...(project?._id || project?.id
      ? { projectId: project._id || project.id }
      : {}),
    ...(orderReference.trim() ? { orderReference: orderReference.trim() } : {}),
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
    if (!validate() || submittingRef.current) return;
    submittingRef.current = true;
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
      submittingRef.current = false;
    }
  };

  const handleCreateAndSend = async () => {
    if (!validate() || submittingRef.current) return;
    submittingRef.current = true;
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

        {/* Project (optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.projectOptional")}</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setProjectPickerVisible(true)}
          >
            <Text
              style={[
                styles.inputRowText,
                !project && styles.inputRowPlaceholder,
              ]}
              numberOfLines={1}
            >
              {project?.name || t("billing.selectProject")}
            </Text>
            <Icon
              name="chevron-down"
              size={16}
              color={theme.content.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Order reference (littera) — auto-filled from the project, editable */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.orderReference")}</Text>
          <TextInput
            style={styles.input}
            value={orderReference}
            onChangeText={setOrderReference}
            placeholder={t("billing.orderReferencePlaceholder")}
            placeholderTextColor={PLACEHOLDER}
          />
        </View>

        {/* References printed on the invoice, like the admin form. */}
        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.ourReference")}</Text>
          <TextInput
            style={styles.input}
            value={ourReference}
            onChangeText={setOurReference}
            placeholder={t("billing.ourReference")}
            placeholderTextColor={PLACEHOLDER}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("billing.yourReference")}</Text>
          <TextInput
            style={styles.input}
            value={yourReference}
            onChangeText={setYourReference}
            placeholder={t("billing.yourReference")}
            placeholderTextColor={PLACEHOLDER}
          />
        </View>

        {/* Invoice rows */}
        <LineItemsEditor
          items={items}
          onChange={setItems}
          label={t("billing.invoiceRows")}
        />

        {/* ROT deduction — private customers only. */}
        {isPrivateClient ? (
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
        ) : null}

        {isPrivateClient && rotEnabled && (
          <View style={styles.field}>
            <Text style={styles.label}>{t("billing.rotPersonalNumber")}</Text>
            <TextInput
              style={styles.input}
              value={rotPersonalNumber}
              onChangeText={setRotPersonalNumber}
              placeholder={t("billing.rotPersonalNumberPlaceholder")}
              placeholderTextColor={PLACEHOLDER}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}

        {isPrivateClient && rotEnabled && (
          <View style={styles.field}>
            <Text style={styles.label}>{t("billing.rotProperty")}</Text>
            <TextInput
              style={styles.input}
              value={rotProperty}
              onChangeText={setRotProperty}
              placeholder={t("billing.rotPropertyPlaceholder")}
              placeholderTextColor={PLACEHOLDER}
            />
          </View>
        )}

        {isPrivateClient && rotEnabled && (
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

      <ProjectPickerModal
        visible={projectPickerVisible}
        onClose={() => setProjectPickerVisible(false)}
        onSelect={onSelectProject}
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
