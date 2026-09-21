import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import { onDark } from "../../../theme/colorUtils";

export default function UnreadBadge({ count = 0, style, textStyle }) {
  const { theme } = useTheme();
  if (!count) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <View
      style={[
        styles.badge,
        // The ring punches the badge out of whatever it sits on, so it has to
        // BE that surface — white was a halo on the dark theme.
        {
          borderColor: onDark(theme.content, theme.content.surface, "#FFFFFF"),
        },
        style,
      ]}
    >
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
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
    zIndex: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 12,
    fontFamily: "DMSans-Bold",
  },
});
