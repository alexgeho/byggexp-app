import { useCallback, useEffect, useState } from "react";
import { projectService, shiftService, userService } from "../services";
import {
  formatDurationShort,
  getCurrentMonthKey,
  parseDateKey,
} from "../utils/shifts";

const EMPTY_EMPLOYEE_STATS = { live: 0, notAtWork: 0 };
const EMPTY_SHIFT_STATS = {
  weekLabel: "0h this week",
  monthLabel: "0h this month",
};

function getWeekStartDate(referenceDate = new Date()) {
  const date = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + mondayOffset);
  date.setHours(0, 0, 0, 0);

  return date;
}

function isDateInCurrentWeek(dateKey, referenceDate = new Date()) {
  if (!dateKey) {
    return false;
  }

  const date = parseDateKey(dateKey);
  const weekStart = getWeekStartDate(referenceDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return date >= weekStart && date <= weekEnd;
}

function normalizeProjectId(projectId) {
  if (!projectId) {
    return "";
  }

  return String(projectId);
}

function getUserId(user) {
  return String(user?._id || user?.id || "");
}

function mergeProjectWorkers(employeesFromApi = [], populatedWorkers = []) {
  const byId = new Map();

  employeesFromApi.forEach(function addEmployee(employee) {
    const id = getUserId(employee);

    if (id) {
      byId.set(id, employee);
    }
  });

  populatedWorkers.forEach(function addPopulatedWorker(worker) {
    const normalizedWorker =
      typeof worker === "string" ? { _id: worker, role: "worker" } : worker;
    const id = getUserId(normalizedWorker);

    if (!id || normalizedWorker?.role !== "worker") {
      return;
    }

    const existing = byId.get(id);
    byId.set(
      id,
      existing ? { ...normalizedWorker, ...existing } : normalizedWorker,
    );
  });

  return [...byId.values()].filter(function isWorker(user) {
    return user?.role === "worker";
  });
}

function countEmployeeStats(projectWorkers = [], projectId) {
  const normalizedProjectId = normalizeProjectId(projectId);

  return projectWorkers.reduce(
    function countStats(totals, employee) {
      const isLive =
        employee?.workStatus === "working" &&
        normalizeProjectId(employee?.workStatusProjectId) ===
          normalizedProjectId;

      if (isLive) {
        totals.live += 1;
      } else {
        totals.notAtWork += 1;
      }

      return totals;
    },
    { ...EMPTY_EMPLOYEE_STATS },
  );
}

function sumWeekDuration(days = [], referenceDate = new Date()) {
  return days.reduce(function sumDuration(total, day) {
    if (!isDateInCurrentWeek(day?.date, referenceDate)) {
      return total;
    }

    return total + (day?.totalDurationMs || 0);
  }, 0);
}

export function useHomeButtonStats({
  projectId,
  loadEmployeeStats = true,
  loadShiftStats = true,
} = {}) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const [employeeStats, setEmployeeStats] = useState(EMPTY_EMPLOYEE_STATS);
  const [shiftStats, setShiftStats] = useState(EMPTY_SHIFT_STATS);

  const loadStats = useCallback(
    async function loadStats() {
      if (!normalizedProjectId) {
        setEmployeeStats(EMPTY_EMPLOYEE_STATS);
        setShiftStats(EMPTY_SHIFT_STATS);
        return;
      }

      const today = new Date();

      try {
        if (loadEmployeeStats) {
          const [employees, project] = await Promise.all([
            userService
              .getByProject(normalizedProjectId)
              .catch(function onEmployeesError() {
                return [];
              }),
            projectService
              .getPopulatedById(normalizedProjectId)
              .catch(function onProjectError() {
                return null;
              }),
          ]);

          const projectWorkers = mergeProjectWorkers(
            Array.isArray(employees) ? employees : [],
            project?.workers || [],
          );

          setEmployeeStats(
            countEmployeeStats(projectWorkers, normalizedProjectId),
          );
        }

        if (loadShiftStats) {
          const shiftHistory = await shiftService
            .getHistory({
              month: getCurrentMonthKey(),
              projectId: normalizedProjectId,
            })
            .catch(function onShiftHistoryError() {
              return { days: [], monthTotalDurationMs: 0 };
            });

          const days = Array.isArray(shiftHistory?.days)
            ? shiftHistory.days
            : [];
          const weekDurationMs = sumWeekDuration(days, today);
          const monthDurationMs = shiftHistory?.monthTotalDurationMs || 0;

          setShiftStats({
            weekLabel: `${formatDurationShort(weekDurationMs)} this week`,
            monthLabel: `${formatDurationShort(monthDurationMs)} this month`,
          });
        }
      } catch (error) {
        console.error("Failed to load home button stats:", error);
      }
    },
    [loadEmployeeStats, loadShiftStats, normalizedProjectId],
  );

  useEffect(
    function loadOnProjectChange() {
      void loadStats();
    },
    [loadStats],
  );

  return {
    employeeStats,
    shiftStats,
    refreshStats: loadStats,
  };
}
