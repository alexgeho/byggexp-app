import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// The rounded, softly-shadowed card every value-tour mockup sits in. A faint
// diagonal gradient matches the Figma frames (lighter top-left). Some slides
// stack two of these (employees, documents); most use one.
export function MockCard({ children, style }) {
  return (
    <LinearGradient
      colors={["#FFFFFF", "#F3F6FB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#0A2540",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
});
