import React from "react";
import { View, Text } from "react-native";
import { styles } from "./billingForm.styles";

// Centered section title with side rules, matching the admin offer/invoice
// form ("Offer rows", "ROT-avdrag").
export default function SectionTitle({ title }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}
