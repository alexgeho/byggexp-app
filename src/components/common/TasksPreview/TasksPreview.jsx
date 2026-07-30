import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import AuthContext from "../../../contexts/AuthContext";
import { taskService } from "../../../services";
import { normalizeId } from "../../../utils/schedule";
import { getDateLocale } from "../../../utils/dateLocale";
// Reuse the shift-history preview styles for an identical look.
import { createStyles } from "../ShiftHistoryPreview/ShiftHistoryPreview.styles";

const DONE_STATUSES = new Set(["done", "completed", "closed"]);

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatDue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

// Home-screen preview of open tasks, mirroring ShiftHistoryPreview.
// Scoped to the selected project; soonest deadlines first.
export function TasksPreview({ colorMode = "dark", onClose, refreshKey = 0 }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { selectedProject } = useContext(AuthContext);
  const projectId = selectedProject?._id || selectedProject?.id;
  const styles = createStyles(theme, colorMode);
  const secondaryIconColor =
    colorMode === "light" ? `${theme.colors.text}80` : "rgba(255,255,255,0.72)";
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await taskService.getAll();
      const scoped = (Array.isArray(data) ? data : [])
        .filter(
          (task) =>
            !projectId || normalizeId(task.projectId) === String(projectId),
        )
        .filter(
          (task) => !DONE_STATUSES.has(String(task.status || "").toLowerCase()),
        );

      const withDate = scoped
        .filter((task) => task.dueDate)
        .sort(
          (left, right) =>
            new Date(left.dueDate).getTime() -
            new Date(right.dueDate).getTime(),
        );
      const withoutDate = scoped.filter((task) => !task.dueDate);

      setTasks([...withDate, ...withoutDate]);
    } catch (error) {
      console.error("Failed to load tasks preview:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const today = startOfToday();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("menu.tasks")}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Tasks")}
            activeOpacity={0.8}
          >
            <Text style={styles.linkText}>{t("common.viewAll")}</Text>
            <Icon
              name="arrow-right"
              size={18}
              color={secondaryIconColor}
              style={styles.linkIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Icon name="x" size={18} color={secondaryIconColor} />
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : tasks.length ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {tasks.map((task, index) => {
              const due = task.dueDate
                ? new Date(task.dueDate).getTime()
                : null;
              const overdue = due != null && due < today;

              return (
                <View
                  key={task._id || task.id || `${task.taskTitle}-${index}`}
                  style={[
                    styles.item,
                    index !== tasks.length - 1 && styles.itemDivider,
                  ]}
                >
                  <Text style={styles.dateText}>
                    {task.dueDate
                      ? formatDue(task.dueDate)
                      : t("tasksPreview.noDate")}
                  </Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.projectText} numberOfLines={2}>
                      {task.taskTitle || t("tasksPreview.untitled")}
                    </Text>

                    <View style={styles.summaryRightColumn}>
                      <Text
                        style={[
                          styles.durationText,
                          overdue && { color: "#FF9A9A" },
                        ]}
                      >
                        {overdue
                          ? t("task.status.overdue")
                          : t("task.status.open")}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t("tasksPreview.noTasks")}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default TasksPreview;
