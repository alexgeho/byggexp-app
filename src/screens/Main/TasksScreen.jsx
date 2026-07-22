import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, taskService } from "../../services";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { ListCard } from "../../components/common/ListCard/ListCard";
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
  const { theme } = useTheme();
  const { user, userId, isLoading: authLoading } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const visibleTasks = normalizedQuery
      ? personalTasks.filter((task) => {
          const haystack = [
            task?.taskTitle,
            task?.taskDescription,
            task?.assigneeUserName,
            "personal",
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedQuery);
        })
      : personalTasks;

    return sortByNewest(visibleTasks, (task) => [
      task?.createdAt,
      task?.updatedAt,
      task?.startDate,
      task?.dueDate,
    ]);
  }, [personalTasks, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && user?.role) {
        fetchProjectsWithTasks();
      }
    }, [authLoading, fetchProjectsWithTasks, user?.role, userId]),
  );

  const groupedTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

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
        const projectMatches = project.name
          ?.toLowerCase()
          .includes(normalizedQuery);
        const visibleTasks = normalizedQuery
          ? tasks.filter((task) => {
              const haystack = [
                task?.taskTitle,
                task?.taskDescription,
                project.name,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return haystack.includes(normalizedQuery);
            })
          : tasks;

        return {
          ...project,
          visibleTasks: projectMatches ? tasks : visibleTasks,
          newestVisibleTaskTimestamp: resolveNewestTimestamp(
            projectMatches ? tasks[0]?.createdAt : visibleTasks[0]?.createdAt,
            projectMatches ? tasks[0]?.updatedAt : visibleTasks[0]?.updatedAt,
            projectMatches ? tasks[0]?.startDate : visibleTasks[0]?.startDate,
            projectMatches ? tasks[0]?.dueDate : visibleTasks[0]?.dueDate,
            project?.createdAt,
            project?.updatedAt,
          ),
        };
      })
      .filter((project) => {
        return project.visibleTasks.length > 0;
      })
      .sort(
        (leftProject, rightProject) =>
          rightProject.newestVisibleTaskTimestamp -
          leftProject.newestVisibleTaskTimestamp,
      );
  }, [projects, searchQuery]);

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
        onPress={() => navigation.navigate("Task", { task, project })}
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
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="rgba(5, 45, 80, 0.45)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.searchIconWrapper} pointerEvents="none">
            <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {visiblePersonalTasks.length === 0 && groupedTasks.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? "No tasks found."
              : "No projects or tasks found."}
          </Text>
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
  searchInputWrapper: {
    width: "100%",
    height: 48,
    backgroundColor: "#052D500D",
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: "#052D50",
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: 12,
  },
  searchIconWrapper: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
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
