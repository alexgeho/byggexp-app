import React from "react";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { content, radius, spacing, fontSize } from "../../../theme/tokens";

// Primary/secondary action button. Shows a spinner while `loading`.
export const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  style,
}) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        size === "sm" ? styles.sizeSm : styles.sizeMd,
        variant === "secondary" ? styles.secondary : styles.primary,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" ? content.accent : content.onAccent}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "secondary" ? styles.textSecondary : styles.textPrimary,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeMd: {
    height: 48,
    paddingHorizontal: spacing.xxl,
  },
  sizeSm: {
    height: 38,
    paddingHorizontal: spacing.xl,
    minWidth: 88,
  },
  primary: {
    backgroundColor: content.accent,
  },
  secondary: {
    backgroundColor: content.surface,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: fontSize.callout,
    fontWeight: "600",
  },
  textPrimary: {
    color: content.onAccent,
  },
  textSecondary: {
    color: content.accent,
  },
});

export default Button;
