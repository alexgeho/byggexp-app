// Pure calendar-layout logic for the shifts screen.
import { buildCalendarLayout } from "../shiftsCalendar";

const flattenDates = (layout) =>
  layout.rows.flatMap((row) => row.cells).filter(Boolean);

describe("buildCalendarLayout", () => {
  it("returns an empty layout for a missing month", () => {
    expect(buildCalendarLayout(null)).toEqual({
      columnDates: [],
      rowDates: [],
      rows: [],
    });
    expect(buildCalendarLayout("")).toEqual({
      columnDates: [],
      rowDates: [],
      rows: [],
    });
  });

  it("lays out July 2026 as five Monday-first weeks", () => {
    const layout = buildCalendarLayout("2026-07");

    // July 1 2026 is a Wednesday -> two leading nulls, then day 1.
    expect(layout.rows).toHaveLength(5);
    expect(layout.rows[0].cells).toEqual([
      null,
      null,
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
    ]);

    // Monday column (index 0) collects every Monday of the month.
    expect(layout.columnDates[0]).toEqual([
      "2026-07-06",
      "2026-07-13",
      "2026-07-20",
      "2026-07-27",
    ]);
  });

  it("includes every day of the month exactly once", () => {
    const dates = flattenDates(buildCalendarLayout("2026-02")); // 28 days
    expect(dates).toHaveLength(28);
    expect(new Set(dates).size).toBe(28);
    expect(dates[0]).toBe("2026-02-01");
    expect(dates[dates.length - 1]).toBe("2026-02-28");
  });

  it("pads every row to seven cells and numbers weeks consecutively", () => {
    const layout = buildCalendarLayout("2026-07");
    layout.rows.forEach((row) => expect(row.cells).toHaveLength(7));
    for (let i = 1; i < layout.rows.length; i += 1) {
      expect(layout.rows[i].weekNumber).toBe(layout.rows[i - 1].weekNumber + 1);
    }
  });

  it("rowDates only contains real dates (no null padding)", () => {
    const layout = buildCalendarLayout("2026-07");
    layout.rowDates.forEach((row) =>
      row.forEach((date) => expect(date).not.toBeNull()),
    );
    expect(layout.rowDates.flat()).toHaveLength(31);
  });
});
