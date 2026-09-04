import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";

import {
  projectService,
  shiftService,
  userService,
  taskService,
  toolService,
} from "../services";
import { companyService } from "../services/company.service";
import { offerService } from "../services/offer.service";
import { invoiceService } from "../services/invoice.service";
import {
  getOnboardingDismissed,
  getOnboardingCustomizeOpened,
  getOnboardingProfileSaved,
} from "../utils/onboardingStorage";

const asArray = (value) => (Array.isArray(value) ? value : []);
const countOf = (v) => asArray(v).length;

const permGranted = async (getter) => {
  try {
    const res = await getter();
    return Boolean(res?.granted);
  } catch {
    return false;
  }
};

// Role-aware "Kom igång" home checklist progress.
// - Workers: pick a project -> report time -> fill in profile -> customise.
// - Admins:  a two-direction focus (mirrors the web) — "fieldwork" (project,
//   team, task, tools) or "billing" (company details, offer/invoice). Until the
//   focus question is answered, all steps are shown.
// Every step's done-state comes from real signals; a failed check just leaves
// the step un-done.
export function useOnboardingProgress({
  role,
  userId,
  selectedProjectId,
  focus,
}) {
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
    hasTask: false,
    hasTools: false,
    hasCompanyDetails: false,
    hasBilling: false,
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
            setState((prev) => ({
              ...prev,
              loading: false,
              dismissed: false,
              hasLocation: location,
              hasProject: Boolean(selectedProjectId),
              hasShift: countOf(shifts) > 0,
              hasProfile: Boolean(
                profileSaved || profile?.profession || profile?.phoneNumber,
              ),
              hasCustomized: customized,
            }));
            return;
          }

          // Admin — all signals for the two-direction checklist.
          const [projects, team, tasks, tools, company, offers, invoices] =
            await Promise.all([
              projectService.getMyProjects().catch(() => []),
              userService.getMyCompanyUsers().catch(() => []),
              taskService.getAll().catch(() => []),
              toolService.getAll().catch(() => []),
              companyService.getMyCompany().catch(() => null),
              offerService.getAll().catch(() => []),
              invoiceService.getAll().catch(() => []),
            ]);
          if (!active) return;
          setState((prev) => ({
            ...prev,
            loading: false,
            dismissed: false,
            hasProject: countOf(projects) > 0,
            hasTeam: countOf(team) > 1,
            hasTask: countOf(tasks) > 0,
            hasTools: countOf(tools) > 0,
            hasCompanyDetails: Boolean(company?.orgNumber),
            hasBilling: countOf(offers) + countOf(invoices) > 0,
          }));
        }

        fetchAll();

        return () => {
          active = false;
        };
      },
      [enabled, isWorker, userId, selectedProjectId],
    ),
  );

  // Worker: single fixed 4-step flow.
  if (isWorker) {
    const steps = [
      { key: "selectProject", done: state.hasProject, action: "selectProject" },
      {
        key: "timeReport",
        done: state.hasShift,
        action: "time",
        mode: state.hasLocation ? "auto" : "manual",
      },
      { key: "profile", done: state.hasProfile, screen: "MyAccount" },
      { key: "customize", done: state.hasCustomized, action: "customize" },
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
      needsFocus: false,
      visible: enabled && !state.loading && !state.dismissed && !allDone,
    };
  }

  // Admin: two-direction focus (fieldwork / billing).
  const fieldwork = [
    { key: "project", done: state.hasProject, screen: "CreateProject" },
    { key: "team", done: state.hasTeam, screen: "CreateEmployee" },
    { key: "task", done: state.hasTask, screen: "CreateTask" },
    { key: "tools", done: state.hasTools, screen: "Tools" },
  ];
  const billing = [
    {
      key: "companyDetails",
      done: state.hasCompanyDetails,
      screen: "CompanyDetails",
    },
    { key: "billing", done: state.hasBilling, screen: "Economy" },
  ];

  let steps;
  let needsFocus = false;
  if (focus === "fieldwork") steps = fieldwork;
  else if (focus === "billing") steps = billing;
  else {
    steps = [...fieldwork, ...billing];
    needsFocus = focus == null; // null = question not answered ("skip" shows all)
  }

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  return {
    loading: state.loading,
    dismissed: state.dismissed,
    steps,
    completed,
    total: steps.length,
    allDone,
    needsFocus,
    visible: enabled && !state.loading && !state.dismissed && !allDone,
  };
}
