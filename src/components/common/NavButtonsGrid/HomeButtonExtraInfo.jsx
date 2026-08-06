import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import HomeButtonInfoBadge from "./HomeButtonInfoBadge";

export function HomeButtonExtraInfo({
  buttonId,
  showEmployeeStats,
  employeeStats,
  taskDeadlines,
  projectStart,
  projectDeadline,
  style,
}) {
  const { t } = useTranslation();

  if (buttonId === "tasks" && taskDeadlines?.length) {
    return (
      <View
        style={[style, { flexDirection: "column", alignItems: "flex-start" }]}
      >
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

  if (buttonId === "projects" && (projectStart || projectDeadline)) {
    return (
      <View
        style={[style, { flexDirection: "column", alignItems: "flex-start" }]}
      >
        {projectStart ? (
          <HomeButtonInfoBadge
            label={`${t("home.projectStart")} · ${projectStart}`}
            variant="deadline"
          />
        ) : null}
        {projectDeadline ? (
          <HomeButtonInfoBadge
            label={`${t("home.projectEnd")} · ${projectDeadline}`}
            variant="deadline"
          />
        ) : null}
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
