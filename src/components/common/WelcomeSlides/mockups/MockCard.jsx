import React from "react";
import { View, StyleSheet } from "react-native";

// The rounded translucent card every value-tour mockup sits in — Figma: white
// at 60% over the light-gray background + blue halo, radius 20, padding 10, no
// shadow. Some slides stack two of these (employees, documents); most use one.
export function MockCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 10,
    // No fill: a translucent-white card read as a faint rectangle whose edges
    // stayed visible through the fade. The inner content (tabs, summary box, day
    // cells, list rows) has its own surfaces, so the mockup still reads clearly
    // while its outline disappears completely into the background.
    backgroundColor: "transparent",
  },
});
