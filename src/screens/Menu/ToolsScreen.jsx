import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, toolService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import {
  ToolListCard,
  getEffectiveToolStatus,
} from "../../components/common/ToolListCard/ToolListCard";
import { ProjectFilterSelector } from "../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import { createStyles } from "./ToolsScreen.styles";
import { canManageTools } from "../../utils/userRoles";
import { getEntityId } from "../../utils/entityId";
import { TOOL_STATUS_OPTIONS } from "../../constants/toolStatus";

const getRefId = (ref) => {
  const id = typeof ref === "string" ? ref : ref?._id || ref?.id;
  return id ? String(id) : "";
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
            renderItem={({ item: tool }) => (
              <ToolListCard
                tool={tool}
                onPress={
                  canEditStatus ? () => handleChangeStatus(tool) : undefined
                }
              />
            )}
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
