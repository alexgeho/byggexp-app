import React, { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { fontSize, spacing } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Small uppercase heading above a group of fields/rows.
// `inset`: line the heading up with the text inside a FieldCard (row padding
// 16) instead of the card edge — the iOS grouped-list rule.
export const SectionTitle = ({ children, style, inset = false }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  return (
    <Text style={[styles.title, inset && styles.inset, style]}>{children}</Text>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    title: {
      fontSize: fontSize.footnote,
      fontWeight: "700",
      color: c.textSecondary, // iOS grouped sub-header = secondaryLabel
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: spacing.md,
      marginLeft: spacing.xs,
    },
    inset: {
      marginLeft: spacing.lg,
    },
  });

export default SectionTitle;
