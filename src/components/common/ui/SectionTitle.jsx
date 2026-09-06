import React from "react";
import { Text, StyleSheet } from "react-native";
import { content, fontSize, spacing } from "../../../theme/tokens";

// Small uppercase heading above a group of fields/rows.
export const SectionTitle = ({ children, style }) => (
  <Text style={[styles.title, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.footnote,
    fontWeight: "700",
    color: content.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
});

export default SectionTitle;
