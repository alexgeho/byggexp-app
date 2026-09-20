import React, { useCallback, useContext, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, toolService } from "../../services";
import { EntityListScreen } from "../../components/common/EntityListScreen/EntityListScreen";
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

  // Swipe a tool card left to reveal a red "Ta bort". Only for roles that may
  // manage tools; the deliberate left-swipe is the safeguard, so no confirm —
  // same behaviour as the projects list.
  const handleDeleteTool = useCallback(
    async (tool) => {
      const toolId = getEntityId(tool);
      try {
        await toolService.remove(toolId);
        // Drop it only once the backend confirms — no flash/re-appear on error.
        setTools((previousTools) =>
          previousTools.filter((item) => getEntityId(item) !== toolId),
        );
      } catch (error) {
        const status = error?.response?.status;
        const raw = error?.response?.data?.message ?? error?.message;
        const detail = Array.isArray(raw) ? raw.join(", ") : raw;
        console.error("Failed to delete tool:", status, detail, error);
        Alert.alert(
          t("common.error"),
          `${t("tools.deleteFailed")}\n[${status ?? "?"}] ${detail ?? ""}`,
        );
      }
    },
    [t],
  );

  return (
    <EntityListScreen
      title={t("tools.listTitle")}
      data={filteredTools}
      loading={loading}
      keyExtractor={(tool) => getEntityId(tool)}
      onDelete={canManageTools(user?.role) ? handleDeleteTool : undefined}
      emptyText={
        selectedProjectId
          ? t("tools.emptyProjectFiltered")
          : canManageTools(user?.role)
            ? t("tools.emptyCanCreate")
            : t("tools.emptyNoneAssigned")
      }
      addScreen={canManageTools(user?.role) ? "CreateTool" : undefined}
      headerRight={
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate("ToolScan")}
        >
          <Text style={styles.scanButtonText}>{t("tools.scan")}</Text>
        </TouchableOpacity>
      }
      beforeList={
        <View style={styles.searchContainer}>
          <ProjectFilterSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
          />
        </View>
      }
      renderCard={(tool) => (
        <ToolListCard
          tool={tool}
          onPress={canEditStatus ? () => handleChangeStatus(tool) : undefined}
        />
      )}
    />
  );
}
