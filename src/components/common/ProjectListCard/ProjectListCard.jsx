import React from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";

import { ListCard } from "../ListCard/ListCard";
import { useCardStyles } from "../../../styles/cards";
import { useTheme } from "../../../theme/ThemeContext";
import { formatDateOrNull } from "../../../utils/dateLocale";
import {
  formatProjectStatus,
  getProjectStatusBadgeStyle,
} from "../../../utils/projectStatus";

// Shared project card (name + status badge + start date + location). Used by the
// Projects list AND every project picker so the two never diverge — pass
// `selected` to highlight a chosen project in a picker.
export function ProjectListCard({ project, onPress, selected = false }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const cardStyles = useCardStyles();
  const startDate = formatDateOrNull(project.beginningDate);

  return (
    <ListCard
      onPress={onPress}
      selected={selected}
      title={project.name}
      badgeLabel={t(
        `projects.status.${project.status}`,
        formatProjectStatus(project.status),
      )}
      badgeStyle={getProjectStatusBadgeStyle(project.status, theme.content)}
    >
      {startDate ? (
        <Text
          style={[cardStyles.cardPrimaryText, { color: theme.colors.primary }]}
        >
          {t("projects.startLabel", { date: startDate })}
        </Text>
      ) : null}
      {project.location ? (
        <Text
          style={[
            cardStyles.cardSecondaryText,
            { color: theme.content.textMuted },
          ]}
        >
          {t("projects.locationLabel", { location: project.location })}
        </Text>
      ) : null}
    </ListCard>
  );
}

export default ProjectListCard;
