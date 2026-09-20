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
import { clientService } from "../services/client.service";
import { articleService } from "../services/article.service";
import {
  getOnboardingDismissed,
  getOnboardingCustomizeOpened,
  getOnboardingProfileSaved,
} from "../utils/onboardingStorage";

const asArray = (value) => (Array.isArray(value) ? value : []);
const countOf = (v) => asArray(v).length;

const sameId = (a, b) => Boolean(a) && Boolean(b) && String(a) === String(b);

// A checklist step is about what THIS user did, not about what the company
// already has: a tool a colleague registered, or a client the office added
// before, must not tick the step for someone who never did it themselves.
const madeByMe = (items, userId) =>
  asArray(items).some((item) => sameId(item?.createdByUserId, userId));

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
// Every step's done-state comes from real signals, and those signals are
// PER-USER: a step is done only if this user did it. Things the company already
// owns (a colleague's tool, an older client) never tick someone else's step.
// A failed check just leaves the step un-done.
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
    hasClient: false,
    hasArticle: false,
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
          const [
            projects,
            team,
            tasks,
            tools,
            company,
            offers,
            invoices,
            clients,
            articles,
            customized,
          ] = await Promise.all([
            projectService.getMyProjects().catch(() => []),
            userService.getMyCompanyUsers().catch(() => []),
            taskService.getAll().catch(() => []),
            toolService.getAll().catch(() => []),
            companyService.getMyCompany().catch(() => null),
            offerService.getAll().catch(() => []),
            invoiceService.getAll().catch(() => []),
            clientService.getAll().catch(() => []),
            articleService.getAll().catch(() => []),
            getOnboardingCustomizeOpened(),
          ]);
          if (!active) return;
          setState((prev) => ({
            ...prev,
            loading: false,
            dismissed: false,
            // Created by me: I own it or I lead it (projects carry no
            // createdBy — owner/manager is the closest "this is mine").
            hasProject: asArray(projects).some(
              (project) =>
                sameId(project?.ownerId, userId) ||
                sameId(project?.projectManagerId, userId),
            ),
            // "Invite your team" is done as soon as there's at least one company
            // user besides the admin — an invited/pending employee counts (the
            // backend list includes them), no need for every field to be filled.
            hasTeam: asArray(team).some(
              (u) =>
                String(u?._id || u?.id || "") !== String(userId || "") &&
                sameId(u?.createdBy, userId),
            ),
            hasTask: madeByMe(tasks, userId),
            hasTools: madeByMe(tools, userId),
            // Only for whoever actually saved the details form — company data a
            // colleague entered is not this user's step.
            hasCompanyDetails:
              Boolean(company?.orgNumber) &&
              sameId(company?.detailsUpdatedByUserId, userId),
            hasClient: madeByMe(clients, userId),
            hasArticle: madeByMe(articles, userId),
            hasBilling: madeByMe(offers, userId) || madeByMe(invoices, userId),
            hasCustomized: customized,
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

  // "Anpassa startsidan" (customize the home screen) — a personal step relevant
  // to any admin regardless of focus, so it's appended to BOTH lists (shows in
  // whichever focus they pick). Same step the worker gets.
  const customizeStep = {
    key: "customize",
    done: state.hasCustomized,
    action: "customize",
  };

  // Admin: two-direction focus (fieldwork / billing).
  const fieldwork = [
    { key: "project", done: state.hasProject, screen: "CreateProject" },
    { key: "team", done: state.hasTeam, screen: "CreateEmployee" },
    { key: "task", done: state.hasTask, screen: "CreateTask" },
    { key: "tools", done: state.hasTools, screen: "Tools" },
    customizeStep,
  ];
  const billing = [
    {
      key: "companyDetails",
      done: state.hasCompanyDetails,
      screen: "CompanyDetails",
    },
    { key: "client", done: state.hasClient, screen: "Clients" },
    { key: "article", done: state.hasArticle, screen: "Articles" },
    { key: "billing", done: state.hasBilling, screen: "Economy" },
    customizeStep,
  ];

  let steps;
  let needsFocus = false;
  if (focus === "fieldwork") steps = fieldwork;
  else if (focus === "billing") steps = billing;
  else {
    // No valid focus yet (null) — or a legacy "skip" value persisted by the old
    // build. ALWAYS show the routing question here; never dump all 8 steps at
    // once (that broke the focus hierarchy — one clear choice, not a wall). The
    // "Hoppa över" button now dismisses the card instead of expanding to all.
    // Both lists carry the shared customize step — keep it once in the combined
    // (routing) state so the count isn't double-inflated.
    steps = [...fieldwork, ...billing.filter((s) => s.key !== "customize")];
    needsFocus = true;
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
