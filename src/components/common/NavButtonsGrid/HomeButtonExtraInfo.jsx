import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import HomeButtonInfoBadge from "./HomeButtonInfoBadge";

export function HomeButtonExtraInfo({
  buttonId,
  showEmployeeStats,
  employeeStats,
  taskDeadlines,
  projectDeadline,
  style,
}) {
  const { t } = useTranslation();

  if (buttonId === "tasks" && taskDeadlines?.length) {
    return (
      <View style={style}>
        {taskDeadlines.map((deadline, index) => (
          <HomeButtonInfoBadge
            key={`${deadline.label}-${index}`}
            label={deadline.label}
            variant={deadline.overdue ? "overdue" : "deadline"}
          />
        ))}
      </View>
    );
  }

  if (buttonId === "projects" && projectDeadline) {
    return (
      <View style={style}>
        <HomeButtonInfoBadge label={projectDeadline} variant="deadline" />
      </View>
    );
  }

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
