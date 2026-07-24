import React from "react";
import { View } from "react-native";
import HomeButtonInfoBadge from "./HomeButtonInfoBadge";

export function HomeButtonExtraInfo({
  buttonId,
  showEmployeeStats,
  employeeStats,
  style,
}) {
  if (buttonId === "employees" && showEmployeeStats) {
    return (
      <View style={style}>
        <HomeButtonInfoBadge
          label={`• At work - ${employeeStats.live}`}
          variant="live"
        />
        <HomeButtonInfoBadge
          label={`• Not at work - ${employeeStats.notAtWork}`}
          variant="notAtWork"
        />
      </View>
    );
  }

  return null;
}
