import React, { useMemo } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { radius, spacing, fontSize } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Labeled single-line input used in forms. Pass `half` inside a row of two.
export const FieldInput = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  half = false,
  style,
  labelStyle,
  borderless = false,
  ...rest
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  return (
    <View style={[half ? styles.half : styles.full, style]}>
      {label ? (
        <Text
          style={[styles.label, half && styles.labelHalf, labelStyle]}
          numberOfLines={2}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, borderless && styles.inputBorderless]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={theme.content.placeholder}
        {...rest}
      />
    </View>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    full: {
      marginBottom: spacing.lg - 2,
    },
    half: {
      flex: 1,
    },
    label: {
      // Match the main create-project field labels exactly (floating label =
      // textPrimary at 0.5 opacity): larger, muted.
      fontSize: fontSize.body,
      lineHeight: 18,
      color: c.textPrimary,
      opacity: 0.5,
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
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg - 2,
      fontSize: fontSize.subhead,
      color: c.textPrimary,
      backgroundColor: c.surface,
    },
    // Borderless variant — matches the create-project name/order-ref fields:
    // no box outline, sits directly on the card.
    inputBorderless: {
      borderWidth: 0,
      borderRadius: 0,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
    },
  });

export default FieldInput;
