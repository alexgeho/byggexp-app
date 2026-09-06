export const DEFAULT_SHIFT_TIMEZONE = "Europe/Oslo";

export const SHIFT_GRACE_MINUTE_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

export const parseTimeToMinutes = (time) => {
  const [hours, minutes] = String(time || "00:00")
    .split(":")
    .map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
};

export const formatMinutesAsTime = (totalMinutes) => {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const getZonedParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const read = (type) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
};

export const getMinutesOfDayInTimezone = (date, timeZone) => {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
};

export const getShiftScheduleWindow = (schedule, at = new Date()) => {
  if (!schedule?.enabled) {
    return {
      enforced: false,
      canStart: true,
      canComplete: true,
    };
  }

  const timezone = schedule.timezone || DEFAULT_SHIFT_TIMEZONE;
  const startMinutes = parseTimeToMinutes(schedule.workDayStartTime || "07:00");
  const endMinutes = parseTimeToMinutes(schedule.workDayEndTime || "16:00");
  const startGrace = schedule.startGraceMinutes ?? 0;
  const endGrace = schedule.endGraceMinutes ?? 0;

  if (endMinutes <= startMinutes) {
    return {
      enforced: true,
      canStart: false,
      canComplete: false,
      message: "Invalid work day hours configured for this project.",
    };
  }

  const nowMinutes = getMinutesOfDayInTimezone(at, timezone);
  const earliestStart = startMinutes - startGrace;
  const latestStart = endMinutes;
  const latestComplete = endMinutes + endGrace;
  const canStart = nowMinutes >= earliestStart && nowMinutes <= latestStart;
  const canComplete = nowMinutes <= latestComplete;

  return {
    enforced: true,
    canStart,
    canComplete,
    earliestStartLabel: formatMinutesAsTime(earliestStart),
    latestStartLabel: formatMinutesAsTime(latestStart),
    latestCompleteLabel: formatMinutesAsTime(latestComplete),
    message: !canStart
      ? `Shift can be started between ${formatMinutesAsTime(earliestStart)} and ${formatMinutesAsTime(latestStart)}.`
      : undefined,
  };
};

export const getStartWindowErrorMessage = (window) =>
  window.message ||
  `Shift can be started between ${window.earliestStartLabel} and ${window.latestStartLabel}.`;

// Lunch deduction options (minutes) offered in the shift sheet.
export const SHIFT_LUNCH_MINUTE_OPTIONS = [0, 30, 60];

export const createDefaultShiftSchedule = () => ({
  enabled: false,
  workDayStartTime: "07:00",
  workDayEndTime: "16:00",
  startGraceMinutes: 20,
  endGraceMinutes: 20,
  lunchMinutes: 60,
  timezone: DEFAULT_SHIFT_TIMEZONE,
});

export const parseTimeFromDate = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const parseTimeStringToDate = (timeString, baseDate = new Date()) => {
  const totalMinutes = parseTimeToMinutes(timeString);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const nextDate = new Date(baseDate);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
};

export const buildShiftSchedulePayload = ({
  enabled,
  workDayStartTime,
  workDayEndTime,
  startGraceMinutes,
  endGraceMinutes,
  lunchMinutes,
  timezone = DEFAULT_SHIFT_TIMEZONE,
}) => ({
  enabled: Boolean(enabled),
  workDayStartTime: workDayStartTime || "07:00",
  workDayEndTime: workDayEndTime || "16:00",
  startGraceMinutes: Number(startGraceMinutes ?? 20),
  endGraceMinutes: Number(endGraceMinutes ?? 20),
  lunchMinutes: Number(lunchMinutes ?? 60),
  timezone,
});
