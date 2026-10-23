// Övertid inside a day: "8 h normal + 2 h övertid". Pure helpers, no i18n or
// network, so the split rule is unit-testable.

const HOUR_MS = 3600000;

// The day's planned hours, which the overtime is counted from. Taken from the
// hours grid when the month has a plan at all (a day it leaves out — weekend,
// red day, leave — is planned at 0); without any plan, a weekday is 8 h and a
// weekend 0 h.
export const dayPlanHours = (dateKey, plannedByDate) => {
  const monthKey = String(dateKey).slice(0, 7);
  let monthHasPlan = false;
  if (plannedByDate) {
    plannedByDate.forEach((ms, key) => {
      if (ms > 0 && key.startsWith(monthKey)) monthHasPlan = true;
    });
  }
  if (monthHasPlan) {
    return (plannedByDate.get(dateKey) || 0) / HOUR_MS;
  }
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 || weekday === 6 ? 0 : 8;
};

// Whatever goes over the plan is proposed as övertid.
export const proposeOvertime = (totalHours, planHours) =>
  Math.max(0, (Number(totalHours) || 0) - (Number(planHours) || 0));

// One step of the − / + buttons, kept between 0 and the day's hours.
export const stepOvertime = (overtimeHours, totalHours, delta) =>
  Math.min(
    Math.max(0, Math.round(((Number(overtimeHours) || 0) + delta) * 2) / 2),
    Math.max(0, Number(totalHours) || 0),
  );

// The day's saved övertid from its shifts: total and whether any of it still
// waits for a manager.
export const dayOvertime = (day) => {
  let overtimeMs = 0;
  let pending = false;
  (day?.shifts || []).forEach((shift) => {
    const ms = Number(shift.overtimeMs) || 0;
    overtimeMs += ms;
    if (ms > 0 && shift.overtimeStatus !== "approved") pending = true;
  });
  return { overtimeMs, pending };
};

// The rest of the day's pay lines, saved on its shifts: OB hours, travel time
// (hours), kilometres and the per-diem bracket.
const PER_DIEM_RANK = { none: 0, half: 1, full: 2 };
export const dayExtras = (day) => {
  let obMs = 0;
  let travelMinutes = 0;
  let travelKm = 0;
  let perDiem = "none";
  (day?.shifts || []).forEach((shift) => {
    obMs += Number(shift.obMs) || 0;
    travelMinutes += Number(shift.travelMinutes) || 0;
    travelKm += Number(shift.travelKm) || 0;
    if ((PER_DIEM_RANK[shift.perDiem] || 0) > PER_DIEM_RANK[perDiem]) {
      perDiem = shift.perDiem;
    }
  });
  return {
    ob: obMs / HOUR_MS,
    travel: travelMinutes / 60,
    km: travelKm,
    perDiem,
  };
};

export const sameExtras = (a, b) =>
  Math.round((a?.ob || 0) * 60) === Math.round((b?.ob || 0) * 60) &&
  Math.round((a?.travel || 0) * 60) === Math.round((b?.travel || 0) * 60) &&
  Math.round(a?.km || 0) === Math.round(b?.km || 0) &&
  (a?.perDiem || "none") === (b?.perDiem || "none");

// One − / + step, kept between `min` and `max`.
export const stepWithin = (value, delta, max, min = 0) =>
  Math.min(
    Math.max(min, Math.round(((Number(value) || 0) + delta) * 2) / 2),
    max,
  );
