import { API_BASE_URL } from '../services/api';

const shortMonthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const dayDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatDuration = (durationMs = 0) => {
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

export const formatDurationVerbose = (durationMs = 0) => {
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) {
    return `${hours} hours ${minutes} min`;
  }

  if (hours) {
    return `${hours} hours`;
  }

  return `${minutes} min`;
};

export const formatDurationShort = (durationMs = 0) => {
  const hours = durationMs / (60 * 60 * 1000);
  if (hours >= 1) {
    return `${Math.round(hours)}h`;
  }

  const minutes = Math.max(1, Math.round(durationMs / 60000));
  return `${minutes}m`;
};

export const formatShiftDate = (dateString) => {
  if (!dateString) return '—';

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return longDateFormatter.format(date);
};

export const formatShiftDayLabel = (dateString) => {
  if (!dateString) return '—';

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return dayDateFormatter.format(date);
};

export const formatMonthLabel = (monthKey) => {
  if (!monthKey) return 'No periods';

  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return shortMonthFormatter.format(date);
};

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getTodayDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const getAdjacentMonthKey = (monthKey, delta) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return null;
  }

  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const getISOWeekNumber = (date) => {
  const normalizedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayNum = normalizedDate.getDay() || 7;
  normalizedDate.setDate(normalizedDate.getDate() + 4 - dayNum);
  const yearStart = new Date(normalizedDate.getFullYear(), 0, 1);

  return Math.ceil(
    ((normalizedDate - yearStart) / 86400000 + 1) / 7,
  );
};

export const getCalendarWeekNumber = (
  year,
  month,
  firstDayIndex,
  rowStartCellIndex,
) => {
  const mondayOffsetFromFirst = rowStartCellIndex - firstDayIndex;
  const mondayDate = new Date(year, month - 1, 1 + mondayOffsetFromFirst);

  return getISOWeekNumber(mondayDate);
};

export const formatTimeRange = (startedAt, endedAt) => {
  if (!startedAt) return '—';

  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) {
    return '—';
  }

  const startLabel = timeFormatter.format(start);

  if (!endedAt) {
    return `${startLabel} - ...`;
  }

  const end = new Date(endedAt);
  if (Number.isNaN(end.getTime())) {
    return `${startLabel} - ...`;
  }

  return `${startLabel} - ${timeFormatter.format(end)}`;
};

export const resolveUploadUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

export const formatShiftListProjectName = (projectName, maxLength = 30) => {
  const name = String(projectName || '').trim();

  if (!name) {
    return '—';
  }

  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength)}…`;
};
