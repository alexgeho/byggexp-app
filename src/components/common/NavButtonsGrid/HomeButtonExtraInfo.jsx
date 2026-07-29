import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import HomeButtonInfoBadge from "./HomeButtonInfoBadge";

export function HomeButtonExtraInfo({
  buttonId,
  showEmployeeStats,
  employeeStats,
  style,
}) {
  const { t } = useTranslation();

  if (buttonId === "employees" && showEmployeeStats) {
    return (
      <View style={style}>
        <HomeButtonInfoBadge
          label={`• ${t("employees.atWork")} - ${employeeStats.live}`}
          variant="live"
        />
        <HomeButtonInfoBadge
          label={`• ${t("employees.notAtWork")} - ${employeeStats.notAtWork}`}
          variant="notAtWork"
        />
      </View>
    );
  }

  return null;
}
