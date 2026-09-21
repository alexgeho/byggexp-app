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
import {
  Alert,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, taskService } from "../../services";
import { EntityListScreen } from "../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { ProjectFilterSelector } from "../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import { createStyles } from "./TasksScreen.styles";
import { resolveNewestTimestamp } from "../../utils/sortByNewest";
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
  // What the screen is FOR: the work still to do. Done tasks live behind
  // their own chip instead of burying the open ones, which is how every
  // task app people already use behaves.
  const [statusFilter, setStatusFilter] = useState("open");
  // Folded project groups, by section title. A long list of projects is
  // easier to scan when the ones you are not working on today are closed.
  const [collapsed, setCollapsed] = useState({});
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

  // Overdue first, then by due date, then whatever has no date — a list you
  // can work from top to bottom.
  const byUrgency = (tasks) =>
    [...tasks].sort((left, right) => {
      const leftDue = left?.dueDate ? Date.parse(left.dueDate) : null;
      const rightDue = right?.dueDate ? Date.parse(right.dueDate) : null;
      if (leftDue && rightDue) return leftDue - rightDue;
      if (leftDue) return -1;
      if (rightDue) return 1;
      return 0;
    });

  const matchesStatus = useCallback(
    (task) => {
      if (statusFilter === "all") return true;
      const tone = getTaskDisplayStatus(task).tone;
      if (statusFilter === "open") return tone !== "completed";
      return tone === statusFilter;
    },
    [statusFilter],
  );

  const visiblePersonalTasks = useMemo(() => {
    // Personal tasks have no project, so only show them under "All projects".
    if (selectedProjectId) {
      return [];
    }

    return byUrgency(personalTasks.filter(matchesStatus));
  }, [personalTasks, selectedProjectId, matchesStatus]);

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
        const tasks = byUrgency(
          (Array.isArray(project.tasks) ? project.tasks : []).filter(
            matchesStatus,
          ),
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
  }, [projects, selectedProjectId, matchesStatus]);

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

  const toggleSection = useCallback((title) => {
    setCollapsed((previous) => ({ ...previous, [title]: !previous[title] }));
  }, []);

  const sections = useMemo(() => {
    const result = [];
    if (visiblePersonalTasks.length > 0) {
      const title = t("task.personal");
      result.push({
        title,
        project: null,
        count: visiblePersonalTasks.length,
        // The shared list renders a row without section context, so each task
        // carries its project with it.
        data: collapsed[title]
          ? []
          : visiblePersonalTasks.map((task) => ({ ...task, project: null })),
      });
    }
    groupedTasks.forEach((project) => {
      result.push({
        title: project.name,
        project,
        count: project.visibleTasks.length,
        data: collapsed[project.name]
          ? []
          : project.visibleTasks.map((task) => ({ ...task, project })),
      });
    });
    return result;
  }, [visiblePersonalTasks, groupedTasks, t, collapsed]);

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
      renderSectionHeader={({ section }) => {
        const isCollapsed = Boolean(collapsed[section.title]);
        return (
          <TouchableOpacity
            style={styles.projectGroupHeader}
            onPress={() => toggleSection(section.title)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded: !isCollapsed }}
          >
            <Icon
              name={isCollapsed ? "chevron-right" : "chevron-down"}
              size={18}
              color={theme.content.textMuted}
            />
            <Text
              style={[
                styles.projectTitle,
                { fontFamily: theme.text.fontFamily["bold"] },
              ]}
            >
              {section.title}
            </Text>
            <Text style={styles.projectCount}>
              {t("task.count", { count: section.count })}
            </Text>
          </TouchableOpacity>
        );
      }}
      filters={["open", "overdue", "completed", "all"].map((value) => ({
        value,
        label: t(`task.filter.${value}`),
      }))}
      activeFilter={statusFilter}
      onFilterChange={setStatusFilter}
      onDelete={canDeleteTasks ? handleDeleteTask : undefined}
      emptyText={t(`task.empty.${statusFilter}`, t("task.emptyAll"))}
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
      renderCard={(task) =>
        renderTaskCard(task, { project: task.project, key: task._id })
      }
    />
  );
}
