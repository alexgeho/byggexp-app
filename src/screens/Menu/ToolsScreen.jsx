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
  standardScreenHeaderPlaceholder,
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
  const { theme } = useTheme();
  const { user, selectedProject } = useContext(AuthContext);

  const [tools, setTools] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => selectedProject?._id || selectedProject?.id || null,
  );

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
    if (!selectedProjectId) {
      return tools;
    }

    return tools.filter((tool) => {
      if (!Array.isArray(tool?.projectIds)) {
        return false;
      }

      return tool.projectIds.some(
        (projectId) => getRefId(projectId) === selectedProjectId,
      );
    });
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

    Alert.alert(
      "Change tool status",
      tool.name,
      [
        ...TOOL_STATUS_OPTIONS.map((option) => ({
          text: option.label,
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
              Alert.alert("Error", "Unable to update tool status right now.");
            }
          },
        })),
        { text: "Cancel", style: "cancel" },
      ],
    );
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
            Instruments
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate("ToolScan")}
          >
            <Text style={styles.scanButtonText}>Skanna</Text>
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
                <Text style={styles.emptyTitle}>No instruments found</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedProjectId
                    ? "No instruments assigned to this project."
                    : canManageTools(user?.role)
                      ? "Tap the add button below to create the first instrument."
                      : "No instruments are assigned yet."}
                </Text>
              </View>
            ) : (
              filteredTools.map((tool) => {
                const toolId = getEntityId(tool);
                const photoUrl = resolvePhotoUrl(tool.photoUrl);
                const statusMeta = getToolStatusMeta(tool.status);

                return (
                  <ListCard
                    key={toolId}
                    title={tool.name}
                    onPress={
                      canEditStatus ? () => handleChangeStatus(tool) : undefined
                    }
                    badgeLabel={statusMeta.label}
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
                      {tool.notes || "No notes"}
                    </Text>
                    <Text style={cardStyles.cardSecondaryText}>
                      {tool.workerIds?.length || 0} workers ·{" "}
                      {tool.projectIds?.length || 0} projects
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
    backgroundColor: "#EEEEEE",
  },
  pageContainer: {
    ...standardScreenContainer,
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
    height: 40,
    minWidth: 72,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0785F4",
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
