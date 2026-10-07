import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { projectService, supplierInvoiceService } from "../../../services";
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import { Button, FormHeader } from "../../../components/common/ui";
import { layout } from "../../../theme/spacing";
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
      <FormHeader
        title={
          editingId
            ? t("supplierInvoices.editTitle")
            : t("supplierInvoices.addTitle")
        }
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        saving={saving}
        saveLabel={t("common.save")}
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
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.supplier")}
              value={form.supplierName}
              onChangeText={(value) => change("supplierName", value)}
            />
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.invoiceNumber")}
              value={form.invoiceNumber}
              onChangeText={(value) => change("invoiceNumber", value)}
            />
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.ocr")}
              value={form.ocr}
              onChangeText={(value) => change("ocr", value)}
              keyboardType="number-pad"
            />
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.invoiceDate")}
              value={form.invoiceDate}
              onChangeText={(value) => change("invoiceDate", value)}
            />
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.dueDate")}
              value={form.dueDate}
              onChangeText={(value) => change("dueDate", value)}
              isLast
            />
          </FieldCard>

          <FieldCard>
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.amountExclVat")}
              value={form.amountExclVat}
              onChangeText={(value) => change("amountExclVat", value)}
              keyboardType="decimal-pad"
              inputProps={{ selectTextOnFocus: true }}
            />
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.vat")}
              value={form.vat}
              onChangeText={(value) => change("vat", value)}
              keyboardType="decimal-pad"
              inputProps={{ selectTextOnFocus: true }}
            />
            <FieldRow
              floating
              label={t("supplierInvoices.totalLabel")}
              value={`${new Intl.NumberFormat("sv-SE", {
                maximumFractionDigits: 2,
              }).format(total)} kr`}
              isLast
            />
          </FieldCard>

          <FieldCard>
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.bankgiro")}
              value={form.bankgiro}
              onChangeText={(value) => change("bankgiro", value)}
            />
            <FieldRow
              variant="input"
              floating
              label={t("supplierInvoices.category")}
              value={form.category}
              onChangeText={(value) => change("category", value)}
            />
            <FieldRow
              variant="select"
              floating
              label={t("createTask.projectLabel")}
              value={form.projectName}
              onPress={() => setProjectPickerVisible(true)}
            />
            <FieldRow
              variant="input"
              multiline
              label={t("supplierInvoices.notes")}
              value={form.notes}
              onChangeText={(value) => change("notes", value)}
              isLast
            />
          </FieldCard>

          <Button
            variant="outline"
            icon="paperclip"
            title={
              attachments.length
                ? t("supplierInvoices.attachedCount", {
                    count: attachments.length,
                  })
                : t("supplierInvoices.attach")
            }
            onPress={attachPhoto}
          />
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
