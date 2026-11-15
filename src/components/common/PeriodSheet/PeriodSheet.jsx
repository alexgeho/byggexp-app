import React, { useEffect, useMemo } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTranslation } from "react-i18next";
import useSheetEnter from "../../../hooks/useSheetEnter";
import { useTheme } from "../../../theme/ThemeContext";
import { onDark } from "../../../theme/colorUtils";
import { radius, size } from "../../../theme/tokens";
import { getDateLocale } from "../../../utils/dateLocale";
import { getMonthDateRange } from "../../../utils/shifts";

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const YEARS_BACK = 5;
const YEARS_AHEAD = 2;

// One month-and-year choice as two wheels, the way a birth date is picked:
// the month by name on the left, the year on the right.
function MonthYearWheels({ value, onChange, styles, prefix }) {
  const year = value.slice(0, 4);
  const month = value.slice(5, 7);
  const thisYear = new Date().getFullYear();
  const years = [
    ...new Set([
      ...Array.from({ length: YEARS_BACK + YEARS_AHEAD + 1 }, (_, index) =>
        String(thisYear - YEARS_BACK + index),
      ),
      year,
    ]),
  ].sort();
  const monthName = (mm) => {
    const label = new Intl.DateTimeFormat(getDateLocale(), {
      month: "long",
    }).format(new Date(Number(year), Number(mm) - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <View style={styles.wheels}>
      <View style={[styles.wheelBox, styles.wheelMonth]}>
        <Picker
          testID={`period-${prefix}-month`}
          selectedValue={month}
          onValueChange={(mm) => onChange(`${year}-${mm}`)}
          style={styles.wheel}
          itemStyle={styles.wheelItem}
          selectionColor="rgb(245, 245, 245)"
        >
          {MONTHS.map((mm) => (
            <Picker.Item
              key={`${prefix}-m-${mm}`}
              label={monthName(mm)}
              value={mm}
            />
          ))}
        </Picker>
      </View>
      <View style={[styles.wheelBox, styles.wheelYear]}>
        <Picker
          testID={`period-${prefix}-year`}
          selectedValue={year}
          onValueChange={(yy) => onChange(`${yy}-${month}`)}
          style={styles.wheel}
          itemStyle={styles.wheelItem}
          selectionColor="rgb(245, 245, 245)"
        >
          {years.map((yy) => (
            <Picker.Item key={`${prefix}-y-${yy}`} label={yy} value={yy} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const monthOf = (dayKey) =>
  (dayKey || "").slice(0, 7) ||
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

// THE "Custom" period picker — Planning and Shifts both open this one sheet.
// No tabs inside: From and To are both on screen at once, each a month and a
// year (owner 15.11: keep it as it was, without the nesting). The period is
// whole months: `from` = the first day of the From month, `to` = the last day
// of the To month (day keys, YYYY-MM-DD).
export function PeriodSheet({ visible, from, to, onChange, onApply, onClose }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const sheetEnter = useSheetEnter(visible);
  const fromMonth = monthOf(from);
  const toMonth = monthOf(to);
  const emit = (nextFrom, nextTo) =>
    onChange({
      from: getMonthDateRange(nextFrom).from,
      to: getMonthDateRange(nextTo).to,
    });
  // What is on the wheels is what Apply gets: the dates snap to whole months
  // as soon as the sheet opens.
  useEffect(() => {
    if (visible) emit(fromMonth, toMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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
            <View style={styles.stack}>
              <View>
                <Text style={styles.label}>{t("shiftHistory.from")}</Text>
                <MonthYearWheels
                  value={fromMonth}
                  onChange={(next) => emit(next, toMonth)}
                  styles={styles}
                  prefix="from"
                />
              </View>
              <View>
                <Text style={styles.label}>{t("shiftHistory.to")}</Text>
                <MonthYearWheels
                  value={toMonth}
                  onChange={(next) => emit(fromMonth, next)}
                  styles={styles}
                  prefix="to"
                />
              </View>
            </View>
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
    label: {
      fontSize: 14,
      color: c.textPrimary,
      marginBottom: 4,
      textAlign: "center",
      width: "100%",
    },
    stack: {
      gap: 8,
    },
    wheels: {
      flexDirection: "row",
      gap: 8,
    },
    wheelBox: {
      backgroundColor: "transparent",
      overflow: "hidden",
    },
    wheelMonth: {
      flex: 2,
    },
    wheelYear: {
      flex: 1,
    },
    wheel: {
      height: Platform.OS === "ios" ? 120 : 48,
      width: "100%",
      backgroundColor: "transparent",
    },
    wheelItem: {
      color: c.textPrimary,
      fontSize: 16,
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
