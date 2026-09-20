import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { expenseService, shiftService } from "../../../services";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import { FilterSelector } from "../../../components/common/FilterSelector/FilterSelector";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

// "Dagens rapport" — everything the worker adds to a finished day in one pass.
//
// The layout follows a few of the laws deliberately:
// · Hick's — every choice is a short row of pills, never a dropdown to open.
// · Miller's — three chunks (Tid, Resa, Anteckning), not a wall of fields.
// · Fitts's — 48pt targets and the save button pinned in the thumb zone.
// · Jakob's — the same cards and inset separators the rest of the app uses, so
//   there is nothing new to learn.
// · Postel's — "7,5" and "7.5" are both accepted; blank means zero.
// Each option carries its own colour, used at low opacity when chosen: a
// tinted pill reads as "this one is picked" without shouting over the single
// solid action on the screen (Von Restorff — the thing that must stand out is
// Spara, and only Spara).
const HOUR_TYPES = ["normal", "overtime", "ob"];
const PER_DIEM = ["none", "half", "full"];

const OPTION_COLORS = {
  normal: "#0785F4",
  overtime: "#F3B530",
  ob: "#5222FF",
  none: "#7A94A8",
  half: "#00A8A8",
  full: "#2FA84F",
};

// The same hue at 18% for the fill, so the label stays legible on it.
const tint = (hex) => `${hex}2E`;

// Accepts a comma or a dot, ignores anything else a keyboard might slip in.
const toNumber = (value) => {
  const parsed = Number(
    String(value)
      .replace(",", ".")
      .replace(/[^\d.]/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function DayReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const shift = route.params?.shift || {};
  const shiftId = shift._id || shift.id || route.params?.shiftId;

  const [hourType, setHourType] = useState(shift.hourType || "normal");
  const [travelKm, setTravelKm] = useState(
    shift.travelKm ? String(shift.travelKm) : "",
  );
  const [travelHours, setTravelHours] = useState(
    shift.travelMinutes ? String(shift.travelMinutes / 60) : "",
  );
  const [perDiem, setPerDiem] = useState(shift.perDiem || "none");
  const [dayNote, setDayNote] = useState(shift.dayNote || "");
  const [saving, setSaving] = useState(false);
  // The previous reported day, offered as a one-tap prefill.
  const [lastReport, setLastReport] = useState(null);
  const [ataOptions, setAtaOptions] = useState([]);
  const [ataId, setAtaId] = useState(shift.ataId || "");
  const [photoCount, setPhotoCount] = useState(
    Array.isArray(shift.photos) ? shift.photos.length : 0,
  );
  // Utlägg — what the day cost the worker out of pocket. A photographed
  // receipt is scanned for its amount; the amount stays editable, because a
  // crumpled receipt is exactly where a scan gets it wrong (Postel's).
  const [receipt, setReceipt] = useState(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseSupplier, setExpenseSupplier] = useState("");
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [savingExpense, setSavingExpense] = useState(false);
  // A second tap must not fire a second save before the button re-renders.
  const submittingRef = useRef(false);

  // Zeigarnik: an unfinished report nags, so make finishing it one tap when the
  // day looks like the last one — same site, same travel, same bucket.
  useEffect(() => {
    let active = true;
    shiftService
      .getLastDayReport()
      .then((report) => {
        if (active) setLastReport(report || null);
      })
      .catch(() => {
        /* the prefill is a convenience, never a blocker */
      });
    return () => {
      active = false;
    };
  }, []);

  // Which ÄTA this day belongs to, if any. Management data stays out of it —
  // the endpoint returns number and title only.
  useEffect(() => {
    if (!shiftId) return undefined;
    let active = true;
    shiftService
      .getAtaOptions(shiftId)
      .then((rows) => {
        if (active) setAtaOptions(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        /* no ÄTA on this project, or no access — the row simply stays hidden */
      });
    return () => {
      active = false;
    };
  }, [shiftId]);

  const projectId = shift.projectId;
  const shiftDate = shift.shiftDate;

  // Today's out-of-pocket total for this site, so the number is visible the
  // moment the day is reported rather than at the end of the month.
  const loadExpenseTotal = useCallback(async () => {
    if (!projectId || !shiftDate) return;
    try {
      const rows = await expenseService.list({ projectId });
      const total = (Array.isArray(rows) ? rows : [])
        .filter((row) => String(row.date || "").slice(0, 10) === shiftDate)
        .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      setExpenseTotal(total);
    } catch {
      /* the total is informational — never block the report on it */
    }
  }, [projectId, shiftDate]);

  useEffect(() => {
    void loadExpenseTotal();
  }, [loadExpenseTotal]);

  const pickReceipt = useCallback(async () => {
    try {
      const assets = await pickUploadAssets({
        allowsMultipleSelection: false,
        fileNamePrefix: "kvitto",
        documentTypes: ["image/*"],
      });
      if (!assets.length) return;
      const file = assets[0];
      setReceipt(file);

      // Best-effort scan: it fills the amount in, it never decides it.
      try {
        const scanned = await expenseService.scan(file);
        const amount =
          (Number(scanned?.amountExclVat) || 0) + (Number(scanned?.vat) || 0);
        if (amount > 0) setExpenseAmount(String(amount));
        if (scanned?.supplierName) setExpenseSupplier(scanned.supplierName);
      } catch {
        /* scanning is optional — the amount can simply be typed */
      }
    } catch (error) {
      console.error("Failed to pick receipt:", error);
      Alert.alert(t("common.error"), t("dayReport.photoFailed"));
    }
  }, [t]);

  const saveExpense = useCallback(async () => {
    const amount = toNumber(expenseAmount);
    if (!receipt || amount <= 0 || savingExpense) return;
    setSavingExpense(true);
    try {
      const created = await expenseService.create({
        projectId: projectId || null,
        date: shiftDate,
        amount,
        supplierName: expenseSupplier.trim(),
      });
      const id = created?._id || created?.id;
      if (id) await expenseService.uploadReceipt(id, receipt);
      setReceipt(null);
      setExpenseAmount("");
      setExpenseSupplier("");
      await loadExpenseTotal();
    } catch (error) {
      console.error("Failed to save expense:", error);
      Alert.alert(t("common.error"), t("dayReport.expenseFailed"));
    } finally {
      setSavingExpense(false);
    }
  }, [
    expenseAmount,
    expenseSupplier,
    receipt,
    savingExpense,
    projectId,
    shiftDate,
    loadExpenseTotal,
    t,
  ]);

  const addPhoto = useCallback(async () => {
    try {
      const assets = await pickUploadAssets({
        fileNamePrefix: "shift-photo",
        documentTypes: ["image/*"],
      });
      if (!assets.length) return;
      await shiftService.uploadPhotos(shiftId, assets);
      setPhotoCount((previous) => previous + assets.length);
    } catch (error) {
      console.error("Failed to add shift photo:", error);
      Alert.alert(t("common.error"), t("dayReport.photoFailed"));
    }
  }, [shiftId, t]);

  const copyLast = useCallback(() => {
    if (!lastReport) return;
    setHourType(lastReport.hourType || "normal");
    setTravelKm(lastReport.travelKm ? String(lastReport.travelKm) : "");
    setTravelHours(
      lastReport.travelMinutes ? String(lastReport.travelMinutes / 60) : "",
    );
    setPerDiem(lastReport.perDiem || "none");
  }, [lastReport]);

  const save = async () => {
    if (!shiftId || submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try {
      await shiftService.saveDayReport(shiftId, {
        hourType,
        ataId: ataId || null,
        travelKm: toNumber(travelKm),
        travelMinutes: Math.round(toNumber(travelHours) * 60),
        perDiem,
        dayNote: dayNote.trim(),
      });
      showSuccess({ title: t("dayReport.saved") });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save day report:", error);
      Alert.alert(t("common.error"), t("dayReport.saveFailed"));
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  const Pills = ({ values, value, onChange, labelFor }) => (
    <View style={styles.pills}>
      {values.map((option) => {
        const active = option === value;
        const color = OPTION_COLORS[option] || "#0785F4";
        return (
          <TouchableOpacity
            key={option}
            style={[styles.pill, active && { backgroundColor: tint(color) }]}
            onPress={() => onChange(option)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[styles.pillText, active && { color, fontWeight: "700" }]}
            >
              {labelFor(option)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>{t("dayReport.title")}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {shift.projectNameSnapshot ? (
              <Text style={styles.subtitle}>{shift.projectNameSnapshot}</Text>
            ) : null}

            {lastReport && !shift.reportedAt ? (
              <TouchableOpacity
                style={styles.copyLast}
                onPress={copyLast}
                activeOpacity={0.85}
              >
                <Text style={styles.copyLastText}>
                  {t("dayReport.copyLast", { date: lastReport.shiftDate })}
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* 1 — which bucket the hours belong to */}
            <Text style={styles.sectionLabel}>{t("dayReport.hoursLabel")}</Text>
            <View style={styles.card}>
              <Pills
                values={HOUR_TYPES}
                value={hourType}
                onChange={setHourType}
                labelFor={(option) => t(`dayReport.hourType.${option}`)}
              />
            </View>

            {/* ÄTA — only when the project has any, so the screen stays short
                for the common case of plain contract work. */}
            {ataOptions.length ? (
              <>
                <Text style={styles.sectionLabel}>{t("dayReport.ata")}</Text>
                <View style={styles.card}>
                  <View style={styles.ataRow}>
                    <FilterSelector
                      value={ataId}
                      onChange={setAtaId}
                      placeholder={t("dayReport.noAta")}
                      options={[
                        { value: "", label: t("dayReport.noAta") },
                        ...ataOptions.map((option) => ({
                          value: option.id,
                          label: `ÄTA ${option.number} · ${option.title}`,
                        })),
                      ]}
                    />
                  </View>
                </View>
              </>
            ) : null}

            {/* 2 — travel */}
            <Text style={styles.sectionLabel}>
              {t("dayReport.travelLabel")}
            </Text>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t("dayReport.km")}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={travelKm}
                  onChangeText={setTravelKm}
                  placeholder="0"
                  placeholderTextColor={theme.content.placeholder}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.rowSep} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>
                  {t("dayReport.travelTime")}
                </Text>
                <TextInput
                  style={styles.fieldInput}
                  value={travelHours}
                  onChangeText={setTravelHours}
                  placeholder="0"
                  placeholderTextColor={theme.content.placeholder}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.rowSep} />

              <View style={styles.perDiemRow}>
                <Text style={[styles.fieldLabel, styles.perDiemLabel]}>
                  {t("dayReport.perDiem")}
                </Text>
                <Pills
                  values={PER_DIEM}
                  value={perDiem}
                  onChange={setPerDiem}
                  labelFor={(option) => t(`dayReport.perDiemOption.${option}`)}
                />
              </View>
            </View>

            {/* Photo of the day, straight onto the shift. */}
            <Text style={styles.sectionLabel}>{t("shifts.photos")}</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.fieldRow}
                onPress={addPhoto}
                activeOpacity={0.7}
              >
                <Text style={styles.fieldLabel}>{t("dayReport.addPhoto")}</Text>
                <Text style={styles.photoCount}>
                  {photoCount > 0 ? String(photoCount) : ""}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Utlägg — receipts the worker paid for today. */}
            <Text style={styles.sectionLabel}>{t("dayReport.expenses")}</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.fieldRow}
                onPress={pickReceipt}
                activeOpacity={0.7}
              >
                <Text style={styles.fieldLabel}>
                  {t("dayReport.addReceipt")}
                </Text>
                <Text style={styles.photoCount}>
                  {expenseTotal > 0 ? `${Math.round(expenseTotal)} kr` : ""}
                </Text>
              </TouchableOpacity>

              {receipt ? (
                <>
                  <View style={styles.rowSep} />
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>
                      {t("dayReport.amount")}
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={expenseAmount}
                      onChangeText={setExpenseAmount}
                      placeholder="0"
                      placeholderTextColor={theme.content.placeholder}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.rowSep} />
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>
                      {t("dayReport.supplier")}
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={expenseSupplier}
                      onChangeText={setExpenseSupplier}
                      placeholder={t("dayReport.supplier")}
                      placeholderTextColor={theme.content.placeholder}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveExpense}
                    onPress={saveExpense}
                    disabled={savingExpense}
                    activeOpacity={0.85}
                  >
                    {savingExpense ? (
                      <ActivityIndicator color="#0785F4" size="small" />
                    ) : (
                      <Text style={styles.saveExpenseText}>
                        {t("dayReport.saveExpense")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : null}
            </View>

            {/* 3 — the day in one line */}
            <Text style={styles.sectionLabel}>{t("dayReport.noteLabel")}</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.note}
                value={dayNote}
                onChangeText={setDayNote}
                placeholder={t("dayReport.notePlaceholder")}
                placeholderTextColor={theme.content.placeholder}
                multiline
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={save}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveText}>{t("common.save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
    },
    flex: { flex: 1 },
    header: { ...standardScreenHeader },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
      flex: 1,
    },
    headerSpacer: { width: 44 },
    content: { paddingBottom: 120 },
    subtitle: {
      color: c.textMuted,
      fontSize: 15,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    ataRow: { paddingHorizontal: 16, paddingVertical: 12 },
    saveExpense: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    saveExpenseText: { color: "#0785F4", fontSize: 15, fontWeight: "600" },
    photoCount: { color: c.textMuted, fontSize: 16 },
    copyLast: {
      minHeight: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.inputSurface,
      marginBottom: 4,
    },
    copyLastText: { color: "#0785F4", fontSize: 15, fontWeight: "600" },
    sectionLabel: {
      color: c.textMuted,
      fontSize: 13,
      marginBottom: 8,
      marginTop: 12,
      // Section headers line up with the card's own content, iOS-style.
      paddingHorizontal: 16,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      overflow: "hidden",
      paddingVertical: 4,
    },
    pills: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    pill: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.inputSurface,
    },
    // Blue belongs to the one action on the screen (Spara). A chosen pill is a
    // state, not an action, so it reads in ink rather than competing with it.
    pillText: { color: c.textPrimary, fontSize: 15 },
    fieldRow: {
      minHeight: 56,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    fieldLabel: { color: c.textPrimary, fontSize: 16 },
    perDiemLabel: { paddingHorizontal: 16 },
    fieldInput: {
      flex: 1,
      textAlign: "right",
      color: c.textPrimary,
      fontSize: 16,
      paddingVertical: 0,
    },
    perDiemRow: { paddingTop: 12 },
    rowSep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 16,
    },
    note: {
      minHeight: 88,
      padding: 16,
      color: c.textPrimary,
      fontSize: 16,
      textAlignVertical: "top",
    },
    footer: {
      paddingBottom: 24,
      paddingTop: 8,
      backgroundColor: c.background,
    },
    saveButton: {
      height: 56,
      borderRadius: 18,
      backgroundColor: "#0785F4",
      alignItems: "center",
      justifyContent: "center",
    },
    saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  });
