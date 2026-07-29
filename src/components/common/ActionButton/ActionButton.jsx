import React from "react";
import { Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { GlassView } from "../GlassView/GlassView";

export default function ActionButton({ title, onPress, variant = "regular" }) {
  const { theme } = useTheme();

  if (Platform.OS === "web") {
    return (
      <GlassView
        borderColor="rgb(58 152 255)"
        backgroundColor="rgba(7, 133, 244, 1)"
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={onPress}
      >
        <Text
          style={[styles.text, { fontFamily: theme.text.fontFamily[variant] }]}
        >
          {title}
        </Text>
      </GlassView>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassView
        borderColor="rgb(58 152 255)"
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        intensity={60}
        tint="dark"
      >
        <Text
          style={[styles.text, { fontFamily: theme.text.fontFamily[variant] }]}
        >
          {title}
        </Text>
      </GlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  text: {
    fontSize: 22,
    color: "#ffffff",
    textShadowColor: "#ffffff",
    textShadowRadius: 12,
  },
});
