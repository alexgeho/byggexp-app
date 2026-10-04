import React, { useMemo } from "react";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { radius, spacing, fontSize } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Primary/secondary action button. Shows a spinner while `loading`.
// `icon` = optional Feather glyph name shown before the title.
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
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        size === "sm" ? styles.sizeSm : styles.sizeMd,
        variant === "secondary" ? styles.secondary : styles.primary,
        // Loading keeps the full colour — the spinner is the feedback.
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "secondary"
              ? theme.content.accent
              : theme.content.onAccent
          }
          size="small"
        />
      ) : (
        <>
          {icon ? (
            <Icon
              name={icon}
              size={18}
              color={
                variant === "secondary"
                  ? theme.content.accent
                  : theme.content.onAccent
              }
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[
              styles.text,
              variant === "secondary"
                ? styles.textSecondary
                : styles.textPrimary,
            ]}
          >
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
      borderRadius: radius.full,
      flexDirection: "row",
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
      backgroundColor: c.accent,
    },
    secondary: {
      backgroundColor: c.surface,
    },
    disabled: {
      opacity: 0.6,
    },
    text: {
      fontSize: fontSize.callout,
      fontWeight: "600",
    },
    textPrimary: {
      color: c.onAccent,
    },
    textSecondary: {
      color: c.accent,
    },
  });

export default Button;
