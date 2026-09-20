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
import { shiftService } from "../../../services";
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
const HOUR_TYPES = ["normal", "overtime", "ob"];
const PER_DIEM = ["none", "half", "full"];

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
        return (
          <TouchableOpacity
            key={option}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(option)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
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
                <Text style={styles.fieldLabel}>{t("dayReport.perDiem")}</Text>
                <Pills
                  values={PER_DIEM}
                  value={perDiem}
                  onChange={setPerDiem}
                  labelFor={(option) => t(`dayReport.perDiemOption.${option}`)}
                />
              </View>
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
    },
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
      paddingHorizontal: 4,
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
      padding: 12,
    },
    pill: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.inputSurface,
    },
    pillActive: { backgroundColor: "#0785F4" },
    pillText: { color: c.textPrimary, fontSize: 15 },
    pillTextActive: { color: "#FFFFFF", fontWeight: "600" },
    fieldRow: {
      minHeight: 56,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    fieldLabel: { color: c.textPrimary, fontSize: 16 },
    fieldInput: {
      flex: 1,
      textAlign: "right",
      color: c.textPrimary,
      fontSize: 16,
      paddingVertical: 0,
    },
    perDiemRow: { paddingTop: 12, paddingHorizontal: 4 },
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
