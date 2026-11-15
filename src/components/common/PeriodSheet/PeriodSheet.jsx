import React, { useEffect, useMemo } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
const IOS_WHEEL_HEIGHT = 216;
const WHEEL_BOX_HEIGHT = 120;
// The iOS wheel keeps ~27 pt on each side of its text, so a wheel narrower
// than its text + 54 pt cuts the text ("20…", half a digit).
const DAY_WHEEL_WIDTH = 78;
const YEAR_WHEEL_WIDTH = 104;
const NARROW_SCREEN = 380;

const pad = (n) => String(n).padStart(2, "0");
const daysIn = (year, month) =>
  new Date(Number(year), Number(month), 0).getDate();

// One date as three wheels, the way a birth date is picked: the day, the
// month by name, the year. A day the new month does not have (31 → February)
// falls back to that month's last day.
function DateWheels({ value, onChange, styles, prefix }) {
  const year = value.slice(0, 4);
  const month = value.slice(5, 7);
  const day = value.slice(8, 10);
  const thisYear = new Date().getFullYear();
  const years = [
    ...new Set([
      ...Array.from({ length: YEARS_BACK + YEARS_AHEAD + 1 }, (_, index) =>
        String(thisYear - YEARS_BACK + index),
      ),
      year,
    ]),
  ].sort();
  const days = Array.from({ length: daysIn(year, month) }, (_, index) =>
    pad(index + 1),
  );
  // All three wheels are readable at once: on a narrow phone the month is
  // written short ("Nov") so that the day and the year keep their width.
  const { width } = useWindowDimensions();
  const monthName = (mm) => {
    const label = new Intl.DateTimeFormat(getDateLocale(), {
      month: width < NARROW_SCREEN ? "short" : "long",
    }).format(new Date(Number(year), Number(mm) - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  const set = (yy, mm, dd) =>
    onChange(`${yy}-${mm}-${pad(Math.min(Number(dd), daysIn(yy, mm)))}`);
  const wheel = (part, selected, items, onPick, boxStyle) => (
    <View style={[styles.wheelBox, boxStyle]}>
      <Picker
        testID={`period-${prefix}-${part}`}
        selectedValue={selected}
        onValueChange={onPick}
        style={styles.wheel}
        itemStyle={styles.wheelItem}
        selectionColor="rgb(245, 245, 245)"
      >
        {items.map(({ label, value: itemValue }) => (
          <Picker.Item
            key={`${prefix}-${part}-${itemValue}`}
            label={label}
            value={itemValue}
          />
        ))}
      </Picker>
    </View>
  );

  return (
    <View style={styles.wheels}>
      {wheel(
        "day",
        day,
        days.map((dd) => ({ label: String(Number(dd)), value: dd })),
        (dd) => set(year, month, dd),
        styles.wheelDay,
      )}
      {wheel(
        "month",
        month,
        MONTHS.map((mm) => ({ label: monthName(mm), value: mm })),
        (mm) => set(year, mm, day),
        styles.wheelMonth,
      )}
      {wheel(
        "year",
        year,
        years.map((yy) => ({ label: yy, value: yy })),
        (yy) => set(yy, month, day),
        styles.wheelYear,
      )}
    </View>
  );
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const thisMonth = () =>
  `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}`;

// THE "Custom" period picker — Planning and Shifts both open this one sheet.
// No tabs inside: From and To are both on screen at once, each a day, a month
// and a year (owner 15.11: both ends visible at once, no nesting; then "add
// the day"). `from` and `to` are day keys (YYYY-MM-DD); with nothing chosen
// yet the sheet opens on the current month, first day to last.
export function PeriodSheet({ visible, from, to, onChange, onApply, onClose }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const sheetEnter = useSheetEnter(visible);
  const fromDay = DAY_KEY.test(from || "")
    ? from
    : getMonthDateRange(thisMonth()).from;
  const toDay = DAY_KEY.test(to || "") ? to : getMonthDateRange(thisMonth()).to;
  const emit = (nextFrom, nextTo) => onChange({ from: nextFrom, to: nextTo });
  // What is on the wheels is what Apply gets, also when the sheet opened with
  // nothing chosen.
  useEffect(() => {
    if (visible) emit(fromDay, toDay);
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
                <DateWheels
                  value={fromDay}
                  onChange={(next) => emit(next, toDay)}
                  styles={styles}
                  prefix="from"
                />
              </View>
              <View>
                <Text style={styles.label}>{t("shiftHistory.to")}</Text>
                <DateWheels
                  value={toDay}
                  onChange={(next) => emit(fromDay, next)}
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
      paddingVertical: 16,
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
      gap: 2,
    },
    // iOS draws the wheel at its own 216 pt whatever height it is given, so
    // the box crops it evenly from both sides: the selected row (the grey
    // pill) stays in the middle of the box.
    wheelBox: {
      backgroundColor: "transparent",
      overflow: "hidden",
      height: Platform.OS === "ios" ? WHEEL_BOX_HEIGHT : undefined,
    },
    wheelDay: {
      width: DAY_WHEEL_WIDTH,
    },
    wheelMonth: {
      flex: 1,
    },
    wheelYear: {
      width: YEAR_WHEEL_WIDTH,
    },
    wheel: {
      height: Platform.OS === "ios" ? IOS_WHEEL_HEIGHT : 48,
      marginTop:
        Platform.OS === "ios" ? (WHEEL_BOX_HEIGHT - IOS_WHEEL_HEIGHT) / 2 : 0,
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
