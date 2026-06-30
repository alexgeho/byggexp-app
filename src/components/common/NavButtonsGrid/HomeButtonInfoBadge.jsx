import React from "react";
import { Text, View } from "react-native";
import { createStyles } from "./HomeButtonInfoBadge.styles";

export default function HomeButtonInfoBadge({ label, variant }) {
  const styles = createStyles(variant);

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}
