import {
  dayOvertime,
  dayPlanHours,
  proposeOvertime,
  stepOvertime,
} from "../overtime";

const H = 3600000;

test("the plan comes from the hours grid when the month has one", () => {
  const plan = new Map([
    ["2026-10-20", 8 * H],
    ["2026-10-21", 7 * H],
  ]);
  expect(dayPlanHours("2026-10-21", plan)).toBe(7);
  // A weekday the grid leaves out (red day, leave) is planned at 0.
  expect(dayPlanHours("2026-10-22", plan)).toBe(0);
});

test("without a plan a weekday is 8 h and a weekend 0 h", () => {
  expect(dayPlanHours("2026-10-22", null)).toBe(8);
  expect(dayPlanHours("2026-10-24", new Map())).toBe(0);
  // A plan for another month does not count.
  expect(dayPlanHours("2026-10-22", new Map([["2026-09-30", 8 * H]]))).toBe(8);
});

test("hours over the plan are proposed as övertid", () => {
  expect(proposeOvertime(10, 8)).toBe(2);
  expect(proposeOvertime(6, 8)).toBe(0);
  expect(proposeOvertime(5, 0)).toBe(5);
});

test("the − / + buttons move in half hours inside the day", () => {
  expect(stepOvertime(2, 10, 0.5)).toBe(2.5);
  expect(stepOvertime(0, 10, -0.5)).toBe(0);
  expect(stepOvertime(9.5, 10, 0.5)).toBe(10);
  expect(stepOvertime(10, 10, 0.5)).toBe(10);
});

test("a day's övertid is pending while any of it waits for a manager", () => {
  expect(
    dayOvertime({
      shifts: [
        { overtimeMs: 2 * H, overtimeStatus: "approved" },
        { overtimeMs: 0, overtimeStatus: null },
      ],
    }),
  ).toEqual({ overtimeMs: 2 * H, pending: false });
  expect(
    dayOvertime({ shifts: [{ overtimeMs: H, overtimeStatus: "pending" }] }),
  ).toEqual({ overtimeMs: H, pending: true });
  expect(dayOvertime(undefined)).toEqual({ overtimeMs: 0, pending: false });
});
