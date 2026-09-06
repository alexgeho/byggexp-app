import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BackButton } from "../BackButton/BackButton";

// Single standardized screen/sheet header: back button (left), centered title,
// optional right slot. Same top clearance everywhere so headers never differ
// between screens and modal sheets.
export function ScreenHeader({ title, onBack, right = null }) {
  return (
    <View style={styles.header}>
      <BackButton
        onPress={onBack}
        iconSource={require("../../../assets/Arrow-left.png")}
      />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48 + 8, // clear notch (48) + small gap — matches main screens
    paddingBottom: 10,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginHorizontal: 8,
  },
  right: {
    width: 44,
    alignItems: "flex-end",
  },
});

export default ScreenHeader;
