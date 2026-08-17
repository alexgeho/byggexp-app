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

// Earliest date from a list, regardless of past/future — a project's start
// is usually already behind us, so it must not be filtered like a deadline.
const earliestDate = (dateStrings) => {
  const times = dateStrings
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => left - right);

  return times.length ? formatDeadline(times[0]) : null;
};

const truncate = (text, max = 16) => {
  const value = String(text || "").trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

// Up to two task deadlines for the home tile. Overdue work is surfaced first,
// but the tile always keeps room for one upcoming task when one exists, so it
// shows more than just overdue items. "Upcoming" means the soonest future
// deadline, then open tasks with no due date at all. Each item is
// { label, overdue }; the label is "<date> · <short task title>" (or just the
// title when the task has no date).
const buildTaskDeadlines = (tasks) => {
  const today = startOfToday();
  const normalized = tasks.map((task) => ({
    title: task?.taskTitle || task?.title || task?.name || "",
    time: new Date(task?.dueDate).getTime(),
  }));

  const overdue = normalized
    .filter((item) => Number.isFinite(item.time) && item.time < today)
    .sort((a, b) => a.time - b.time);
  const upcomingDated = normalized
    .filter((item) => Number.isFinite(item.time) && item.time >= today)
    .sort((a, b) => a.time - b.time);
  const undated = normalized.filter((item) => !Number.isFinite(item.time));
  // A future deadline is the strongest "upcoming" signal; an open task with no
  // date still counts so the tile can surface something beyond overdue work.
  const upcoming = [...upcomingDated, ...undated];

  const toItem = (item, overdueFlag) => ({
    label: [
      Number.isFinite(item.time) ? formatDeadline(item.time) : null,
      truncate(item.title, 10),
    ]
      .filter(Boolean)
      .join(" · "),
    overdue: overdueFlag,
  });

  // Reserve one of the two slots for an upcoming task whenever one exists.
  const maxOverdue = upcoming.length ? 1 : 2;
  const picks = overdue.slice(0, maxOverdue).map((item) => toItem(item, true));
  for (const item of upcoming) {
    if (picks.length >= 2) break;
    picks.push(toItem(item, false));
  }

  return picks;
};

/**
 * Home-tile badges for Tasks and Projects: open task count and the nearest
 * upcoming deadline. Scoped to a project when one is selected.
 */
export function useTaskProjectBadges({ projectId } = {}) {
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [overdueTaskCount, setOverdueTaskCount] = useState(0);
  const [taskDeadlines, setTaskDeadlines] = useState([]);
  const [projectStart, setProjectStart] = useState(null);
  const [projectDeadline, setProjectDeadline] = useState(null);

  const load = useCallback(async () => {
    try {
      const [tasks, projects] = await Promise.all([
        taskService.getAll().catch(() => []),
        projectService.getMyProjects().catch(() => []),
      ]);

      const scopedTasks = (Array.isArray(tasks) ? tasks : []).filter(
        // Selected project plus personal tasks (personal tasks have no
        // projectId) so the tile matches the Uppgifter section.
        (task) =>
          !projectId ||
          !task.projectId ||
          normalizeId(task.projectId) === String(projectId),
      );
      const openTasks = scopedTasks.filter(isOpenTask);
      const today = startOfToday();

      setOpenTaskCount(openTasks.length);
      setOverdueTaskCount(
        openTasks.filter((task) => {
          const due = new Date(task.dueDate).getTime();
          return Number.isFinite(due) && due < today;
        }).length,
      );
      // Pass every open task (dated or not) so an upcoming task without a due
      // date can still fill the tile's second slot alongside overdue work.
      setTaskDeadlines(buildTaskDeadlines(openTasks));

      const scopedProjects = (Array.isArray(projects) ? projects : []).filter(
        (project) => !projectId || normalizeId(project) === String(projectId),
      );
      setProjectStart(
        earliestDate(
          scopedProjects
            .map((project) => project.beginningDate)
            .filter(Boolean),
        ),
      );
      setProjectDeadline(
        nextDeadline(
          scopedProjects.map((project) => project.endDate).filter(Boolean),
        ),
      );
    } catch (error) {
      console.error("Failed to load task/project badges:", error);
      setOpenTaskCount(0);
      setOverdueTaskCount(0);
      setTaskDeadlines([]);
      setProjectStart(null);
      setProjectDeadline(null);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return {
    openTaskCount,
    overdueTaskCount,
    taskDeadlines,
    projectStart,
    projectDeadline,
  };
}

export default useTaskProjectBadges;
