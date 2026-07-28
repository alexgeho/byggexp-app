import {
  defaultRepeatIntervalMinutes,
  maxHourlyRepeatRuns,
  maxMinuteRepeatRuns,
  maxRepeatIntervalMinutes,
  minRepeatIntervalMinutes,
} from '../theme/settings';
import i18n from '../i18n';

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
          name: item.name || i18n.t('project.unnamedWorker'),
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
      helperText: i18n.t('taskReminders.helper.needDueDate'),
    };
  }

  if (windowMs <= 0) {
    return {
      disabled: false,
      helperText: i18n.t('taskReminders.helper.dueInFuture'),
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
        helperText: i18n.t('taskReminders.helper.minutesNeed', {
          minutes: intervalMinutes,
        }),
      };
    }

    const maxRuns = Math.min(
      maxMinuteRepeatRuns,
      Math.floor(windowMs / intervalMs),
    );

    return {
      disabled: false,
      helperText: i18n.t('taskReminders.helper.minutesSends', {
        maxRuns,
        minutes: intervalMinutes,
      }),
    };
  }

  if (repeatKey === 'hourly') {
    if (windowMs < HOUR_IN_MS) {
      return {
        disabled: false,
        helperText: i18n.t('taskReminders.helper.hourlyNeed'),
      };
    }

    const maxRuns = Math.min(
      maxHourlyRepeatRuns,
      Math.floor(windowMs / HOUR_IN_MS),
    );

    return {
      disabled: false,
      helperText: i18n.t('taskReminders.helper.hourlySends', { maxRuns }),
    };
  }

  if (repeatKey === 'daily') {
    if (windowMs < DAY_IN_MS) {
      return {
        disabled: false,
        helperText: i18n.t('taskReminders.helper.dailyNeed'),
      };
    }

    if (windowMs > 30 * DAY_IN_MS) {
      return {
        disabled: false,
        helperText: i18n.t('taskReminders.helper.dailyLimit'),
      };
    }

    return {
      disabled: false,
      helperText: i18n.t('taskReminders.helper.dailySends'),
    };
  }

  if (repeatKey === 'weekly') {
    if (windowMs < WEEK_IN_MS) {
      return {
        disabled: false,
        helperText: i18n.t('taskReminders.helper.weeklyNeed'),
      };
    }

    return {
      disabled: false,
      helperText: i18n.t('taskReminders.helper.weeklySends'),
    };
  }

  return { disabled: false, helperText: '' };
};

export const getRepeatLabel = (repeatKey, repeatIntervalMinutes) => {
  if (repeatKey === 'minutes') {
    const minutes = normalizeRepeatIntervalMinutes(repeatIntervalMinutes);
    return i18n.t('taskReminders.everyMinutes', { minutes });
  }

  const fallback =
    REPEAT_OPTIONS.find((option) => option.key === repeatKey)?.label || 'Once';
  return i18n.t(`taskReminders.repeat.${repeatKey}`, fallback);
};

export const getTaskNotificationSummary = (settings) => {
  const normalizedSettings = deriveNotificationReminderFlags(settings);

  if (!hasReminderEnabled(normalizedSettings)) {
    return i18n.t('taskReminders.off');
  }

  const summaryParts = [
    getRepeatLabel(
      normalizedSettings.repeat,
      normalizedSettings.repeatIntervalMinutes,
    ),
  ];

  if (normalizedSettings.customMessage.trim()) {
    summaryParts.push(i18n.t('taskReminders.custom'));
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
