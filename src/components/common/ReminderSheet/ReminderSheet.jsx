import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";

// Repeat cadences, same set the admin panel's task-reminder popover offers.
// 0 = a single ping at the chosen time; the rest re-nag every N minutes until
// the task is done. A note only ever takes the one-shot.
const REMINDER_INTERVALS = [0, 15, 30, 60];

const nextWholeHour = () => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
};

// Shared "remind me" sheet: pick a moment, optionally a repeat cadence, save or
// clear. Used by the bell on a task row and on a note.
export function ReminderSheet({
  visible,
  value,
  intervalMinutes = 0,
  showRepeat = false,
  onSave,
  onClear,
  onClose,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme.content);

  const [when, setWhen] = useState(() => value || nextWholeHour());
  const [interval, setInterval] = useState(intervalMinutes);
  const [picking, setPicking] = useState(Platform.OS === "ios" ? "date" : null);

  useEffect(() => {
    if (visible) {
      setWhen(value || nextWholeHour());
      setInterval(intervalMinutes);
      setPicking(Platform.OS === "ios" ? "date" : null);
    }
  }, [visible, value, intervalMinutes]);

  const intervalLabel = (minutes) =>
    minutes === 0
      ? t("reminder.once")
      : minutes < 60
        ? t("reminder.everyMinutes", { count: minutes })
        : t("reminder.everyHour");

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("reminder.title")}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Icon name="x" size={20} color={theme.content.textPrimary} />
            </TouchableOpacity>
          </View>

          {Platform.OS === "ios" ? (
            <DateTimePicker
              value={when}
              mode="datetime"
              display="inline"
              // The native picker follows the phone's appearance, not the
              // app's, so on a light phone it drew black digits on our dark
              // sheet.
              themeVariant={theme.content.scheme}
              onChange={(_event, date) => date && setWhen(date)}
              minimumDate={new Date()}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.androidField}
                onPress={() => setPicking("date")}
                activeOpacity={0.85}
              >
                <Text style={styles.androidValue}>{when.toLocaleString()}</Text>
              </TouchableOpacity>
              {picking ? (
                <DateTimePicker
                  value={when}
                  mode={picking}
                  display="default"
                  minimumDate={picking === "date" ? new Date() : undefined}
                  onChange={(event, date) => {
                    if (event.type === "dismissed") {
                      setPicking(null);
                      return;
                    }
                    if (date) setWhen(date);
                    // Date first, then time — the two-step Android flow.
                    setPicking(picking === "date" ? "time" : null);
                  }}
                />
              ) : null}
            </>
          )}

          {showRepeat ? (
            <View style={styles.intervals}>
              {REMINDER_INTERVALS.map((minutes) => {
                const selected = minutes === interval;
                return (
                  <TouchableOpacity
                    key={minutes}
                    style={[styles.pill, selected && styles.pillSelected]}
                    onPress={() => setInterval(minutes)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selected && styles.pillTextSelected,
                      ]}
                    >
                      {intervalLabel(minutes)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.actions}>
            {onClear ? (
              <TouchableOpacity onPress={onClear} activeOpacity={0.8}>
                <Text style={styles.clearText}>{t("reminder.clear")}</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSave({ when, intervalMinutes: interval })}
              activeOpacity={0.85}
            >
              <Text style={styles.saveText}>{t("common.save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(5, 45, 80, 0.28)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 16,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: "600",
    },
    androidField: {
      minHeight: 48,
      borderRadius: 14,
      paddingHorizontal: 14,
      justifyContent: "center",
      backgroundColor: c.inputSurface,
    },
    androidValue: {
      color: c.textPrimary,
      fontSize: 16,
    },
    intervals: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: c.inputSurface,
    },
    pillSelected: {
      backgroundColor: "#0091FF",
    },
    pillText: {
      color: c.textPrimary,
      fontSize: 13,
    },
    pillTextSelected: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },
    clearText: {
      color: "#FF3B30",
      fontSize: 15,
    },
    saveButton: {
      backgroundColor: "#0091FF",
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    saveText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
  });

export default ReminderSheet;
