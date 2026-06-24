import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, taskService } from "../../services";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../components/common/BackButton/BackButton";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { resolveNewestTimestamp, sortByNewest } from "../../utils/sortByNewest";

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
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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

              {visiblePersonalTasks.map((task, index) => {
                const status = getTaskDisplayStatus(task);

                return (
                  <TouchableOpacity
                    key={task._id || `personal-${index}`}
                    style={styles.taskItem}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("Task", {
                        task,
                        project: null,
                      })
                    }
                  >
                    <Text style={styles.taskTitle}>
                      {task.taskTitle || "Untitled task"}
                    </Text>
                    {!!task.taskDescription && (
                      <Text style={styles.taskDescription}>
                        {task.taskDescription}
                      </Text>
                    )}
                    <View style={styles.taskFooter}>
                      {!!task.assigneeUserName && (
                        <Text style={styles.assigneeText}>
                          {task.assigneeUserName}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.statusBadge,
                          styles[`statusBadge_${status.tone}`],
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            styles[`statusBadgeText_${status.tone}`],
                          ]}
                        >
                          {status.label}
                        </Text>
                      </View>
                      <View style={styles.taskProjectInfo}>
                        <Image
                          style={styles.dateIcon}
                          source={require("../../assets/TasksCalendar.png")}
                        />
                        <Text style={styles.dateText}>
                          {formatTaskDate(task.dueDate)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
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

                {project.visibleTasks.map((task, index) => {
                  const status = getTaskDisplayStatus(task);

                  return (
                    <TouchableOpacity
                    key={task._id || `${project._id}-${index}`}
                    style={styles.taskItem}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("Task", { task, project })
                    }
                  >
                    <Text style={styles.taskTitle}>
                      {task.taskTitle || "Untitled task"}
                    </Text>
                    {!!task.taskDescription && (
                      <Text style={styles.taskDescription}>
                        {task.taskDescription}
                      </Text>
                    )}
                    <View style={styles.taskFooter}>
                      <View
                        style={[
                          styles.statusBadge,
                          styles[`statusBadge_${status.tone}`],
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            styles[`statusBadgeText_${status.tone}`],
                          ]}
                        >
                          {status.label}
                        </Text>
                      </View>
                      <View style={styles.taskProjectInfo}>
                        <Image
                          style={styles.dateIcon}
                          source={require("../../assets/TasksCalendar.png")}
                        />
                        <Text style={styles.dateText}>
                          {formatTaskDate(task.dueDate)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
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
  searchInput: {
    width: "100%",
    height: 64,
    backgroundColor: "#052D500D",
    borderRadius: 20,
    padding: 16,
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    gap: 16,
    paddingBottom: 96,
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
  taskItem: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
  },
  taskTitle: {
    color: "#052D50",
    fontSize: 20,
  },
  taskDescription: {
    color: "#052D5050",
  },
  taskFooter: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  assigneeText: {
    color: "#698196",
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  statusBadge_open: {
    backgroundColor: "rgba(7, 133, 244, 0.12)",
  },
  statusBadge_overdue: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
  },
  statusBadge_completed: {
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgeText_open: {
    color: "#0785F4",
  },
  statusBadgeText_overdue: {
    color: "#FF3B30",
  },
  statusBadgeText_completed: {
    color: "#248A3D",
  },
  taskProjectInfo: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 4,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: "#0177DE0D",
    borderRadius: 999,
  },
  dateIcon: {
    width: 14,
    height: 14,
  },
  dateText: {
    color: "#0785F4",
  },
  noTasksText: {
    color: "#698196",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#698196",
    fontSize: 16,
  },
});
