import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { taskService, projectService } from "../services";
import { getDateLocale } from "../utils/dateLocale";
import { normalizeId } from "../utils/schedule";

const DONE_STATUSES = new Set(["done", "completed", "closed"]);

const isOpenTask = (task) =>
  !DONE_STATUSES.has(String(task?.status || "").toLowerCase());

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatDeadline = (timestamp) =>
  new Intl.DateTimeFormat(getDateLocale(), {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));

// Earliest upcoming (today or later) date from a list of date strings.
const nextDeadline = (dateStrings) => {
  const today = startOfToday();
  const upcoming = dateStrings
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time) && time >= today)
    .sort((left, right) => left - right);

  return upcoming.length ? formatDeadline(upcoming[0]) : null;
};

// Up to two task deadlines for the home tile, prioritising overdue:
// two overdue if available, otherwise 1 overdue + 1 upcoming, otherwise
// the two soonest upcoming. Each item is { label, overdue }.
const buildTaskDeadlines = (dateStrings) => {
  const today = startOfToday();
  const times = dateStrings
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time));

  const overdue = times.filter((time) => time < today).sort((a, b) => a - b);
  const upcoming = times.filter((time) => time >= today).sort((a, b) => a - b);

  const picks = overdue
    .slice(0, 2)
    .map((time) => ({ label: formatDeadline(time), overdue: true }));

  for (const time of upcoming) {
    if (picks.length >= 2) break;
    picks.push({ label: formatDeadline(time), overdue: false });
  }

  return picks;
};

/**
 * Home-tile badges for Tasks and Projects: open task count and the nearest
 * upcoming deadline. Scoped to a project when one is selected.
 */
export function useTaskProjectBadges({ projectId } = {}) {
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [taskDeadlines, setTaskDeadlines] = useState([]);
  const [projectDeadline, setProjectDeadline] = useState(null);

  const load = useCallback(async () => {
    try {
      const [tasks, projects] = await Promise.all([
        taskService.getAll().catch(() => []),
        projectService.getMyProjects().catch(() => []),
      ]);

      const scopedTasks = (Array.isArray(tasks) ? tasks : []).filter(
        (task) =>
          !projectId || normalizeId(task.projectId) === String(projectId),
      );
      const openTasks = scopedTasks.filter(isOpenTask);

      setOpenTaskCount(openTasks.length);
      setTaskDeadlines(
        buildTaskDeadlines(
          openTasks.map((task) => task.dueDate).filter(Boolean),
        ),
      );

      const scopedProjects = (Array.isArray(projects) ? projects : []).filter(
        (project) => !projectId || normalizeId(project) === String(projectId),
      );
      setProjectDeadline(
        nextDeadline(
          scopedProjects.map((project) => project.endDate).filter(Boolean),
        ),
      );
    } catch (error) {
      console.error("Failed to load task/project badges:", error);
      setOpenTaskCount(0);
      setTaskDeadlines([]);
      setProjectDeadline(null);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { openTaskCount, taskDeadlines, projectDeadline };
}

export default useTaskProjectBadges;
