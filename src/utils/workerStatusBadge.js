import { shouldShowAccountStatus } from "./userRoles";
import { cardStyles } from "../styles/cards";

const normalizeRefId = (value) =>
  String(value?._id || value?.id || value || "");

// A worker counts as "at work" when their live status is working on this
// project (or on any project when no projectId is given).
export const isWorkerAtWork = (worker, projectId) =>
  worker?.workStatus === "working" &&
  (!projectId ||
    normalizeRefId(worker?.workStatusProjectId) === String(projectId));

// Status badge for the shared PersonListItem: waiting-approval / at-work /
// not-at-work, using the same colours as the chat list and Workers tab.
export const getWorkerStatusBadge = (worker, projectId, t) => {
  if (shouldShowAccountStatus(worker?.accountStatus)) {
    return {
      label: t("employees.waitingApproval"),
      backgroundColor: cardStyles.cardBadgeWarning.backgroundColor,
      color: cardStyles.cardBadgeWarning.color,
    };
  }
  if (isWorkerAtWork(worker, projectId)) {
    return {
      label: t("employees.atWork"),
      backgroundColor: cardStyles.cardBadgeAtWork.backgroundColor,
      color: cardStyles.cardBadgeAtWork.color,
    };
  }
  return {
    label: t("employees.notAtWork"),
    backgroundColor: cardStyles.cardBadgeAbsent.backgroundColor,
    color: cardStyles.cardBadgeAbsent.color,
  };
};
