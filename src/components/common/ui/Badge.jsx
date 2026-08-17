import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, fontSize } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Status pill. `tone` picks a semantic colour pair; or pass explicit
// backgroundColor/color to override (e.g. from getWorkerStatusBadge).
const buildTones = (c) => ({
  danger: { bg: c.dangerSoft, fg: c.danger },
  success: { bg: c.successSoft, fg: c.success },
  warning: { bg: c.warningSoft, fg: c.warning },
  accent: { bg: c.accentSoft, fg: c.accent },
  neutral: { bg: "#EAF0F5", fg: c.textMuted },
});

export const Badge = ({ label, tone = "neutral", backgroundColor, color }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const tones = useMemo(() => buildTones(theme.content), [theme.content]);
  const preset = tones[tone] || tones.neutral;
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

const createStyles = (c) =>
  StyleSheet.create({
    // Figma status pill: radius 6, padding 8×3, 12px/600 text.
    badge: {
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: 6,
      overflow: "hidden",
    },
    base: {
      backgroundColor: c.surface,
      borderRadius: 6,
    },
    tint: {
      borderRadius: 6,
    },
    text: {
      fontSize: fontSize.caption,
      fontWeight: "600",
    },
  });

export default Badge;
