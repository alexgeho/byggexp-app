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

// ── Hour grid (the web admin's Google-Calendar view) ────────────────────────
// The whole day, 00–24 (owner 15.11); the grid opens scrolled to the morning.
export const GRID_FIRST_HOUR = 0;
export const GRID_LAST_HOUR = 24;
export const GRID_OPEN_HOUR = 6;

// A tap on the grid → the half hour it landed on, and one hour from there
// (the web's click). Kept inside the day: the latest slot ends at 23:30, never
// at "24:00".
export const slotAt = (offsetY, hourHeight) => {
  const first = GRID_FIRST_HOUR * 60;
  const last = GRID_LAST_HOUR * 60;
  const raw = first + (offsetY / hourHeight) * 60;
  const start = Math.min(last - 90, Math.max(first, Math.floor(raw / 30) * 30));
  return { start: formatMinutes(start), end: formatMinutes(start + 60) };
};

// A finger on the grid → the index of the day under it. `rows` are the week
// rows' { y, height } (month / period); without them there is one row (week).
export const dayIndexAt = ({ x, y, width, gutter, columns, rows }) => {
  const columnWidth = (width - gutter) / columns;
  const column = Math.min(
    columns - 1,
    Math.max(0, Math.floor((x - gutter) / columnWidth)),
  );
  if (!rows || !rows.length) return column;
  let row = rows.findIndex((item) => y < item.y + item.height);
  if (row === -1) row = rows.length - 1;
  return row * columns + column;
};

// The time a drag covers: from the slot the long press started on down to the
// half hour under the finger — at least half an hour, never past 23:30.
export const dragEndMinute = (startMinute, offsetY, hourHeight) => {
  const raw = GRID_FIRST_HOUR * 60 + (offsetY / hourHeight) * 60;
  return Math.min(
    GRID_LAST_HOUR * 60 - 30,
    Math.max(startMinute + 30, Math.ceil(raw / 30) * 30),
  );
};

// Overlapping blocks of one day go side by side: each gets a lane and the
// day's lane count.
const layoutDay = (blocks) => {
  const sorted = [...blocks].sort((a, b) => a.start - b.start || b.end - a.end);
  const laneEnds = [];
  sorted.forEach((block) => {
    let lane = laneEnds.findIndex((end) => end <= block.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(block.end);
    } else {
      laneEnds[lane] = block.end;
    }
    block.lane = lane;
  });
  sorted.forEach((block) => {
    block.lanes = Math.max(1, laneEnds.length);
  });
  return sorted;
};

// dayKey → that day's booking blocks (minutes from 00:00), laid out in lanes.
// `hiddenIds` = people switched off in the people row. A person planned for
// more than 8 hours on a day gets `overbooked` on all their blocks that day.
export const buildDayBlocks = (assignments = [], dayKeys = [], hiddenIds) => {
  const byDay = Object.fromEntries(dayKeys.map((day) => [day, []]));
  const hours = {};
  assignments.forEach((assignment) => {
    if (!assignment?.date) return;
    const userId = normalizeId(assignment.userId) || "";
    const day = assignmentDayKey(assignment);
    const planned = Number(assignment.hours) || 8;
    hours[`${userId}|${day}`] = (hours[`${userId}|${day}`] || 0) + planned;
    if (!byDay[day] || hiddenIds?.has(userId)) return;
    const start = toMinutes(assignment.startTime);
    byDay[day].push({
      id: normalizeId(assignment),
      assignment,
      userId,
      projectId: normalizeId(assignment.projectId) || "",
      start,
      end: start + Math.round(planned * 60),
    });
  });
  Object.keys(byDay).forEach((day) => {
    byDay[day] = layoutDay(byDay[day]).map((block) => ({
      ...block,
      overbooked: hours[`${block.userId}|${day}`] > 8,
    }));
  });
  return byDay;
};

// dayKey → approved absences (Frånvaro) of the shown people on that day.
export const buildDayLeaves = (leaves = [], dayKeys = [], hiddenIds) => {
  const byDay = Object.fromEntries(dayKeys.map((day) => [day, []]));
  leaves.forEach((leave) => {
    if (String(leave?.status || "").toLowerCase() !== "approved") return;
    const userId = normalizeId(leave.userId) || "";
    if (hiddenIds?.has(userId) || !leave.startDate) return;
    // Local days, as the month timeline reads them.
    const from = toDayKey(new Date(leave.startDate));
    const to = toDayKey(new Date(leave.endDate || leave.startDate));
    dayKeys.forEach((day) => {
      if (day >= from && day <= to) {
        byDay[day].push({ userId, type: leave.type || "other" });
      }
    });
  });
  return byDay;
};
