import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { getDateLocale } from "../../utils/dateLocale";
import { getTaskDisplayStatus } from "../../utils/taskStatus";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, View, Text, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, taskService } from "../../services";
import { EntityListScreen } from "../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { ProjectFilterSelector } from "../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import { createStyles } from "./TasksScreen.styles";
import { resolveNewestTimestamp, sortByNewest } from "../../utils/sortByNewest";
import { cardStyles } from "../../styles/cards";
import { canCreateTasks, canManageTasks } from "../../utils/userRoles";

export default function TasksScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { user, isLoading: authLoading } = useContext(AuthContext);
  const { refreshKey } = route.params || {};
  const [projects, setProjects] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const showCreateTask = canCreateTasks(user?.role);

  const fetchProjectsWithTasks = useCallback(async () => {
    try {
      setLoading(true);

      // One request for every accessible project (populated incl. tasks),
      // instead of getMyProjects + a getPopulatedById per project (N+1).
      const [populatedProjects, accessibleTasks] = await Promise.all([
        projectService.getMyPopulated(),
        taskService.getAll(),
      ]);

      setProjects(Array.isArray(populatedProjects) ? populatedProjects : []);
      setPersonalTasks(
        Array.isArray(accessibleTasks)
          ? accessibleTasks.filter((task) => !task?.projectId)
          : [],
      );
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setProjects([]);
      setPersonalTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const visiblePersonalTasks = useMemo(() => {
    // Personal tasks have no project, so only show them under "All projects".
    if (selectedProjectId) {
      return [];
    }

    return sortByNewest(personalTasks, (task) => [
      task?.createdAt,
      task?.updatedAt,
      task?.startDate,
      task?.dueDate,
    ]);
  }, [personalTasks, selectedProjectId]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && user?.role) {
        fetchProjectsWithTasks();
      }
    }, [authLoading, fetchProjectsWithTasks, user?.role]),
  );

  useEffect(() => {
    if (!refreshKey || authLoading || !user?.role) {
      return;
    }

    fetchProjectsWithTasks();
  }, [authLoading, fetchProjectsWithTasks, refreshKey, user?.role]);

  const groupedTasks = useMemo(() => {
    return projects
      .map((project) => {
        const tasks = sortByNewest(
          Array.isArray(project.tasks) ? project.tasks : [],
          (task) => [
            task?.createdAt,
            task?.updatedAt,
            task?.startDate,
            task?.dueDate,
          ],
        );

        return {
          ...project,
          visibleTasks: tasks,
          newestVisibleTaskTimestamp: resolveNewestTimestamp(
            tasks[0]?.createdAt,
            tasks[0]?.updatedAt,
            tasks[0]?.startDate,
            tasks[0]?.dueDate,
            project?.createdAt,
            project?.updatedAt,
          ),
        };
      })
      .filter((project) => {
        if (
          selectedProjectId &&
          String(project._id) !== String(selectedProjectId)
        ) {
          return false;
        }

        return project.visibleTasks.length > 0;
      })
      .sort(
        (leftProject, rightProject) =>
          rightProject.newestVisibleTaskTimestamp -
          leftProject.newestVisibleTaskTimestamp,
      );
  }, [projects, selectedProjectId]);

  // Personal tasks first, then one section per project — the same order the
  // screen rendered before, now as SectionList data so long lists virtualize.
  // Swipe a task left to delete it, like every other list. Only for roles that
  // may manage tasks; the deliberate left-swipe is the safeguard.
  const canDeleteTasks = canManageTasks(user?.role);

  const handleDeleteTask = useCallback(
    async (task) => {
      const id = task._id || task.id;
      try {
        await taskService.remove(id);
        // Tasks live inside projects and in the personal list, so refetch
        // rather than trying to splice both shapes.
        await fetchProjectsWithTasks();
      } catch (error) {
        const status = error?.response?.status;
        const raw = error?.response?.data?.message ?? error?.message;
        const detail = Array.isArray(raw) ? raw.join(", ") : raw;
        console.error("Failed to delete task:", status, detail, error);
        Alert.alert(
          t("common.error"),
          `${t("task.deleteFailed")}\n[${status ?? "?"}] ${detail ?? ""}`,
        );
      }
    },
    [fetchProjectsWithTasks, t],
  );

  const sections = useMemo(() => {
    const result = [];
    if (visiblePersonalTasks.length > 0) {
      result.push({
        title: t("task.personal"),
        project: null,
        // The shared list renders a row without section context, so each task
        // carries its project with it.
        data: visiblePersonalTasks.map((task) => ({ ...task, project: null })),
      });
    }
    groupedTasks.forEach((project) => {
      result.push({
        title: project.name,
        project,
        data: project.visibleTasks.map((task) => ({ ...task, project })),
      });
    });
    return result;
  }, [visiblePersonalTasks, groupedTasks, t]);

  const formatTaskDate = (date) => {
    if (!date) return t("task.noDueDate");
    return new Date(date).toLocaleDateString(getDateLocale());
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text>{t("task.loading")}</Text>
      </View>
    );
  }

  const themedAccentTextStyle = { color: theme.colors.primary };

  const renderTaskCard = (task, { project = null, key }) => {
    const status = getTaskDisplayStatus(task);

    /* badge style */
    const badgeStyles = {
      open: cardStyles.cardBadgeOpen,
      overdue: cardStyles.cardBadgeOverdue,
      completed: cardStyles.cardBadgeCompleted,
    };

    return (
      <ListCard
        key={key}
        onPress={() =>
          navigation.navigate("Task", {
            task,
            project,
            tasksRouteKey: route.key,
          })
        }
        title={task.taskTitle || t("task.untitled")}
        badgeLabel={t(`task.status.${status.tone}`, status.label)}
        badgeStyle={badgeStyles[status.tone]}
      >
        <Text style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}>
          {formatTaskDate(task.dueDate)}
        </Text>

        <Text
          style={cardStyles.cardSecondaryText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {task.taskDescription ||
            task.assigneeUserName ||
            t("task.noDescription")}
        </Text>
      </ListCard>
    );
  };

  return (
    <EntityListScreen
      title={t("task.title")}
      loading={false}
      sections={sections}
      keyExtractor={(item, index) => item._id || `task-${index}`}
      renderSectionHeader={({ section }) => (
        <View style={[styles.projectGroupHeader, styles.sectionHeaderSpacing]}>
          <Text
            style={[
              styles.projectTitle,
              { fontFamily: theme.text.fontFamily["bold"] },
            ]}
          >
            {section.title}
          </Text>
          <Text style={styles.projectCount}>
            {t("task.count", { count: section.data.length })}
          </Text>
        </View>
      )}
      onDelete={canDeleteTasks ? handleDeleteTask : undefined}
      emptyText={t("task.emptyAll")}
      addScreen={showCreateTask ? "CreateTask" : undefined}
      beforeList={
        <View style={styles.searchContainer}>
          <ProjectFilterSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
          />
        </View>
      }
      renderCard={(task) => (
        <View style={styles.taskCardSpacing}>
          {renderTaskCard(task, {
            project: task.project,
            key: task._id,
          })}
        </View>
      )}
    />
  );
}
