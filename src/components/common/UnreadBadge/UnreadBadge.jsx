import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function UnreadBadge({
  count = 0,
  style,
  textStyle,
}) {
  if (!count) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.badgeText, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -8,
    right: -10,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 12,
    fontFamily: "DMSans-Bold",
  },
});
