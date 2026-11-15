import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import { onDark } from "../../../theme/colorUtils";
import { radius } from "../../../theme/tokens";

export const PERIOD_VIEWS = ["week", "month", "custom"];

// THE Week · Month · Custom switch — the same one in Planning and in Shifts.
// "Custom" is a period of two dates, picked in PeriodSheet. A screen that has
// one more period passes its list in `views` (Planning: also "twoWeeks") —
// the same switch, never a second one.
export function PeriodTabs({
  value,
  onChange,
  testIDPrefix = "period-view",
  views = PERIOD_VIEWS,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  return (
    <View style={styles.toggle}>
      {views.map((view) => {
        const on = view === value;
        return (
          <TouchableOpacity
            key={view}
            style={[
              styles.button,
              views.length > 3 && styles.buttonTight,
              on && styles.buttonOn,
            ]}
            onPress={() => onChange(view)}
            activeOpacity={0.85}
            testID={`${testIDPrefix}-${view}`}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.text,
                on && styles.textOn,
                on && { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t(`schedule.views.${view}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    toggle: {
      flexDirection: "row",
      alignSelf: "center",
      maxWidth: "100%",
      backgroundColor: c.background,
      borderRadius: radius.control,
      padding: 3,
      gap: 3,
    },
    button: {
      height: 34,
      paddingHorizontal: 18,
      borderRadius: radius.control,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 1,
    },
    buttonTight: {
      paddingHorizontal: 12,
    },
    buttonOn: {
      backgroundColor: onDark(c, c.surfaceMuted, "#FFFFFF"),
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    text: {
      color: c.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    textOn: {
      color: c.textPrimary,
      fontWeight: "600",
    },
  });
