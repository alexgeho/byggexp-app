import React, { useMemo } from "react";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import {
  radius,
  size as sizes,
  spacing,
  fontSize,
} from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// THE action button. Shows a spinner while `loading`.
// `icon` = optional Feather glyph name shown before the title.
// Variants: "primary" (filled accent), "outline" (transparent + 1px border,
// dark text), "secondary" (surface fill, accent text). Every variant carries
// the same 1px border (transparent unless outline), so a filled + outline pair
// is always exactly the same height.
export const Button = ({
  title,
  icon,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const isDisabled = disabled || loading;
  const fg =
    variant === "outline"
      ? theme.content.textPrimary
      : variant === "secondary"
        ? theme.content.accent
        : theme.content.onAccent;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        size === "sm" ? styles.sizeSm : styles.sizeMd,
        styles[variant] || styles.primary,
        // Same blue as the header check / FAB on every palette.
        (variant === "primary" || !styles[variant]) && {
          backgroundColor: theme.colors.primary,
        },
        // Loading keeps the full colour — the spinner is the feedback.
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? (
            <Icon name={icon} size={18} color={fg} style={styles.icon} />
          ) : null}
          <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    icon: { marginRight: spacing.sm },
    base: {
      borderRadius: radius.control,
      borderWidth: sizes.border,
      borderColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    sizeMd: {
      height: sizes.control,
      paddingHorizontal: spacing.xxl,
    },
    sizeSm: {
      height: 38,
      paddingHorizontal: spacing.xl,
      minWidth: 88,
    },
    primary: {
      backgroundColor: c.accent,
    },
    secondary: {
      backgroundColor: c.surface,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: c.border,
    },
    disabled: {
      opacity: 0.6,
    },
    text: {
      fontSize: fontSize.callout,
      fontWeight: "600",
    },
  });

export default Button;
