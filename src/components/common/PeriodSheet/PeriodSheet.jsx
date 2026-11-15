import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import useSheetEnter from "../../../hooks/useSheetEnter";
import { useTheme } from "../../../theme/ThemeContext";
import { onDark } from "../../../theme/colorUtils";
import { radius, size } from "../../../theme/tokens";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekdayLabel,
  startOfMonth,
  startOfWeek,
} from "../../../utils/schedule";
import {
  formatDateKey,
  formatExportPickerDate,
  parseDateKey,
} from "../../../utils/shifts";

// THE "Custom" period picker — Planning and Shifts both open this one sheet.
// No tabs inside and no wheels: one calendar on which both ends are seen at
// once — a tap sets the start, the next tap the end, the days between are
// tinted. `from` / `to` are day keys (YYYY-MM-DD).
export function PeriodSheet({ visible, from, to, onChange, onApply, onClose }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const sheetEnter = useSheetEnter(visible);
  const [target, setTarget] = useState("from");
  const [month, setMonth] = useState(() => startOfMonth(parseDateKey(from)));
  // Every opening starts from the start date and its month.
  useEffect(() => {
    if (visible) {
      setTarget("from");
      setMonth(startOfMonth(parseDateKey(from)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const weeks = useMemo(() => {
    const first = startOfWeek(month);
    const rows = [];
    for (let row = 0; row < 6; row += 1) {
      const days = Array.from({ length: 7 }, (_, index) =>
        addDays(first, row * 7 + index),
      );
      if (row > 3 && days[0].getMonth() !== month.getMonth()) break;
      rows.push(days);
    }
    return rows;
  }, [month]);
  // A tap on a day fills the active end and moves on to the other one; an end
  // before the start turns the period around.
  const pickDay = (key) => {
    if (target === "from") {
      onChange({ from: key, to: to && to >= key ? to : key });
      setTarget("to");
    } else if (from && key < from) {
      onChange({ from: key, to: from });
    } else {
      onChange({ from, to: key });
    }
  };
  const fields = [
    { key: "from", label: t("shiftHistory.from"), value: from },
    { key: "to", label: t("shiftHistory.to"), value: to },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.container, sheetEnter]}>
        <View style={styles.handle} />
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("schedule.views.custom")}
          </Text>

          <View style={styles.card}>
            <View style={styles.fields}>
              {fields.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TouchableOpacity
                    testID={`period-${field.key}`}
                    style={[
                      styles.value,
                      target === field.key && styles.valueActive,
                    ]}
                    onPress={() => setTarget(field.key)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.valueText,
                        !field.value && styles.valuePlaceholder,
                      ]}
                    >
                      {formatExportPickerDate(field.value)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.monthRow}>
              <Text style={styles.monthText}>{formatMonthLabel(month)}</Text>
              <View style={styles.monthSteps}>
                {[-1, 1].map((direction) => (
                  <TouchableOpacity
                    key={direction}
                    testID={`period-month-${direction < 0 ? "prev" : "next"}`}
                    onPress={() =>
                      setMonth((prev) => addMonths(prev, direction))
                    }
                    hitSlop={8}
                    activeOpacity={0.85}
                  >
                    <Icon
                      name={direction < 0 ? "chevron-left" : "chevron-right"}
                      size={24}
                      color="#0091FF"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.week}>
              {weeks[0].map((day) => (
                <Text
                  key={day.getTime()}
                  numberOfLines={1}
                  style={styles.weekday}
                >
                  {formatWeekdayLabel(day)}
                </Text>
              ))}
            </View>
            {weeks.map((days) => (
              <View key={days[0].getTime()} style={styles.week}>
                {days.map((day) => {
                  const key = formatDateKey(day);
                  const outside = day.getMonth() !== month.getMonth();
                  const end = key === from || key === to;
                  const between = from && to && key > from && key < to;
                  return (
                    <TouchableOpacity
                      key={key}
                      testID={`period-day-${key}`}
                      style={[styles.day, between && styles.dayBetween]}
                      onPress={() => pickDay(key)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.dayDot, end && styles.dayDotEnd]}>
                        <Text
                          style={[
                            styles.dayText,
                            outside && styles.dayTextOutside,
                            end && styles.dayTextEnd,
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity
            testID="period-apply"
            style={styles.apply}
            onPress={onApply}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>{t("shifts.applyPeriod")}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingBottom: 28,
      maxHeight: "90%",
    },
    handle: {
      alignSelf: "center",
      backgroundColor: onDark(c, c.divider, "#CCCCCC"),
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
      gap: 12,
    },
    title: {
      color: c.textPrimary,
      fontSize: 22,
      textAlign: "center",
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    fields: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    field: {
      flex: 1,
      alignItems: "center",
    },
    label: {
      fontSize: 14,
      color: c.textPrimary,
      marginBottom: 4,
      textAlign: "center",
      width: "100%",
    },
    value: {
      width: "100%",
      backgroundColor: onDark(c, c.inputSurface, "rgba(245, 245, 245, 1)"),
      borderRadius: 20,
      paddingHorizontal: 12,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    valueActive: {
      borderColor: "#0091FF",
    },
    valueText: {
      fontSize: 15,
      color: c.textPrimary,
      textAlign: "center",
    },
    valuePlaceholder: {
      color: c.textMuted,
    },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 6,
    },
    monthText: {
      color: c.textPrimary,
      fontSize: 17,
      fontFamily: "DMSans-SemiBold",
    },
    monthSteps: {
      flexDirection: "row",
      gap: 20,
    },
    week: {
      flexDirection: "row",
    },
    weekday: {
      flex: 1,
      textAlign: "center",
      color: c.textMuted,
      fontSize: 12,
      paddingVertical: 4,
    },
    day: {
      flex: 1,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    dayBetween: {
      backgroundColor: "rgba(0, 145, 255, 0.14)",
    },
    dayDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    dayDotEnd: {
      backgroundColor: "#0091FF",
    },
    dayText: {
      color: c.textPrimary,
      fontSize: 16,
    },
    dayTextOutside: {
      color: c.textMuted,
    },
    dayTextEnd: {
      color: "#FFFFFF",
      fontFamily: "DMSans-SemiBold",
    },
    apply: {
      width: "100%",
      height: size.control,
      backgroundColor: "#0091FF",
      borderRadius: radius.control,
      alignItems: "center",
      justifyContent: "center",
    },
    applyText: {
      fontSize: 18,
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });
