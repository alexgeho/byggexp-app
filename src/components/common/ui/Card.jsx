import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "../../../theme/tokens";
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
    // iOS grouped card: solid white, no border, 10pt radius.
    base: {
      borderRadius: 10,
      borderWidth: 0,
      padding: spacing.lg,
    },
    frosted: {
      backgroundColor: c.surface,
    },
    solid: {
      backgroundColor: c.surface,
    },
  });

export default Card;
