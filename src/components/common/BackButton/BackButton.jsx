import React from "react";
import { TouchableOpacity, Image, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { createStyles } from "./BackButton.styles";

export function BackButton({
  onPress,
  iconSource,
  style,
  iconStyle,
}) {
  const styles = createStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.backButton, style]}
    >
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.78)",
          "rgba(255,255,255,0.16)",
        ]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.baseGradient}
      />

      <LinearGradient
        colors={[
          "rgba(255,255,255,0.92)",
          "rgba(255,255,255,0.18)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.85 }}
        style={styles.highlight}
      />

      <View style={styles.innerRing} pointerEvents="none" />

      <View style={styles.hardLightGlow} />

      <Image
        style={[styles.backIcon, iconStyle]}
        source={iconSource}
      />
    </TouchableOpacity>
  );
}