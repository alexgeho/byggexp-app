import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { projectService, supplierInvoiceService } from "../../../services";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { getApiErrorMessage } from "../../../utils/apiError";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import ProjectPickerModal from "./ProjectPickerModal";

const toIsoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};
const toNumber = (value) => Number(String(value).replace(",", ".")) || 0;

// Register a bill the company has received. Until now the only way in was the
// e-mail intake, so a paper or PDF invoice handed over on site could not be
// entered from the phone at all.
export default function CreateSupplierInvoiceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { showSuccess, showError } = useFeedback();

  const editing = route.params?.invoice || null;
  const editingId = editing?._id || editing?.id || null;

  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [form, setForm] = useState({
    supplierName: "",
    invoiceNumber: "",
    invoiceDate: toIsoDate(new Date()),
    dueDate: addDays(30),
    category: "",
    ocr: "",
    bankgiro: "",
    amountExclVat: "",
    vat: "",
    notes: "",
    projectId: null,
    projectName: "",
  });

  useEffect(() => {
    let active = true;
    projectService
      .getMyProjects()
      .then((list) => {
        if (active) setProjects(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    function prefillFromInvoice() {
      if (!editing) return;
      setForm({
        supplierName: editing.supplierName || "",
        invoiceNumber: editing.invoiceNumber || "",
        invoiceDate: editing.invoiceDate || toIsoDate(new Date()),
        dueDate: editing.dueDate || addDays(30),
        category: editing.category || "",
        ocr: editing.ocr || "",
        bankgiro: editing.bankgiro || "",
        amountExclVat:
          editing.amountExclVat != null ? String(editing.amountExclVat) : "",
        vat: editing.vat != null ? String(editing.vat) : "",
        notes: editing.notes || "",
        projectId: editing.projectId || null,
        projectName: editing.projectName || "",
      });
    },
    [editing],
  );

  const change = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const total = toNumber(form.amountExclVat) + toNumber(form.vat);

  const attachPhoto = async () => {
    try {
      const picked = await pickUploadAssets({
        fileNamePrefix: "supplier-invoice",
      });
      if (picked.length) setAttachments((prev) => [...prev, ...picked]);
    } catch (error) {
      showError({ message: getApiErrorMessage(error, t("common.error")) });
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!form.supplierName.trim()) {
      showError({ message: t("supplierInvoices.supplierRequired") });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplierName: form.supplierName.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        category: form.category.trim(),
        ocr: form.ocr.trim(),
        bankgiro: form.bankgiro.trim(),
        amountExclVat: toNumber(form.amountExclVat),
        vat: toNumber(form.vat),
        total,
        notes: form.notes.trim(),
        ...(form.projectId ? { projectId: String(form.projectId) } : {}),
      };

      const saved = editingId
        ? await supplierInvoiceService.update(editingId, payload)
        : await supplierInvoiceService.create(payload);

      // The photographed bill rides along, so the entry carries its paperwork.
      const savedId = saved?._id || saved?.id || editingId;
      if (savedId && attachments.length) {
        const formData = new FormData();
        attachments.forEach((item, index) => {
          formData.append("files", {
            uri: item.uri,
            name: item.name || `supplier-invoice-${index + 1}`,
            type: item.mimeType || "application/octet-stream",
          });
        });
        await supplierInvoiceService.addAttachments(savedId, formData);
      }

      showSuccess({ title: t("supplierInvoices.savedTitle") });
      navigation.goBack();
    } catch (error) {
      showError({ message: getApiErrorMessage(error, t("common.error")) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text style={styles.headerTitle}>
          {editingId
            ? t("supplierInvoices.editTitle")
            : t("supplierInvoices.addTitle")}
        </Text>
        <TouchableOpacity
          style={styles.headerSave}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t("common.save")}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Icon name="check" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Field label={t("supplierInvoices.supplier")} styles={styles}>
            <TextInput
              style={styles.input}
              value={form.supplierName}
              onChangeText={(value) => change("supplierName", value)}
              placeholder={t("supplierInvoices.supplier")}
              placeholderTextColor={theme.content.placeholder}
            />
          </Field>

          <View style={styles.row}>
            <Field
              label={t("supplierInvoices.invoiceNumber")}
              styles={styles}
              flex
            >
              <TextInput
                style={styles.input}
                value={form.invoiceNumber}
                onChangeText={(value) => change("invoiceNumber", value)}
                placeholderTextColor={theme.content.placeholder}
              />
            </Field>
            <Field label={t("supplierInvoices.ocr")} styles={styles} flex>
              <TextInput
                style={styles.input}
                value={form.ocr}
                onChangeText={(value) => change("ocr", value)}
                keyboardType="number-pad"
                placeholderTextColor={theme.content.placeholder}
              />
            </Field>
          </View>

          <View style={styles.row}>
            <Field
              label={t("supplierInvoices.invoiceDate")}
              styles={styles}
              flex
            >
              <TextInput
                style={styles.input}
                value={form.invoiceDate}
                onChangeText={(value) => change("invoiceDate", value)}
                placeholder="ÅÅÅÅ-MM-DD"
                placeholderTextColor={theme.content.placeholder}
              />
            </Field>
            <Field label={t("supplierInvoices.dueDate")} styles={styles} flex>
              <TextInput
                style={styles.input}
                value={form.dueDate}
                onChangeText={(value) => change("dueDate", value)}
                placeholder="ÅÅÅÅ-MM-DD"
                placeholderTextColor={theme.content.placeholder}
              />
            </Field>
          </View>

          <View style={styles.row}>
            <Field
              label={t("supplierInvoices.amountExclVat")}
              styles={styles}
              flex
            >
              <TextInput
                style={styles.input}
                value={form.amountExclVat}
                onChangeText={(value) => change("amountExclVat", value)}
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholderTextColor={theme.content.placeholder}
              />
            </Field>
            <Field label={t("supplierInvoices.vat")} styles={styles} flex>
              <TextInput
                style={styles.input}
                value={form.vat}
                onChangeText={(value) => change("vat", value)}
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholderTextColor={theme.content.placeholder}
              />
            </Field>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {t("supplierInvoices.totalLabel")}
            </Text>
            <Text style={styles.totalValue}>
              {new Intl.NumberFormat("sv-SE", {
                maximumFractionDigits: 2,
              }).format(total)}{" "}
              kr
            </Text>
          </View>

          <Field label={t("supplierInvoices.bankgiro")} styles={styles}>
            <TextInput
              style={styles.input}
              value={form.bankgiro}
              onChangeText={(value) => change("bankgiro", value)}
              placeholderTextColor={theme.content.placeholder}
            />
          </Field>

          <Field label={t("supplierInvoices.category")} styles={styles}>
            <TextInput
              style={styles.input}
              value={form.category}
              onChangeText={(value) => change("category", value)}
              placeholderTextColor={theme.content.placeholder}
            />
          </Field>

          <Field label={t("createTask.projectLabel")} styles={styles}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setProjectPickerVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.pickerValue} numberOfLines={1}>
                {form.projectName || t("createTask.selectProject")}
              </Text>
            </TouchableOpacity>
          </Field>

          <Field label={t("supplierInvoices.notes")} styles={styles}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.notes}
              onChangeText={(value) => change("notes", value)}
              multiline
              placeholderTextColor={theme.content.placeholder}
            />
          </Field>

          <TouchableOpacity
            style={styles.attachBtn}
            onPress={attachPhoto}
            activeOpacity={0.85}
          >
            <Icon name="paperclip" size={18} color={theme.colors.primary} />
            <Text style={styles.attachText}>
              {attachments.length
                ? t("supplierInvoices.attachedCount", {
                    count: attachments.length,
                  })
                : t("supplierInvoices.attach")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ProjectPickerModal
        visible={projectPickerVisible}
        projects={projects}
        selectedProjectId={form.projectId}
        onClose={() => setProjectPickerVisible(false)}
        onSelect={(picked) => {
          setProjectPickerVisible(false);
          setForm((previous) => ({
            ...previous,
            projectId: picked ? picked._id || picked.id : null,
            projectName: picked?.name || "",
          }));
        }}
      />
    </SafeAreaView>
  );
}

function Field({ label, styles, children, flex = false }) {
  return (
    <View style={[styles.fieldBlock, flex && styles.fieldFlex]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
    headerSave: {
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    content: { padding: 16, gap: 14, paddingBottom: 60 },
    row: { flexDirection: "row", gap: 12 },
    fieldBlock: { gap: 8 },
    fieldFlex: { flex: 1 },
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
    pickerValue: { color: c.textPrimary, fontSize: 15 },
    textarea: { minHeight: 80, textAlignVertical: "top" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    totalLabel: {
      color: c.textMuted,
      fontSize: 14,
      fontFamily: theme.text.fontFamily.medium,
    },
    totalValue: {
      color: c.textPrimary,
      fontSize: 17,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    attachBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    attachText: {
      color: theme.colors.primary,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
    },
  });
}
