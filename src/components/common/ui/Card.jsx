import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { radius, spacing } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Rounded surface used across the app. `variant="frosted"` is the translucent
// card seen on tinted backgrounds; `variant="solid"` is opaque white.
export const Card = ({ variant = "frosted", style, children, ...rest }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  return (
    <View
      style={[
        styles.base,
        variant === "solid" ? styles.solid : styles.frosted,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.surface,
      padding: spacing.lg,
    },
    frosted: {
      backgroundColor: c.surfaceMuted,
    },
    solid: {
      backgroundColor: c.surface,
    },
  });

export default Card;
