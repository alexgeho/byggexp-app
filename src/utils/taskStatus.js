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
