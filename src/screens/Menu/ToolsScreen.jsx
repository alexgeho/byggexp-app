import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
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
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";
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
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredTools.length === 0 ? (
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
            ) : (
              filteredTools.map((tool) => {
                const toolId = getEntityId(tool);
                const photoUrl = resolvePhotoUrl(tool.photoUrl);
                const statusMeta = getToolStatusMeta(
                  getEffectiveToolStatus(tool),
                );

                return (
                  <ListCard
                    key={toolId}
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
                      style={[
                        cardStyles.cardPrimaryText,
                        themedAccentTextStyle,
                      ]}
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
              })
            )}
          </ScrollView>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F9FBFD",
  },
  pageContainer: {
    ...standardScreenContainer,
    backgroundColor: "#F9FBFD",
    paddingBottom: 0,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
    flex: 1,
  },
  scanButton: {
    height: 44,
    minWidth: 72,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0785F4",
    // Admin-style primary button glow for depth.
    shadowColor: "#0089F6",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  searchContainer: {
    width: "100%",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingBottom: 140,
    gap: 12,
  },
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
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#052D50",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(5, 45, 80, 0.55)",
    textAlign: "center",
  },
});
