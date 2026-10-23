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
