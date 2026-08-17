import React, { useMemo } from "react";
import { TouchableOpacity, Image, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../../theme/ThemeContext";
import { createStyles } from "./BackButton.styles";

// Glass palettes for the round back button. Light = the original frosted-white
// look; dark = a subtle dark glass so it reads on the dark theme background.
const LIGHT_GLASS = {
  bg: "rgba(255,255,255,0.6)",
  border: "#E7ECF0",
  ring: "rgba(255,255,255,0.35)",
  hardGlow: "rgba(255,255,255,0.03)",
  icon: "#20384D",
  base: ["rgba(255,255,255,0.78)", "rgba(255,255,255,0.16)"],
  highlight: [
    "rgba(255,255,255,0.92)",
    "rgba(255,255,255,0.18)",
    "rgba(255,255,255,0)",
  ],
};

const DARK_GLASS = {
  bg: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.16)",
  ring: "rgba(255,255,255,0.12)",
  hardGlow: "rgba(255,255,255,0.02)",
  icon: "#FFFFFF",
  base: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.03)"],
  highlight: [
    "rgba(255,255,255,0.16)",
    "rgba(255,255,255,0.05)",
    "rgba(255,255,255,0)",
  ],
};

export function BackButton({ onPress, iconSource, style, iconStyle }) {
  const { theme } = useTheme();
  const glass = theme.content.scheme === "dark" ? DARK_GLASS : LIGHT_GLASS;
  const styles = useMemo(() => createStyles(glass), [glass]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.backButton, style]}
    >
      {/* Clipped glass layers (kept in an inner view so the button's own drop
          shadow is not clipped by overflow:hidden). */}
      <View style={styles.inner} pointerEvents="none">
        <LinearGradient
          colors={glass.base}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.baseGradient}
        />

        <LinearGradient
          colors={glass.highlight}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.85 }}
          style={styles.highlight}
        />

        <View style={styles.innerRing} />

        <View style={styles.hardLightGlow} />
      </View>

      <Image style={[styles.backIcon, iconStyle]} source={iconSource} />
    </TouchableOpacity>
  );
}
