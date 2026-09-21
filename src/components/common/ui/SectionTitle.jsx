import React, { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { fontSize, spacing } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Small uppercase heading above a group of fields/rows.
export const SectionTitle = ({ children, style }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  return <Text style={[styles.title, style]}>{children}</Text>;
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
  });

export default SectionTitle;
