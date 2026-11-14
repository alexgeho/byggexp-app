// Pure helpers for bookings made from the planning calendar. Mirrors the web
// admin (SchedulePage / OrderQuickModal): a booking is a set of /assignments
// rows — one worker, one project, one day, a start time and hours.
import { addDays, colorForKey, normalizeId } from "./schedule";

// What the web assumes for a booking saved without a start time.
export const DEFAULT_START = "07:00";
const LAST_END_MINUTE = 23 * 60 + 45;

const pad = (n) => String(n).padStart(2, "0");

// Local calendar day → "YYYY-MM-DD".
export const toDayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDayKey = (key) => {
  const [y, m, d] = String(key).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

// The stored date is UTC midnight: take the day straight off the string, a
// local re-parse would drift a day.
export const assignmentDayKey = (assignment) =>
  typeof assignment?.date === "string"
    ? assignment.date.slice(0, 10)
    : toDayKey(new Date(assignment?.date));

// Every day key in an inclusive range; `weekdaysOnly` skips Sat/Sun.
export const enumerateDayKeys = (fromKey, toKey, weekdaysOnly = false) => {
  const out = [];
  const end = parseDayKey(toKey).getTime();
  let cursor = parseDayKey(fromKey);
  while (cursor.getTime() <= end && out.length < 366) {
    const weekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    if (!weekdaysOnly || !weekend) out.push(toDayKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
};

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || DEFAULT_START)
    .split(":")
    .map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const formatMinutes = (minutes) =>
  `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;

export const timeOf = (date) =>
  formatMinutes(date.getHours() * 60 + date.getMinutes());

// Same calendar day as `date`, at "HH:mm".
export const withTime = (date, hhmm) => {
  const minutes = toMinutes(hhmm);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
  );
};

export const hoursBetween = (start, end) =>
  Math.max(0, (toMinutes(end) - toMinutes(start)) / 60);

// End time of a stored booking (start + hours).
export const endTimeFor = (startTime, hours) =>
  formatMinutes(
    toMinutes(startTime || DEFAULT_START) +
      Math.round((Number(hours) || 8) * 60),
  );

// Moving the start keeps the length (Google Calendar behaviour), at least
// 15 minutes, never past 23:45.
export const shiftEndTime = (prevStart, prevEnd, nextStart) => {
  const duration = Math.max(toMinutes(prevEnd) - toMinutes(prevStart), 15);
  return formatMinutes(
    Math.min(LAST_END_MINUTE, toMinutes(nextStart) + duration),
  );
};

// Swedish phone "070-123 45 67" → area code + number, as the user form stores it.
export const splitPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length <= 2) return {};
  return {
    phoneAreaCode: parseInt(digits.slice(0, 2), 10),
    phoneNumber: parseInt(digits.slice(2), 10),
  };
};

export const clientHasName = (client) =>
  client?.clientType === "company"
    ? Boolean(String(client?.companyName || "").trim())
    : Boolean(`${client?.firstName || ""}${client?.lastName || ""}`.trim());

// New client typed in the booking form → POST /clients body: empty fields are
// left out, and so are the ones of the other client type.
export const buildClientBody = (client) => {
  const body = Object.fromEntries(
    Object.entries(client || {})
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
      .filter(
        ([, value]) => value !== "" && value !== null && value !== undefined,
      ),
  );
  if (client?.clientType === "private") {
    delete body.companyName;
    delete body.orgNumber;
    delete body.contactPerson;
  } else {
    delete body.firstName;
    delete body.lastName;
  }
  return body;
};

const hoursLabel = (values) => {
  const unique = [...new Set(values)];
  return unique.length === 1
    ? `${unique[0]} h`
    : `${Math.min(...unique)}–${Math.max(...unique)} h`;
};

// Bars for one employee row: that worker's bookings, the consecutive days of
// one project joined into a single bar.
export const buildBookingItems = (
  assignments = [],
  projectMap = {},
  employeeId,
  noProjectLabel = "—",
) => {
  if (!employeeId) return [];
  const byProject = new Map();
  assignments.forEach((assignment) => {
    if (normalizeId(assignment.userId) !== String(employeeId)) return;
    if (!assignment.date) return;
    const projectId = normalizeId(assignment.projectId) || "";
    if (!byProject.has(projectId)) byProject.set(projectId, []);
    byProject.get(projectId).push({
      day: assignmentDayKey(assignment),
      id: normalizeId(assignment),
      hours: Number(assignment.hours) || 8,
    });
  });

  const items = [];
  byProject.forEach((days, projectId) => {
    days.sort((a, b) => a.day.localeCompare(b.day));
    let run = [];
    const flush = () => {
      if (!run.length) return;
      const first = run[0].day;
      const last = run[run.length - 1].day;
      const project = projectMap[projectId];
      items.push({
        id: `booking-${employeeId}-${projectId}-${first}`,
        type: "booking",
        projectId: projectId || null,
        title: projectId ? project?.name || "—" : noProjectLabel,
        timeLabel: hoursLabel(run.map((entry) => entry.hours)),
        assignmentIds: run.map((entry) => entry.id),
        start: parseDayKey(first).getTime(),
        end: addDays(parseDayKey(last), 1).getTime(),
        color: project?.color || colorForKey(project?.name || projectId),
      });
      run = [];
    };
    days.forEach((entry, index) => {
      const previous = days[index - 1];
      const consecutive =
        previous &&
        toDayKey(addDays(parseDayKey(previous.day), 1)) === entry.day;
      if (index > 0 && !consecutive && previous.day !== entry.day) flush();
      run.push(entry);
    });
    flush();
  });
  return items;
};

// Saving an edited booking changes only the difference: people taken off and
// days outside the new range go, new people / days come, kept bookings get
// the new time and comment.
export const planBookingChanges = ({
  existing = [],
  workerIds = [],
  days = [],
  from,
  to,
  start,
  hours,
  note = "",
}) => {
  const keep = new Set(workerIds.map(String));
  const toDelete = existing.filter((assignment) => {
    const day = assignmentDayKey(assignment);
    return (
      !keep.has(String(normalizeId(assignment.userId))) ||
      day < from ||
      day > to
    );
  });
  const kept = existing.filter((assignment) => !toDelete.includes(assignment));
  const have = new Set(
    kept.map(
      (assignment) =>
        `${normalizeId(assignment.userId)}|${assignmentDayKey(assignment)}`,
    ),
  );
  const toUpdate = kept.filter(
    (assignment) =>
      (assignment.startTime || DEFAULT_START) !== start ||
      Number(assignment.hours) !== hours ||
      (assignment.note || "") !== note,
  );
  const toCreate = workerIds.flatMap((userId) =>
    days
      .filter((date) => !have.has(`${userId}|${date}`))
      .map((date) => ({ userId: String(userId), date })),
  );
  return { toCreate, toDelete, toUpdate };
};
