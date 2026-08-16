import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { content, fontSize, spacing } from "../../../theme/tokens";

// One label→value line used in summary/detail cards. `tone` colours the value
// (cost = red, bill = green). `total` adds a top divider + bold styling.
const VALUE_TONE = {
  default: content.textPrimary,
  cost: content.danger,
  bill: content.success,
  muted: content.textMuted,
};

export const KeyValueRow = ({
  label,
  value,
  tone = "default",
  total = false,
}) => (
  <View style={[styles.row, total && styles.rowTotal]}>
    <Text style={[styles.label, total && styles.labelStrong]} numberOfLines={1}>
      {label}
    </Text>
    <Text
      style={[
        styles.value,
        total && styles.valueStrong,
        { color: VALUE_TONE[tone] || VALUE_TONE.default },
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  rowTotal: {
    borderTopWidth: 1,
    borderTopColor: content.divider,
    marginTop: spacing.xs,
    paddingTop: spacing.md - 1,
  },
  label: {
    fontSize: fontSize.body,
    color: content.textMuted,
    flex: 1,
  },
  labelStrong: {
    color: content.textPrimary,
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
