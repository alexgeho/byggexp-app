import React from "react";
import { View, StyleSheet } from "react-native";
import { content, radius, spacing } from "../../../theme/tokens";

// Rounded surface used across the app. `variant="frosted"` is the translucent
// card seen on tinted backgrounds; `variant="solid"` is opaque white.
export const Card = ({ variant = "frosted", style, children, ...rest }) => (
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

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: spacing.lg,
  },
  frosted: {
    backgroundColor: content.surfaceMuted,
  },
  solid: {
    backgroundColor: content.surface,
  },
});

export default Card;
