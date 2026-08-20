import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { ListCard } from "../ListCard/ListCard";
import { cardStyles } from "../../../styles/cards";
import { useTheme } from "../../../theme/ThemeContext";
import { API_BASE_URL } from "../../../services/api";
import { getToolStatusMeta } from "../../../constants/toolStatus";

const TOOL_STATUS_BADGE_STYLES = {
  available: cardStyles.cardBadgeAvailable,
  broken: cardStyles.cardBadgeBroken,
  in_repair: cardStyles.cardBadgeInRepair,
  occupied: cardStyles.cardBadgeOccupied,
};

// Maintenance states (broken / in repair) are set manually and take priority.
// Otherwise a tool that has an assigned worker or a current holder counts as
// occupied ("in use"), and everything else is available.
export const getEffectiveToolStatus = (tool) => {
  if (tool?.status === "broken" || tool?.status === "in_repair") {
    return tool.status;
  }
  const inUse =
    (Array.isArray(tool?.workerIds) && tool.workerIds.length > 0) ||
    Boolean(tool?.currentHolderId);
  return inUse ? "occupied" : "available";
};

const resolvePhotoUrl = (value) => {
  if (!value) {
    return null;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

// Shared tool card used by both the Tools list screen and the project Tools tab
// so the two stay visually identical (photo, status badge, notes, counts).
export function ToolListCard({ tool, onPress }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const photoUrl = resolvePhotoUrl(tool.photoUrl);
  const statusMeta = getToolStatusMeta(getEffectiveToolStatus(tool));

  return (
    <ListCard
      title={tool.name || t("common.noName")}
      onPress={onPress}
      badgeLabel={t(`tools.status.${statusMeta.value}`, statusMeta.label)}
      badgeStyle={TOOL_STATUS_BADGE_STYLES[statusMeta.tone]}
      leading={
        photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.toolPhoto} />
        ) : (
          <View style={styles.toolPhotoPlaceholder}>
            <Icon name="tool" size={14} color="rgba(5, 45, 80, 0.35)" />
          </View>
        )
      }
    >
      <Text
        style={[cardStyles.cardPrimaryText, { color: theme.colors.primary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {tool.notes || t("tools.noNotes")}
      </Text>
      <Text style={cardStyles.cardSecondaryText}>
        {t("tools.countSummary", {
          workers: tool.workerIds?.length || 0,
          projects: tool.projectIds?.length || 0,
        })}
      </Text>
    </ListCard>
  );
}

const styles = StyleSheet.create({
  toolPhoto: {
    width: 28,
    height: 28,
    borderRadius: 8,
    marginRight: 12,
  },
  toolPhotoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "rgba(5, 45, 80, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ToolListCard;
