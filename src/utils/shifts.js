import { API_BASE_URL } from "../services/api";
import i18n from "../i18n";

const MONTH_YEAR_OPTIONS = { month: "long", year: "numeric" };
const DAY_DATE_OPTIONS = { month: "long", day: "numeric", year: "numeric" };
const TIME_OPTIONS = { hour: "2-digit", minute: "2-digit", hour12: false };
const EXPORT_PICKER_OPTIONS = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

// Build date formatters for the active language ('sv'/'en' are valid Intl
// locales), cached per locale+options so a language switch reformats dates.
const dateFormatterCache = new Map();
const getDateFormatter = (options) => {
  const locale = i18n.language || "en";
  const cacheKey = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateFormatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatterCache.set(cacheKey, formatter);
  }
  return formatter;
};

// Worked time reads in hours, the way hours are reported and paid — "7,5 h",
// not "7h 30m". Nobody on a site counts a day in minutes, and the decimal is
// the same number that ends up on the payslip. Rounded to one decimal, so a
// stray second never shows up as 7,4999.
export const formatDuration = (durationMs = 0) => {
  const hours = Math.round((durationMs / 3600000) * 10) / 10;
  return `${String(hours).replace(".", ",")} h`;
};

// Calendar cells are tiny, so the unit is dropped — the column is hours and
// nothing else. Still decimal hours, never minutes.
export const formatDurationShort = (durationMs = 0) => {
  const hours = Math.round((durationMs / 3600000) * 10) / 10;
  return String(hours).replace(".", ",");
};

// The month total at the top of the shifts screen. Same rule as everywhere
// else: hours with one decimal, because that is the number that gets paid.
export const formatDurationCompact = (durationMs = 0) =>
  formatDuration(durationMs);

export const formatShiftDayLabel = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return getDateFormatter(DAY_DATE_OPTIONS).format(date);
};

export const formatMonthLabel = (monthKey) => {
  if (!monthKey) return i18n.t("shifts.noPeriods");

  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return getDateFormatter(MONTH_YEAR_OPTIONS).format(date);
};

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const getTodayDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const getMonthDateRange = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return { from: "", to: "" };
  }

  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
};

export const formatExportPickerDate = (dateString) => {
  if (!dateString) {
    return i18n.t("shifts.selectDate");
  }

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return getDateFormatter(EXPORT_PICKER_OPTIONS).format(date);
};

export const formatDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDateKey = (value) => {
  if (!value) {
    return new Date();
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const buildExportMonthOptions = (
  availableMonths = [],
  extraMonths = [],
) => {
  const isValidMonthKey = (value) =>
    typeof value === "string" && /^\d{4}-\d{2}$/.test(value);

  const monthSet = new Set([
    ...availableMonths.filter(isValidMonthKey),
    ...extraMonths.filter(isValidMonthKey),
    getCurrentMonthKey(),
  ]);
  const now = new Date();

  for (let index = 0; index < 36; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    monthSet.add(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  return Array.from(monthSet).sort((left, right) => left.localeCompare(right));
};

export const getAdjacentMonthKey = (monthKey, delta) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return null;
  }

  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const formatTimeRange = (startedAt, endedAt) => {
  if (!startedAt) return "—";

  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) {
    return "—";
  }

  const startLabel = getDateFormatter(TIME_OPTIONS).format(start);

  if (!endedAt) {
    return `${startLabel} - ...`;
  }

  const end = new Date(endedAt);
  if (Number.isNaN(end.getTime())) {
    return `${startLabel} - ...`;
  }

  return `${startLabel} - ${getDateFormatter(TIME_OPTIONS).format(end)}`;
};

export const resolveUploadUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export const formatShiftListProjectName = (projectName, maxLength = 30) => {
  const name = String(projectName || "").trim();

  if (!name) {
    return "—";
  }

  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength)}…`;
};
