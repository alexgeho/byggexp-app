import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";

import { projectService, shiftService, userService } from "../services";
import {
  getOnboardingDismissed,
  getOnboardingCustomizeOpened,
  getOnboardingProfileSaved,
} from "../utils/onboardingStorage";

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
// - Workers: pick a project -> report time (auto/manual) -> fill in profile ->
//   customise the home screen.
// - Admins:  create project -> invite team -> start a shift.
// Every step's done-state comes from real signals (permissions / API data /
// local flags), so it ticks automatically. Fully defensive — a failed check
// just leaves the step un-done.
export function useOnboardingProgress({ role, userId, selectedProjectId }) {
  const isWorker = role === "worker";
  const enabled = Boolean(role);

  const [state, setState] = useState({
    loading: true,
    dismissed: false,
    hasLocation: false,
    hasProject: false,
    hasTeam: false,
    hasShift: false,
    hasProfile: false,
    hasCustomized: false,
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
            // Location permission decides how the time step routes its "GPS"
            // option (granted → auto clock-in; denied → location settings).
            // hasShift covers a real shift and manual hours (both write history).
            const [location, shifts, profile, customized, profileSaved] =
              await Promise.all([
                permGranted(Location.getForegroundPermissionsAsync),
                shiftsP,
                userId
                  ? userService.getInfo(userId).catch(() => null)
                  : Promise.resolve(null),
                getOnboardingCustomizeOpened(),
                getOnboardingProfileSaved(),
              ]);
            if (!active) return;
            setState({
              loading: false,
              dismissed: false,
              hasLocation: location,
              // "Choose a project" is done only when one is actually SELECTED —
              // the app blocks logging time until then. Company having projects
              // isn't enough (the worker must pick the one they're on).
              hasProject: Boolean(selectedProjectId),
              hasTeam: false,
              hasShift: asArray(shifts).length > 0,
              // "Profile filled in" = they saved the account (touched it) or have
              // a professional role / phone on file.
              hasProfile: Boolean(
                profileSaved || profile?.profession || profile?.phoneNumber,
              ),
              hasCustomized: customized,
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
            hasProject: asArray(projects).length > 0,
            // "Invite team" is done once the company has more than just the
            // admin themselves.
            hasTeam: asArray(team).length > 1,
            hasShift: asArray(shifts).length > 0,
            hasProfile: false,
            hasCustomized: false,
          });
        }

        fetchAll();

        return () => {
          active = false;
        };
      },
      [enabled, isWorker, userId, selectedProjectId],
    ),
  );

  const steps = isWorker
    ? [
        // Pick a project → report time (opens a chooser: GPS / manual) →
        // fill in profile (optional) → customise the home screen (optional).
        {
          key: "selectProject",
          done: state.hasProject,
          action: "selectProject",
        },
        {
          key: "timeReport",
          done: state.hasShift,
          action: "time",
          mode: state.hasLocation ? "auto" : "manual",
        },
        { key: "profile", done: state.hasProfile, screen: "MyAccount" },
        { key: "customize", done: state.hasCustomized, action: "customize" },
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
