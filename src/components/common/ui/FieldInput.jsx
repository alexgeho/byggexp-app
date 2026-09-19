import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { content, radius, spacing, fontSize } from "../../../theme/tokens";

// Labeled single-line input used in forms. Pass `half` inside a row of two.
export const FieldInput = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  half = false,
  style,
  ...rest
}) => (
  <View style={[half ? styles.half : styles.full, style]}>
    {label ? (
      <Text style={[styles.label, half && styles.labelHalf]} numberOfLines={2}>
        {label}
      </Text>
    ) : null}
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={content.placeholder}
      {...rest}
    />
  </View>
);

const styles = StyleSheet.create({
  full: {
    marginBottom: spacing.lg - 2,
  },
  half: {
    flex: 1,
  },
  label: {
    // Match the main create-project fields: larger, muted-grey label.
    fontSize: fontSize.body,
    lineHeight: 18,
    color: content.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  // In a two-column row, reserve two lines for the label so a wrapping label
  // (e.g. "Självkostnad / timme (SEK)") doesn't push its input box out of line
  // with the sibling's — the pills stay level.
  labelHalf: {
    minHeight: 36,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: content.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    fontSize: fontSize.subhead,
    color: content.textPrimary,
    backgroundColor: content.surface,
  },
});

export default FieldInput;
