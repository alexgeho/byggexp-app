import React from "react";
import { StyleSheet, View } from "react-native";
import HomeButtonInfoBadge from "./HomeButtonInfoBadge";

const styles = StyleSheet.create({
  shiftsBadges: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    gap: 6,
  },
});

export function HomeButtonExtraInfo({
  buttonId,
  showEmployeeStats,
  employeeStats,
  shiftStats,
  style,
}) {
  if (buttonId === "employees" && showEmployeeStats) {
    return (
      <View style={style}>
        <HomeButtonInfoBadge
          label={`• Live - ${employeeStats.live}`}
          variant="live"
        />
        <HomeButtonInfoBadge
          label={`• Not at work - ${employeeStats.notAtWork}`}
          variant="notAtWork"
        />
      </View>
    );
  }

  if (buttonId === "shifts") {
    return (
      <View style={[style, styles.shiftsBadges]}>
        <HomeButtonInfoBadge
          label={shiftStats.weekLabel}
          variant="shift"
        />
        <HomeButtonInfoBadge
          label={shiftStats.monthLabel}
          variant="shift"
        />
      </View>
    );
  }

  return null;
}
