import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { content, radius, spacing, fontSize } from "../../../theme/tokens";

// Status pill. `tone` picks a semantic colour pair; or pass explicit
// backgroundColor/color to override (e.g. from getWorkerStatusBadge).
const TONES = {
  danger: { bg: content.dangerSoft, fg: content.danger },
  success: { bg: content.successSoft, fg: content.success },
  warning: { bg: content.warningSoft, fg: content.warning },
  accent: { bg: content.accentSoft, fg: content.accent },
  neutral: { bg: "#EAF0F5", fg: content.textMuted },
};

export const Badge = ({ label, tone = "neutral", backgroundColor, color }) => {
  const preset = TONES[tone] || TONES.neutral;
  const bg = backgroundColor ?? preset.bg;
  const fg = color ?? preset.fg;
  // The soft badge colours are translucent, so a coloured card (e.g. a selected
  // blue row) would show through and muddy them. An opaque white base keeps the
  // badge looking exactly the same on any background.
  return (
    <View style={styles.badge}>
      <View style={[StyleSheet.absoluteFill, styles.base]} />
      <View
        style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: bg }]}
      />
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  base: {
    backgroundColor: content.surface,
    borderRadius: radius.sm,
  },
  tint: {
    borderRadius: radius.sm,
  },
  text: {
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
});

export default Badge;
