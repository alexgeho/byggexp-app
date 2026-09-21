import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AuthContext from "../../../contexts/AuthContext";
import { expenseService, projectService } from "../../../services";
import { createStyles } from "./ExpenseReviewSheet.styles";
import { useTheme } from "../../../theme/ThemeContext";

const toNumber = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

// Light review of a scanned receipt before saving it as an utlägg. Project is
// taken from the active shift; without a shift the worker picks one.
export default function ExpenseReviewSheet({
  visible,
  asset,
  scanned,
  shift,
  onClose,
  onSaved,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { selectedProject } = useContext(AuthContext);
  const selectedProjectId = selectedProject?._id || selectedProject?.id || null;
  const [supplier, setSupplier] = useState("");
  const [total, setTotal] = useState("");
  const [vat, setVat] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasShift = Boolean(shift?.projectId || shift?.id);

  useEffect(() => {
    if (!visible) return;
    // Don't auto-open the keyboard: the worker just wants to review the scanned
    // receipt, not immediately edit the supplier. Only focus on an explicit tap.
    Keyboard.dismiss();
    setSupplier(scanned?.supplierName || "");
    setTotal(scanned?.total ? String(scanned.total) : "");
    setVat(scanned?.vat ? String(scanned.vat) : "");
    setCategory(scanned?.category || "");
    setError("");
    if (shift?.projectId) {
      // Active shift wins.
      setProjectId(shift.projectId);
    } else {
      // No shift: inherit the app-wide selected project so the worker who
      // already picked an object doesn't have to select it again. Still load
      // the list so the name resolves and they can change it if they want.
      setProjectId(selectedProjectId);
      projectService
        .getMyProjects()
        .then((list) => setProjects(Array.isArray(list) ? list : []))
        .catch(() => setProjects([]));
    }
  }, [visible, scanned, shift?.projectId, selectedProjectId]);

  const projectLabel = useMemo(() => {
    if (shift?.projectName) return shift.projectName;
    const p = projects.find((x) => (x._id || x.id) === projectId);
    if (p?.name) return p.name;
    if (projectId && projectId === selectedProjectId) {
      return selectedProject?.name || null;
    }
    return null;
  }, [
    shift?.projectName,
    projects,
    projectId,
    selectedProjectId,
    selectedProject?.name,
  ]);

  const save = async () => {
    if (!projectId && !shift?.projectId) {
      setError(t("camera.expense.selectProject"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await expenseService.create({
        supplierName: supplier,
        category,
        date: scanned?.date || "",
        amount: toNumber(total),
        vat: toNumber(vat),
        paidBy: "own",
        projectId: shift?.projectId || projectId || null,
      });
      if (asset && (created?._id || created?.id)) {
        try {
          await expenseService.uploadReceipt(created._id || created.id, asset);
        } catch {
          /* expense saved; photo attach is best-effort */
        }
      }
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || t("camera.expense.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t("camera.expense.title")}</Text>

            {asset?.uri ? (
              <Image source={{ uri: asset.uri }} style={styles.preview} />
            ) : null}

            <Text style={styles.label}>{t("camera.expense.supplier")}</Text>
            <TextInput
              style={styles.input}
              value={supplier}
              onChangeText={setSupplier}
              placeholder={t("camera.expense.supplierPlaceholder")}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t("camera.expense.total")}</Text>
                <TextInput
                  style={styles.input}
                  value={total}
                  onChangeText={setTotal}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{t("camera.expense.vat")}</Text>
                <TextInput
                  style={styles.input}
                  value={vat}
                  onChangeText={setVat}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
            </View>

            <Text style={styles.label}>{t("camera.expense.category")}</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder={t("camera.expense.categoryPlaceholder")}
            />

            <Text style={styles.label}>{t("createTask.projectLabel")}</Text>
            {hasShift && shift?.projectName ? (
              <View style={styles.projectFixed}>
                <Text style={styles.projectFixedText}>{projectLabel}</Text>
              </View>
            ) : (
              <View style={styles.projectList}>
                {projects.length === 0 ? (
                  <Text style={styles.hint}>{t("projects.notFound")}</Text>
                ) : (
                  projects.map((p) => {
                    const id = p._id || p.id;
                    const active = id === projectId;
                    return (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.projectChip,
                          active && styles.projectChipActive,
                        ]}
                        onPress={() => setProjectId(id)}
                      >
                        <Text
                          style={[
                            styles.projectChipText,
                            active && styles.projectChipTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>{t("camera.expense.save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
