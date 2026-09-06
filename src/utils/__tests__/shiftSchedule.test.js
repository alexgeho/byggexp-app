import {
  parseTimeToMinutes,
  formatMinutesAsTime,
  buildShiftSchedulePayload,
  createDefaultShiftSchedule,
  parseTimeFromDate,
  parseTimeStringToDate,
  getShiftScheduleWindow,
  DEFAULT_SHIFT_TIMEZONE,
} from "../shiftSchedule";

describe("parseTimeToMinutes", () => {
  it("parses HH:MM into minutes", () => {
    expect(parseTimeToMinutes("08:30")).toBe(510);
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });

  it("falls back to 0 for empty or malformed input", () => {
    expect(parseTimeToMinutes("")).toBe(0);
    expect(parseTimeToMinutes(null)).toBe(0);
    expect(parseTimeToMinutes("abc")).toBe(0);
  });
});

describe("formatMinutesAsTime", () => {
  it("formats minutes into zero-padded HH:MM", () => {
    expect(formatMinutesAsTime(510)).toBe("08:30");
    expect(formatMinutesAsTime(0)).toBe("00:00");
  });

  it("wraps around a 24h day", () => {
    expect(formatMinutesAsTime(-30)).toBe("23:30");
    expect(formatMinutesAsTime(24 * 60 + 90)).toBe("01:30");
  });
});

describe("parseTimeFromDate / parseTimeStringToDate", () => {
  it("reads local HH:MM off a date", () => {
    const date = new Date(2026, 5, 1, 9, 5);
    expect(parseTimeFromDate(date)).toBe("09:05");
  });

  it("writes HH:MM onto a base date without touching the day", () => {
    const base = new Date(2026, 5, 1, 0, 0, 0, 0);
    const result = parseTimeStringToDate("14:45", base);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(45);
    expect(result.getDate()).toBe(1);
  });
});

describe("createDefaultShiftSchedule / buildShiftSchedulePayload", () => {
  it("provides sensible defaults", () => {
    expect(createDefaultShiftSchedule()).toEqual({
      enabled: false,
      workDayStartTime: "07:00",
      workDayEndTime: "16:00",
      startGraceMinutes: 30,
      endGraceMinutes: 30,
      lunchMinutes: 60,
      timezone: DEFAULT_SHIFT_TIMEZONE,
    });
  });

  it("coerces types and fills gaps when building the payload", () => {
    expect(
      buildShiftSchedulePayload({
        enabled: 1,
        workDayStartTime: "",
        workDayEndTime: null,
        startGraceMinutes: "15",
        endGraceMinutes: undefined,
      }),
    ).toEqual({
      enabled: true,
      workDayStartTime: "07:00",
      workDayEndTime: "16:00",
      startGraceMinutes: 15,
      endGraceMinutes: 30,
      lunchMinutes: 60,
      timezone: DEFAULT_SHIFT_TIMEZONE,
    });
  });
});

describe("getShiftScheduleWindow", () => {
  const utcAt = (hour, minute = 0) =>
    new Date(Date.UTC(2026, 0, 15, hour, minute));
  const schedule = {
    enabled: true,
    timezone: "UTC",
    workDayStartTime: "07:00",
    workDayEndTime: "16:00",
    startGraceMinutes: 20,
    endGraceMinutes: 20,
  };

  it("is unenforced when the schedule is disabled", () => {
    expect(getShiftScheduleWindow({ enabled: false })).toEqual({
      enforced: false,
      canStart: true,
      canComplete: true,
    });
  });

  it("blocks everything when the hours are invalid", () => {
    const result = getShiftScheduleWindow(
      {
        enabled: true,
        timezone: "UTC",
        workDayStartTime: "16:00",
        workDayEndTime: "07:00",
      },
      utcAt(10),
    );
    expect(result.canStart).toBe(false);
    expect(result.canComplete).toBe(false);
    expect(result.message).toMatch(/Invalid work day hours/);
  });

  it("allows starting inside the grace-adjusted window", () => {
    const result = getShiftScheduleWindow(schedule, utcAt(8));
    expect(result.canStart).toBe(true);
    expect(result.canComplete).toBe(true);
    expect(result.earliestStartLabel).toBe("06:40");
    expect(result.latestCompleteLabel).toBe("16:20");
  });

  it("blocks an early start before the grace window opens", () => {
    const result = getShiftScheduleWindow(schedule, utcAt(6, 0)); // 06:00 < 06:40
    expect(result.canStart).toBe(false);
    expect(result.message).toMatch(/Shift can be started between/);
  });

  it("blocks completion after the end grace passes", () => {
    const result = getShiftScheduleWindow(schedule, utcAt(17, 0)); // 17:00 > 16:20
    expect(result.canComplete).toBe(false);
  });
});
