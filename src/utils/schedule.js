// Pure helpers for the planning (Gantt) screen. Mirrors the admin
// SchedulePage logic: the timeline is composed client-side from tasks,
// projects and users — there is no dedicated schedule endpoint on mobile.
import { getDateLocale } from "./dateLocale";

export const DAY_MS = 24 * 60 * 60 * 1000;

// Same palette the admin uses, so bar colors match across platforms.
export const EVENT_COLORS = [
  "#0089f6",
  "#11b8cf",
  "#8c00e9",
  "#e56200",
  "#11a979",
  "#f05ba8",
  "#5568ff",
];

export const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

export const addMonths = (date, months) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

export const startOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

// Monday-based start of the week containing `date`.
export const startOfWeek = (date) => {
  const normalized = startOfDay(date);
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(normalized, diff);
};

// Whole days between two day-aligned dates.
export const daysBetween = (from, to) =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

// ISO-8601 week number.
export const getWeekNumber = (date) => {
  const target = startOfDay(date);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const weekOne = new Date(target.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((target - weekOne) / DAY_MS - 3 + ((weekOne.getDay() + 6) % 7)) / 7,
    )
  );
};

export const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const parseMonthKey = (monthKey) => {
  const [year, month] = String(monthKey).split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export const formatMonthLabel = (date) =>
  new Intl.DateTimeFormat(getDateLocale(), {
    month: "long",
    year: "numeric",
  }).format(date);

export const formatWeekdayLabel = (date) =>
  new Intl.DateTimeFormat(getDateLocale(), { weekday: "short" }).format(date);

export const normalizeId = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === "object") {
    return value._id ? String(value._id) : value.id ? String(value.id) : null;
  }
  return String(value);
};

const toDateRange = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  // End is exclusive (+1 day) so a single-day item still spans one column.
  return { start: startOfDay(start).getTime(), end: addDays(startOfDay(end), 1).getTime() };
};

export const getTaskDates = (task) => toDateRange(task?.startDate, task?.dueDate);

export const getProjectDates = (project) =>
  toDateRange(project?.beginningDate, project?.endDate);

export const getWorkerIdsForProject = (project) =>
  (project?.workers || []).map(normalizeId).filter(Boolean);

export const buildProjectMap = (projects = []) =>
  projects.reduce((acc, project) => {
    const id = normalizeId(project);
    if (id) {
      acc[id] = project;
    }
    return acc;
  }, {});

// Employees = union of project workers and company users with the worker role.
export const buildEmployeeOptions = (projects = [], users = []) => {
  const byId = new Map();

  users
    .filter((employee) => employee?.role === "worker")
    .forEach((employee) => {
      const id = normalizeId(employee);
      if (id) {
        byId.set(id, {
          id,
          name: employee.name || "—",
          subtitle: employee.profession || employee.role || "",
          avatarUrl: employee.avatarUrl || null,
        });
      }
    });

  const userMap = users.reduce((acc, employee) => {
    const id = normalizeId(employee);
    if (id) {
      acc[id] = employee;
    }
    return acc;
  }, {});

  projects.forEach((project) => {
    getWorkerIdsForProject(project).forEach((workerId) => {
      if (!byId.has(workerId)) {
        const employee = userMap[workerId];
        byId.set(workerId, {
          id: workerId,
          name: employee?.name || "—",
          subtitle: employee?.profession || employee?.role || "",
          avatarUrl: employee?.avatarUrl || null,
        });
      }
    });
  });

  return Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

export const buildProjectOptions = (projects = []) =>
  projects
    .map((project) => {
      const id = normalizeId(project);
      if (!id) {
        return null;
      }
      return {
        id,
        name: project.name || "—",
        subtitle: project.status || project.location || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

// Task bars for one employee: tasks whose project lists that employee as a
// worker. Each task becomes one row.
export const buildEmployeeItems = (tasks = [], projectMap = {}, employeeId) => {
  if (!employeeId) {
    return [];
  }

  return tasks.flatMap((task, index) => {
    const projectId = normalizeId(task.projectId);
    const project = projectMap[projectId];
    const dates = getTaskDates(task);

    if (!project || !dates) {
      return [];
    }

    if (!getWorkerIdsForProject(project).includes(String(employeeId))) {
      return [];
    }

    return [
      {
        id: `${normalizeId(task) || index}`,
        title: task.taskTitle || "—",
        subtitle: project.name || "",
        start: dates.start,
        end: dates.end,
        color: EVENT_COLORS[index % EVENT_COLORS.length],
      },
    ];
  });
};

// Task bars for one project: its tasks, each as a row.
export const buildProjectItems = (tasks = [], projectMap = {}, projectId) => {
  if (!projectId) {
    return [];
  }

  return tasks.flatMap((task, index) => {
    if (normalizeId(task.projectId) !== String(projectId)) {
      return [];
    }

    const dates = getTaskDates(task);
    if (!dates) {
      return [];
    }

    const project = projectMap[String(projectId)];

    return [
      {
        id: `${normalizeId(task) || index}`,
        title: task.taskTitle || "—",
        subtitle: project?.name || "",
        start: dates.start,
        end: dates.end,
        color: EVENT_COLORS[index % EVENT_COLORS.length],
      },
    ];
  });
};
