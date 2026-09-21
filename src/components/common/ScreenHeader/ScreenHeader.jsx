import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BackButton } from "../BackButton/BackButton";
import { useTheme } from "../../../theme/ThemeContext";
import { onDark } from "../../../theme/colorUtils";

// Single standardized screen/sheet header: back button (left), centered title,
// optional right slot. Same top clearance everywhere so headers never differ
// between screens and modal sheets.
export function ScreenHeader({ title, onBack, right = null }) {
  const { theme } = useTheme();
  return (
    <View style={styles.header}>
      <BackButton
        onPress={onBack}
        iconSource={require("../../../assets/Arrow-left.png")}
      />
      <Text
        style={[
          styles.title,
          {
            color: onDark(theme.content, theme.content.textPrimary, "#000000"),
          },
        ]}
        numberOfLines={1}
      >
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
    paddingTop: 48 + 20, // notch (48) + header gap (20) — matches main screens 1:1
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
