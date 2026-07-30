import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
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

// Overdue deadlines are highlighted in red (date text only).
const OVERDUE_COLOR = "#FF6B6B";

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
  const [completingIds, setCompletingIds] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await taskService.getAll();
      const scoped = (Array.isArray(data) ? data : [])
        .filter(
          // Tasks of the selected project plus the user's personal tasks
          // (personal tasks have no projectId).
          (task) =>
            !projectId ||
            !task.projectId ||
            normalizeId(task.projectId) === String(projectId),
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

  // Tap the checkbox to complete a task right from the home screen. The row
  // disappears immediately (completed tasks are hidden); reloads on failure.
  const handleComplete = useCallback(
    async (task) => {
      const id = task._id || task.id;
      if (!id || completingIds.includes(id)) {
        return;
      }
      setCompletingIds((prev) => [...prev, id]);
      setTasks((prev) => prev.filter((item) => (item._id || item.id) !== id));
      try {
        await taskService.complete(id);
      } catch (error) {
        console.error("Failed to complete task:", error);
        await load();
      } finally {
        setCompletingIds((prev) => prev.filter((item) => item !== id));
      }
    },
    [completingIds, load],
  );

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

      <View
        style={[
          styles.card,
          !loading && tasks.length <= 1 && extraStyles.cardShort,
        ]}
      >
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
                    extraStyles.item,
                    index !== tasks.length - 1 && styles.itemDivider,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      overdue && extraStyles.dateOverdue,
                    ]}
                  >
                    {task.dueDate
                      ? formatDue(task.dueDate)
                      : t("tasksPreview.noDate")}
                  </Text>

                  <View style={extraStyles.titleRow}>
                    <Text
                      style={[styles.projectText, extraStyles.titleText]}
                      numberOfLines={2}
                    >
                      {task.taskTitle || t("tasksPreview.untitled")}
                    </Text>

                    <TouchableOpacity
                      style={[
                        extraStyles.checkbox,
                        { borderColor: secondaryIconColor },
                      ]}
                      onPress={() => handleComplete(task)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityLabel={t("tasksPreview.complete")}
                    />
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

const extraStyles = StyleSheet.create({
  // Shorter card when there is at most one task so it doesn't look empty.
  cardShort: {
    height: 120,
  },
  item: {
    // Extra gap so the title row + checkbox sit clearly below the date row
    // and the checkbox never crowds the close (×) button.
    gap: 14,
  },
  // Title, status and checkbox share one row so the checkbox sits level
  // with the task text.
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleText: {
    flex: 1,
  },
  dateOverdue: {
    color: OVERDUE_COLOR,
    opacity: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    backgroundColor: "#FFFFFF",
  },
});

export default TasksPreview;
