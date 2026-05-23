export const DEFAULT_NOTIFICATION_PREFERENCES = {
  flowMode: true,
  messages: true,
  tasks: true,
  productAndMarketingAlerts: true,
};

export const NOTIFICATION_PREFERENCE_ITEMS = [
  {
    key: "flowMode",
    label: "Flow Mode",
    description: "System and workflow alerts that help you stay on track.",
  },
  {
    key: "messages",
    label: "Messages",
    description: "Push notifications when a new chat message arrives.",
  },
  {
    key: "tasks",
    label: "Tasks",
    description: "Task assignments, updates, and reminder notifications.",
  },
  {
    key: "productAndMarketingAlerts",
    label: "Product and Marketing Alerts",
    description: "News about app updates, releases, and product announcements.",
  },
];

export const normalizeNotificationPreferences = (value) => ({
  flowMode:
    typeof value?.flowMode === "boolean"
      ? value.flowMode
      : DEFAULT_NOTIFICATION_PREFERENCES.flowMode,
  messages:
    typeof value?.messages === "boolean"
      ? value.messages
      : DEFAULT_NOTIFICATION_PREFERENCES.messages,
  tasks:
    typeof value?.tasks === "boolean"
      ? value.tasks
      : DEFAULT_NOTIFICATION_PREFERENCES.tasks,
  productAndMarketingAlerts:
    typeof value?.productAndMarketingAlerts === "boolean"
      ? value.productAndMarketingAlerts
      : DEFAULT_NOTIFICATION_PREFERENCES.productAndMarketingAlerts,
});
