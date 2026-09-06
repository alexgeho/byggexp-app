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
    {label ? <Text style={styles.label}>{label}</Text> : null}
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
    fontSize: fontSize.caption,
    color: content.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: content.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    fontSize: fontSize.body,
    color: content.textPrimary,
    backgroundColor: content.surface,
  },
});

export default FieldInput;
