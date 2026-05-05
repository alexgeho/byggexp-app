const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const WEEK_IN_MS = 7 * DAY_IN_MS;

export const REPEAT_OPTIONS = [
  { key: 'none', label: 'Does not repeat' },
  { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
];

export const createDefaultTaskNotificationSettings = () => ({
  assignees: [],
  allMembersNotification: false,
  autoReminder: false,
  customReminder: false,
  customMessage: '',
  repeat: 'none',
});

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeTaskNotificationSettings = (value) => {
  const defaults = createDefaultTaskNotificationSettings();
  const assignees = Array.isArray(value?.assignees)
    ? value.assignees
        .filter((item) => item?.id)
        .map((item) => ({
          id: item.id,
          name: item.name || 'Unnamed worker',
          profession: item.profession || '',
        }))
    : [];

  return {
    ...defaults,
    ...value,
    assignees,
    allMembersNotification: Boolean(value?.allMembersNotification),
    autoReminder: Boolean(value?.autoReminder),
    customReminder: Boolean(value?.customReminder),
    customMessage: value?.customMessage || '',
    repeat: value?.repeat || 'none',
  };
};

const hasReminderEnabled = (settings) => Boolean(settings?.autoReminder || settings?.customReminder);

const getReminderWindowMs = ({ startDate, dueDate }) => {
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedDueDate = normalizeDate(dueDate);

  if (!normalizedDueDate) {
    return null;
  }

  const fromDate = normalizedStartDate || new Date();
  return normalizedDueDate.getTime() - fromDate.getTime();
};

export const getRepeatOptionState = ({ repeatKey, startDate, dueDate, settings }) => {
  if (repeatKey === 'none') {
    return { disabled: false, helperText: 'Notifications will be sent only once.' };
  }

  if (!hasReminderEnabled(settings)) {
    return {
      disabled: true,
      helperText: 'Turn on Auto Reminder or Custom Reminder first.',
    };
  }

  const windowMs = getReminderWindowMs({ startDate, dueDate });
  if (windowMs === null) {
    return {
      disabled: true,
      helperText: 'Add a due date to enable repeating notifications.',
    };
  }

  if (repeatKey === 'hourly') {
    if (windowMs < HOUR_IN_MS) {
      return {
        disabled: true,
        helperText: 'Hourly repeat needs at least 1 hour until due date.',
      };
    }

    if (windowMs > DAY_IN_MS) {
      return {
        disabled: true,
        helperText: 'Hourly repeat is limited to tasks due within 24 hours.',
      };
    }

    return {
      disabled: false,
      helperText: 'Sends at most 8 reminders, once per hour, and stops at the due date.',
    };
  }

  if (repeatKey === 'daily') {
    if (windowMs < DAY_IN_MS) {
      return {
        disabled: true,
        helperText: 'Daily repeat needs at least 1 day until due date.',
      };
    }

    if (windowMs > 30 * DAY_IN_MS) {
      return {
        disabled: true,
        helperText: 'Daily repeat is limited to tasks due within 30 days.',
      };
    }

    return {
      disabled: false,
      helperText: 'Sends at most 14 reminders, once per day, and stops at the due date.',
    };
  }

  if (repeatKey === 'weekly') {
    if (windowMs < WEEK_IN_MS) {
      return {
        disabled: true,
        helperText: 'Weekly repeat needs at least 7 days until due date.',
      };
    }

    return {
      disabled: false,
      helperText: 'Sends at most 8 reminders, once per week, and stops at the due date.',
    };
  }

  return { disabled: false, helperText: '' };
};

export const getRepeatLabel = (repeatKey) => (
  REPEAT_OPTIONS.find((option) => option.key === repeatKey)?.label || 'Does not repeat'
);

export const getTaskNotificationSummary = (settings) => {
  const normalizedSettings = normalizeTaskNotificationSettings(settings);
  const summaryParts = [];

  if (normalizedSettings.assignees.length > 0) {
    summaryParts.push(
      normalizedSettings.assignees.length === 1
        ? normalizedSettings.assignees[0].name
        : `${normalizedSettings.assignees.length} workers`,
    );
  }

  if (normalizedSettings.allMembersNotification) {
    summaryParts.push('All members');
  }

  if (normalizedSettings.autoReminder) {
    summaryParts.push('Auto');
  }

  if (normalizedSettings.customReminder) {
    summaryParts.push('Custom');
  }

  if (normalizedSettings.repeat && normalizedSettings.repeat !== 'none') {
    summaryParts.push(getRepeatLabel(normalizedSettings.repeat));
  }

  return summaryParts.length > 0 ? summaryParts.join(' • ') : 'Set notifications';
};

export const buildTaskNotificationsPayload = ({ settings, startDate, dueDate }) => {
  const normalizedSettings = normalizeTaskNotificationSettings(settings);

  if (
    normalizedSettings.assignees.length === 0
    && !normalizedSettings.allMembersNotification
    && !normalizedSettings.autoReminder
    && !normalizedSettings.customReminder
    && !normalizedSettings.customMessage.trim()
    && normalizedSettings.repeat === 'none'
  ) {
    return [];
  }

  const lines = [];

  if (normalizedSettings.assignees.length > 0) {
    lines.push(`Assign to: ${normalizedSettings.assignees.map((worker) => worker.name).join(', ')}`);
  }

  lines.push(`All Members Notification: ${normalizedSettings.allMembersNotification ? 'On' : 'Off'}`);

  lines.push(`Auto Reminder: ${normalizedSettings.autoReminder ? 'On' : 'Off'}`);
  lines.push(`Custom Reminder: ${normalizedSettings.customReminder ? 'On' : 'Off'}`);

  if (normalizedSettings.customMessage.trim()) {
    lines.push(`Message: ${normalizedSettings.customMessage.trim()}`);
  }

  const repeatState = getRepeatOptionState({
    repeatKey: normalizedSettings.repeat,
    startDate,
    dueDate,
    settings: normalizedSettings,
  });

  if (normalizedSettings.repeat && normalizedSettings.repeat !== 'none' && !repeatState.disabled) {
    lines.push(`Repeat: ${getRepeatLabel(normalizedSettings.repeat)}`);
    if (repeatState.helperText) {
      lines.push(`Repeat limit: ${repeatState.helperText}`);
    }
  } else {
    lines.push('Repeat: Does not repeat');
  }

  return lines;
};
