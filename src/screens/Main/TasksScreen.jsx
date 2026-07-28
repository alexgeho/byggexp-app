import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, taskService } from "../../services";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { ProjectFilterSelector } from "../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { resolveNewestTimestamp, sortByNewest } from "../../utils/sortByNewest";
import { cardStyles } from "../../styles/cards";
import { canCreateTasks } from "../../utils/userRoles";

const getTaskDisplayStatus = (task) => {
  if (task?.status === "completed") {
    return {
      label: "Completed",
      tone: "completed",
    };
  }

  const dueTime = task?.dueDate ? new Date(task.dueDate).getTime() : null;

  if (dueTime && !Number.isNaN(dueTime) && dueTime < Date.now()) {
    return {
      label: "Overdue",
      tone: "overdue",
    };
  }

  return {
    label: "Open",
    tone: "open",
  };
};

export default function TasksScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { user, userId, isLoading: authLoading } = useContext(AuthContext);
  const { refreshKey } = route.params || {};
  const [projects, setProjects] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const showCreateTask = canCreateTasks(user?.role);

  const fetchProjectsWithTasks = useCallback(async () => {
    try {
      setLoading(true);

      let baseProjects = [];
      if (user?.role === "superadmin") {
        baseProjects = await projectService.getAll();
      } else {
        baseProjects = await projectService.getMyProjects();
      }

      const [populatedProjects, accessibleTasks] = await Promise.all([
        Promise.all(
          baseProjects.map((project) =>
            projectService.getPopulatedById(project._id),
          ),
        ),
        taskService.getAll(),
      ]);

      setProjects(populatedProjects);
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
  }, [user?.role]);

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
    }, [authLoading, fetchProjectsWithTasks, user?.role, userId]),
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

  const formatTaskDate = (date) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text>Loading tasks...</Text>
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
        title={task.taskTitle || "Untitled task"}
        badgeLabel={status.label}
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
          {task.taskDescription || task.assigneeUserName || "No description"}
        </Text>
      </ListCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint="light"
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily["semiBold"] },
          ]}
        >
          Tasks
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <ProjectFilterSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {visiblePersonalTasks.length === 0 && groupedTasks.length === 0 ? (
          <Text style={styles.emptyText}>No projects or tasks found.</Text>
        ) : (
          <>
            {visiblePersonalTasks.length > 0 ? (
              <View style={styles.projectGroup}>
                <View style={styles.projectGroupHeader}>
                  <Text
                    style={[
                      styles.projectTitle,
                      { fontFamily: theme.text.fontFamily["bold"] },
                    ]}
                  >
                    Personal tasks
                  </Text>
                  <Text style={styles.projectCount}>
                    {visiblePersonalTasks.length}{" "}
                    {visiblePersonalTasks.length === 1 ? "task" : "tasks"}
                  </Text>
                </View>

                {visiblePersonalTasks.map((task, index) =>
                  renderTaskCard(task, {
                    project: null,
                    key: task._id || `personal-${index}`,
                  }),
                )}
              </View>
            ) : null}

            {groupedTasks.map((project) => (
              <View key={project._id} style={styles.projectGroup}>
                <View style={styles.projectGroupHeader}>
                  <Text
                    style={[
                      styles.projectTitle,
                      { fontFamily: theme.text.fontFamily["bold"] },
                    ]}
                  >
                    {project.name}
                  </Text>
                  <Text style={styles.projectCount}>
                    {project.visibleTasks.length}{" "}
                    {project.visibleTasks.length === 1 ? "task" : "tasks"}
                  </Text>
                </View>

                {project.visibleTasks.map((task, index) =>
                  renderTaskCard(task, {
                    project,
                    key: task._id || `${project._id}-${index}`,
                  }),
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={showCreateTask}
        onAddPress={() => navigation.navigate("CreateTask")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
  },
  searchContainer: {
    width: "100%",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    gap: 12,
    paddingBottom: 140,
  },
  projectGroup: {
    width: "100%",
    gap: 12,
  },
  projectGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectTitle: {
    color: "#052D50",
    fontSize: 17,
    flex: 1,
    marginRight: 12,
  },
  projectCount: {
    color: "#698196",
    fontSize: 14,
  },

  headerDateText: {
    fontSize: 13,
    flexShrink: 0,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#698196",
    fontSize: 16,
  },
});
