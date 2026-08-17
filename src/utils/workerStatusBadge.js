import { shouldShowAccountStatus } from "./userRoles";
import { content } from "../theme/tokens";

const normalizeRefId = (value) =>
  String(value?._id || value?.id || value || "");

// A worker counts as "at work" when their live status is working on this
// project (or on any project when no projectId is given).
export const isWorkerAtWork = (worker, projectId) =>
  worker?.workStatus === "working" &&
  (!projectId ||
    normalizeRefId(worker?.workStatusProjectId) === String(projectId));

// Presence/status → { label, backgroundColor, color } for the shared Badge.
// Colours come from the Figma design (solid text/dot + tinted background).
// `c` is the active theme's semantic tokens (theme.content); defaults to the
// light set so existing callers keep working until they pass the theme.
export const statusBadgeFor = (statusKind, t, c = content) => {
  switch (statusKind) {
    case "waiting":
      return {
        label: t("employees.waitingApproval"),
        backgroundColor: c.statusWaitingSoft,
        color: c.statusWaiting,
      };
    case "at_work":
      return {
        label: `• ${t("employees.atWork")}`,
        backgroundColor: c.statusAtWorkSoft,
        color: c.statusAtWork,
      };
    case "off_duty":
      return {
        label: `• ${t("employees.offDuty")}`,
        backgroundColor: c.statusOffDutySoft,
        color: c.statusOffDuty,
      };
    default: // not_at_work
      return {
        label: `• ${t("employees.notAtWork")}`,
        backgroundColor: c.statusNotAtWorkSoft,
        color: c.statusNotAtWork,
      };
  }
};

// Convenience for the worker pickers: derive the status kind from a user, then
// map to a badge. (Full presence — waiting / at-work / not-at-work.)
export const getWorkerStatusBadge = (worker, projectId, t, c = content) => {
  if (shouldShowAccountStatus(worker?.accountStatus)) {
    return statusBadgeFor("waiting", t, c);
  }
  return statusBadgeFor(
    isWorkerAtWork(worker, projectId) ? "at_work" : "not_at_work",
    t,
    c,
  );
};
