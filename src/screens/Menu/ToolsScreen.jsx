import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, toolService } from "../../services";
import { API_BASE_URL } from "../../services/api";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { ProjectFilterSelector } from "../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import { createStyles } from "./ToolsScreen.styles";
import { cardStyles } from "../../styles/cards";
import { canManageTools } from "../../utils/userRoles";
import {
  TOOL_STATUS_OPTIONS,
  getToolStatusMeta,
} from "../../constants/toolStatus";

const TOOL_STATUS_BADGE_STYLES = {
  available: cardStyles.cardBadgeAvailable,
  broken: cardStyles.cardBadgeBroken,
  in_repair: cardStyles.cardBadgeInRepair,
  occupied: cardStyles.cardBadgeOccupied,
};

// Maintenance states (broken / in repair) are set manually and take priority.
// Otherwise a tool that has an assigned worker or a current holder counts as
// occupied ("in use"), and everything else is available.
const getEffectiveToolStatus = (tool) => {
  if (tool?.status === "broken" || tool?.status === "in_repair") {
    return tool.status;
  }
  const inUse =
    (Array.isArray(tool?.workerIds) && tool.workerIds.length > 0) ||
    Boolean(tool?.currentHolderId);
  return inUse ? "occupied" : "available";
};

const getEntityId = (entity) => {
  const id = entity?._id || entity?.id;
  return id ? String(id) : "";
};

const getRefId = (ref) => {
  const id = typeof ref === "string" ? ref : ref?._id || ref?.id;
  return id ? String(id) : "";
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

export default function ToolsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { user } = useContext(AuthContext);

  const [tools, setTools] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to "All projects" so every tool is visible (incl. newly created
  // Storage tools with no project). Matches the admin panel; the filter UI
  // still lets the user narrow to a single project.
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const loadTools = useCallback(async () => {
    try {
      setLoading(true);

      const [toolsData, projectsData] = await Promise.all([
        toolService.getAll(),
        user?.role === "superadmin"
          ? projectService.getAll()
          : projectService.getMyProjects(),
      ]);

      setTools(Array.isArray(toolsData) ? toolsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Failed to load tools:", error);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const filteredTools = useMemo(() => {
    const scoped = !selectedProjectId
      ? tools
      : tools.filter(
          (tool) =>
            Array.isArray(tool?.projectIds) &&
            tool.projectIds.some(
              (projectId) => getRefId(projectId) === selectedProjectId,
            ),
        );

    // Free (available) tools first, then occupied, then those needing service.
    const statusOrder = { available: 0, occupied: 1, in_repair: 2, broken: 3 };
    return [...scoped].sort(
      (left, right) =>
        (statusOrder[getEffectiveToolStatus(left)] ?? 99) -
        (statusOrder[getEffectiveToolStatus(right)] ?? 99),
    );
  }, [selectedProjectId, tools]);

  useFocusEffect(
    useCallback(() => {
      loadTools();
    }, [loadTools]),
  );

  const canEditStatus = canManageTools(user?.role);

  const handleChangeStatus = (tool) => {
    if (!canEditStatus) {
      return;
    }

    const toolId = getEntityId(tool);

    Alert.alert(t("tools.changeStatusTitle"), tool.name, [
      ...TOOL_STATUS_OPTIONS.map((option) => ({
        text: t(`tools.status.${option.value}`, option.label),
        onPress: async () => {
          if (option.value === tool.status) {
            return;
          }

          try {
            await toolService.update(toolId, { status: option.value });
            setTools((previousTools) =>
              previousTools.map((item) =>
                getEntityId(item) === toolId
                  ? { ...item, status: option.value }
                  : item,
              ),
            );
          } catch (error) {
            console.error("Failed to update tool status:", error);
            Alert.alert(t("common.error"), t("tools.statusUpdateError"));
          }
        },
      })),
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const themedAccentTextStyle = { color: theme.colors.primary };

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../assets/Arrow-left.png")}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("tools.listTitle")}
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate("ToolScan")}
          >
            <Text style={styles.scanButtonText}>{t("tools.scan")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <ProjectFilterSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.scrollContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            data={filteredTools}
            keyExtractor={(tool) => getEntityId(tool)}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t("tools.emptyTitle")}</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedProjectId
                    ? t("tools.emptyProjectFiltered")
                    : canManageTools(user?.role)
                      ? t("tools.emptyCanCreate")
                      : t("tools.emptyNoneAssigned")}
                </Text>
              </View>
            }
            renderItem={({ item: tool }) => {
              const photoUrl = resolvePhotoUrl(tool.photoUrl);
              const statusMeta = getToolStatusMeta(
                getEffectiveToolStatus(tool),
              );

              return (
                <ListCard
                  title={tool.name}
                  onPress={
                    canEditStatus ? () => handleChangeStatus(tool) : undefined
                  }
                  badgeLabel={t(
                    `tools.status.${statusMeta.value}`,
                    statusMeta.label,
                  )}
                  badgeStyle={TOOL_STATUS_BADGE_STYLES[statusMeta.tone]}
                  leading={
                    photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.toolPhoto}
                      />
                    ) : (
                      <View style={styles.toolPhotoPlaceholder}>
                        <Icon
                          name="tool"
                          size={14}
                          color="rgba(5, 45, 80, 0.35)"
                        />
                      </View>
                    )
                  }
                >
                  <Text
                    style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
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
            }}
          />
        )}

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={canManageTools(user?.role)}
          onAddPress={() => navigation.navigate("CreateTool")}
        />
      </View>
    </View>
  );
}
