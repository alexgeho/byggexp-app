import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";

import { projectService, shiftService, userService } from "../services";
import { getOnboardingDismissed } from "../utils/onboardingStorage";

const asArray = (value) => (Array.isArray(value) ? value : []);

const permGranted = async (getter) => {
  try {
    const res = await getter();
    return Boolean(res?.granted);
  } catch {
    return false;
  }
};

// Role-aware "Kom igång" home checklist progress.
// - Workers: allow location -> start first shift -> turn on notifications.
// - Admins:  create project -> invite team -> start a shift.
// Every step's done-state comes from real signals (permissions / API data), so
// it ticks automatically. Fully defensive — a failed check just leaves the step
// un-done.
export function useOnboardingProgress({ role }) {
  const isWorker = role === "worker";
  const enabled = Boolean(role);

  const [state, setState] = useState({
    loading: true,
    dismissed: false,
    // worker signals
    hasLocation: false,
    hasNotifications: false,
    // admin signals
    hasProject: false,
    hasTeam: false,
    // shared
    hasShift: false,
  });

  useFocusEffect(
    useCallback(
      function loadProgress() {
        let active = true;

        if (!enabled) {
          setState((prev) => ({ ...prev, loading: false }));
          return () => {
            active = false;
          };
        }

        async function fetchAll() {
          const dismissed = await getOnboardingDismissed();
          if (dismissed) {
            if (active) {
              setState((prev) => ({
                ...prev,
                loading: false,
                dismissed: true,
              }));
            }
            return;
          }

          const shiftsP = shiftService.getHistory().catch(() => []);

          if (isWorker) {
            // Location permission decides how the worker logs time: granted →
            // auto clock-in via geofence (press Play); denied → they enter hours
            // manually. hasShift covers both a real shift and manual hours
            // (addManualHours writes a history entry).
            const [location, shifts] = await Promise.all([
              permGranted(Location.getForegroundPermissionsAsync),
              shiftsP,
            ]);
            if (!active) return;
            setState({
              loading: false,
              dismissed: false,
              hasLocation: location,
              hasNotifications: false,
              hasProject: false,
              hasTeam: false,
              hasShift: asArray(shifts).length > 0,
            });
            return;
          }

          const [projects, team, shifts] = await Promise.all([
            projectService.getMyProjects().catch(() => []),
            userService.getMyCompanyUsers().catch(() => []),
            shiftsP,
          ]);
          if (!active) return;
          setState({
            loading: false,
            dismissed: false,
            hasLocation: false,
            hasNotifications: false,
            hasProject: asArray(projects).length > 0,
            // "Invite team" is done once the company has more than just the
            // admin themselves.
            hasTeam: asArray(team).length > 1,
            hasShift: asArray(shifts).length > 0,
          });
        }

        fetchAll();

        return () => {
          active = false;
        };
      },
      [enabled, isWorker],
    ),
  );

  const steps = isWorker
    ? [
        // A single, adaptive "log your first time" step — the one action that
        // matters for a worker. Mode drives copy + tap target (see
        // HomeOnboarding): auto = press Play; manual = open the hours wheel.
        {
          key: "time",
          done: state.hasShift,
          action: "time",
          mode: state.hasLocation ? "auto" : "manual",
        },
      ]
    : [
        { key: "project", done: state.hasProject, screen: "CreateProject" },
        { key: "team", done: state.hasTeam, screen: "CreateEmployee" },
        { key: "shift", done: state.hasShift, screen: "Shifts" },
      ];

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  return {
    loading: state.loading,
    dismissed: state.dismissed,
    steps,
    completed,
    total: steps.length,
    allDone,
    visible: enabled && !state.loading && !state.dismissed && !allDone,
  };
}
