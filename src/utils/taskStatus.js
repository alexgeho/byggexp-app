// Display status for a task badge: completed wins, then past-due -> overdue,
// otherwise open. `tone` drives the badge colour and the i18n key
// (task.status.<tone>); `label` is the English fallback for that key.
// Shared by the tasks list, the project tasks tab and the task detail screen.
export const getTaskDisplayStatus = (task) => {
  if (task?.status === "completed") {
    return { label: "Completed", tone: "completed" };
  }

  const dueTime = task?.dueDate ? new Date(task.dueDate).getTime() : null;

  if (dueTime && !Number.isNaN(dueTime) && dueTime < Date.now()) {
    return { label: "Overdue", tone: "overdue" };
  }

  return { label: "Open", tone: "open" };
};

// Who a task is for, as one short label: the single assignee, or else the
// first of the chosen recipients ("Adam", "Adam +1"). A task sent through the
// recipient picker has no assigneeUserName, so reading only that field showed
// nobody. Returns "" for a whole-team task.
export function taskAssigneeLabel(task) {
  if (task?.assigneeUserName) return task.assigneeUserName;
  let settings = task?.notificationSettings;
  if (typeof settings === "string") {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = null;
    }
  }
  const group = Array.isArray(settings?.assignees) ? settings.assignees : [];
  const named = group.filter((person) => person?.name);
  if (!named.length) return "";
  return named.length > 1
    ? `${named[0].name} +${named.length - 1}`
    : named[0].name;
}
