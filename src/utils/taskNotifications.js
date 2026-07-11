import {
  defaultRepeatIntervalMinutes,
  maxHourlyRepeatRuns,
  maxMinuteRepeatRuns,
  maxRepeatIntervalMinutes,
  minRepeatIntervalMinutes,
} from '../theme/settings';

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const WEEK_IN_MS = 7 * DAY_IN_MS;

export const REPEAT_OPTIONS = [
  { key: 'none', label: 'Once' },
  { key: 'minutes', label: 'Every N minutes' },
  { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
];

export const createDefaultTaskNotificationSettings = () => ({
  assignees: [],
  allMembersNotification: true,
  autoReminder: true,
  customReminder: false,
  customMessage: '',
  repeat: 'none',
  repeatIntervalMinutes: defaultRepeatIntervalMinutes,
});

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeRepeatIntervalMinutes = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return defaultRepeatIntervalMinutes;
  }

  return Math.min(
    maxRepeatIntervalMinutes,
    Math.max(minRepeatIntervalMinutes, Math.round(parsed)),
  );
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

  const repeat = REPEAT_OPTIONS.some((option) => option.key === value?.repeat)
    ? value.repeat
    : defaults.repeat;

  return {
    ...defaults,
    ...value,
    assignees,
    allMembersNotification: Boolean(
      value?.allMembersNotification ?? defaults.allMembersNotification,
    ),
    autoReminder: Boolean(value?.autoReminder ?? defaults.autoReminder),
    customReminder: Boolean(value?.customReminder ?? defaults.customReminder),
    customMessage: value?.customMessage || '',
    repeat,
    repeatIntervalMinutes: normalizeRepeatIntervalMinutes(
      value?.repeatIntervalMinutes ?? defaults.repeatIntervalMinutes,
    ),
  };
};

export const deriveNotificationReminderFlags = (settings) => {
  const normalizedSettings = normalizeTaskNotificationSettings(settings);
  const hasCustomMessage = Boolean(normalizedSettings.customMessage.trim());

  return {
    ...normalizedSettings,
    allMembersNotification: true,
    assignees: [],
    autoReminder: !hasCustomMessage,
    customReminder: hasCustomMessage,
  };
};

const hasReminderEnabled = (settings) => (
  Boolean(settings?.autoReminder || settings?.customReminder)
);

/** Time from now until due date (ignores start date — counting begins when saved). */
const getReminderWindowMs = ({ dueDate }) => {
  const normalizedDueDate = normalizeDate(dueDate);

  if (!normalizedDueDate) {
    return null;
  }

  return normalizedDueDate.getTime() - Date.now();
};

export const getRepeatOptionState = ({ repeatKey, dueDate, settings }) => {
  if (repeatKey === 'none') {
    return { disabled: false, helperText: '' };
  }

  const windowMs = getReminderWindowMs({ dueDate });
  if (windowMs === null) {
    return {
      disabled: false,
      helperText: 'Add a due date to schedule repeating notifications.',
    };
  }

  if (windowMs <= 0) {
    return {
      disabled: false,
      helperText: 'Due date must be in the future for repeating notifications.',
    };
  }

  const intervalMinutes = normalizeRepeatIntervalMinutes(
    settings?.repeatIntervalMinutes,
  );
  const intervalMs = intervalMinutes * MINUTE_IN_MS;

  if (repeatKey === 'minutes') {
    if (windowMs < intervalMs) {
      return {
        disabled: false,
        helperText: `Needs at least ${intervalMinutes} minutes until the due date.`,
      };
    }

    const maxRuns = Math.min(
      maxMinuteRepeatRuns,
      Math.floor(windowMs / intervalMs),
    );

    return {
      disabled: false,
      helperText: `Sends up to ${maxRuns} reminders every ${intervalMinutes} minutes from save time until the due date.`,
    };
  }

  if (repeatKey === 'hourly') {
    if (windowMs < HOUR_IN_MS) {
      return {
        disabled: false,
        helperText: 'Hourly repeat needs at least 1 hour until the due date.',
      };
    }

    const maxRuns = Math.min(
      maxHourlyRepeatRuns,
      Math.floor(windowMs / HOUR_IN_MS),
    );

    return {
      disabled: false,
      helperText: `Sends up to ${maxRuns} reminders every hour from save time until the due date.`,
    };
  }

  if (repeatKey === 'daily') {
    if (windowMs < DAY_IN_MS) {
      return {
        disabled: false,
        helperText: 'Daily repeat needs at least 1 day until the due date.',
      };
    }

    if (windowMs > 30 * DAY_IN_MS) {
      return {
        disabled: false,
        helperText: 'Daily repeat is limited to tasks due within 30 days.',
      };
    }

    return {
      disabled: false,
      helperText: 'Sends at most 14 reminders, once per day from save time, and stops at the due date.',
    };
  }

  if (repeatKey === 'weekly') {
    if (windowMs < WEEK_IN_MS) {
      return {
        disabled: false,
        helperText: 'Weekly repeat needs at least 7 days until the due date.',
      };
    }

    return {
      disabled: false,
      helperText: 'Sends at most 8 reminders, once per week from save time, and stops at the due date.',
    };
  }

  return { disabled: false, helperText: '' };
};

export const getRepeatLabel = (repeatKey, repeatIntervalMinutes) => {
  if (repeatKey === 'none') {
    return 'Once';
  }

  if (repeatKey === 'minutes') {
    const minutes = normalizeRepeatIntervalMinutes(repeatIntervalMinutes);
    return `Every ${minutes} min`;
  }

  return REPEAT_OPTIONS.find((option) => option.key === repeatKey)?.label || 'Once';
};

export const getTaskNotificationSummary = (settings) => {
  const normalizedSettings = deriveNotificationReminderFlags(settings);

  if (!hasReminderEnabled(normalizedSettings)) {
    return 'Off';
  }

  const summaryParts = [
    normalizedSettings.repeat === 'none'
      ? 'Once'
      : getRepeatLabel(
          normalizedSettings.repeat,
          normalizedSettings.repeatIntervalMinutes,
        ),
  ];

  if (normalizedSettings.customMessage.trim()) {
    summaryParts.push('Custom');
  }

  return summaryParts.join(' • ');
};

export const buildTaskNotificationsPayload = ({ settings, dueDate }) => {
  const normalizedSettings = deriveNotificationReminderFlags(settings);

  if (!hasReminderEnabled(normalizedSettings)) {
    return [];
  }

  const lines = ['All Members Notification: On'];

  lines.push(`Auto Reminder: ${normalizedSettings.autoReminder ? 'On' : 'Off'}`);
  lines.push(`Custom Reminder: ${normalizedSettings.customReminder ? 'On' : 'Off'}`);

  if (normalizedSettings.customMessage.trim()) {
    lines.push(`Message: ${normalizedSettings.customMessage.trim()}`);
  }

  lines.push(
    `Repeat: ${getRepeatLabel(
      normalizedSettings.repeat,
      normalizedSettings.repeatIntervalMinutes,
    )}`,
  );

  return lines;
};
