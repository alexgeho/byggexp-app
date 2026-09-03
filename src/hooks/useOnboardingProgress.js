import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { projectService, shiftService, userService } from "../services";
import { getOnboardingDismissed } from "../utils/onboardingStorage";

const asArray = (value) => (Array.isArray(value) ? value : []);

// Progress for the "Kom igång" home checklist. Derives each step's done-state
// from real data (has a project / has invited someone / has run a shift). Fully
// defensive: any failed call just leaves that step un-done rather than throwing.
export function useOnboardingProgress({ enabled }) {
  const [state, setState] = useState({
    loading: true,
    dismissed: false,
    hasProject: false,
    hasTeam: false,
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
              setState({
                loading: false,
                dismissed: true,
                hasProject: false,
                hasTeam: false,
                hasShift: false,
              });
            }
            return;
          }

          const [projects, team, shifts] = await Promise.all([
            projectService.getMyProjects().catch(() => []),
            userService.getMyCompanyUsers().catch(() => []),
            shiftService.getHistory().catch(() => []),
          ]);

          if (!active) {
            return;
          }

          setState({
            loading: false,
            dismissed: false,
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
      [enabled],
    ),
  );

  const steps = [
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
    // Show only when enabled, loaded, not dismissed, and not everything done.
    visible: enabled && !state.loading && !state.dismissed && !allDone,
  };
}
