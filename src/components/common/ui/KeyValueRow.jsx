import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fontSize, spacing } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// One label→value line used in summary/detail cards. `tone` colours the value
// (cost = red, bill = green). `total` adds a top divider + bold styling.
const buildTones = (c) => ({
  default: c.textPrimary,
  cost: c.danger,
  bill: c.success,
  muted: c.textMuted,
});

export const KeyValueRow = ({
  label,
  value,
  tone = "default",
  total = false,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const tones = useMemo(() => buildTones(theme.content), [theme.content]);
  return (
    <View style={[styles.row, total && styles.rowTotal]}>
      <Text
        style={[styles.label, total && styles.labelStrong]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          total && styles.valueStrong,
          { color: tones[tone] || tones.default },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 7,
    },
    rowTotal: {
      borderTopWidth: 1,
      borderTopColor: c.divider,
      marginTop: spacing.xs,
      paddingTop: spacing.md - 1,
    },
    label: {
      fontSize: fontSize.body,
      color: c.textMuted,
      flex: 1,
    },
    labelStrong: {
      color: c.textPrimary,
      fontWeight: "700",
    },
    value: {
      fontSize: fontSize.body,
      fontWeight: "500",
    },
    valueStrong: {
      fontSize: fontSize.callout,
      fontWeight: "700",
    },
  });

export default KeyValueRow;
