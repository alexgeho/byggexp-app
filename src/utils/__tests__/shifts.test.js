// shifts.js imports the axios api module and the i18n instance for its
// locale-aware formatters; the pure date/url/string helpers under test use
// neither, so stub both so the module resolves under jest.
import {
  getMonthDateRange,
  formatDateKey,
  parseDateKey,
  getAdjacentMonthKey,
  buildExportMonthOptions,
  resolveUploadUrl,
  formatShiftListProjectName,
} from "../shifts";

jest.mock("../../services/api", () => ({ API_BASE_URL: "https://api.test" }));
jest.mock("../../i18n", () => ({
  __esModule: true,
  default: { language: "en", t: (key) => key },
}));

describe("getMonthDateRange", () => {
  it("returns the first and last day of the month", () => {
    expect(getMonthDateRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(getMonthDateRange("2026-01")).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("handles a leap-year February", () => {
    expect(getMonthDateRange("2024-02").to).toBe("2024-02-29");
  });

  it("returns empty strings for an invalid month key", () => {
    expect(getMonthDateRange("nope")).toEqual({ from: "", to: "" });
    expect(getMonthDateRange("")).toEqual({ from: "", to: "" });
  });
});

describe("formatDateKey", () => {
  it("formats a Date as YYYY-MM-DD", () => {
    expect(formatDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("returns an empty string for non-dates/invalid dates", () => {
    expect(formatDateKey(null)).toBe("");
    expect(formatDateKey("2026-01-01")).toBe("");
    expect(formatDateKey(new Date("nonsense"))).toBe("");
  });
});

describe("parseDateKey", () => {
  it("round-trips with formatDateKey", () => {
    expect(formatDateKey(parseDateKey("2026-03-10"))).toBe("2026-03-10");
  });

  it("returns a valid Date for empty/invalid input", () => {
    expect(parseDateKey("").getTime()).not.toBeNaN();
    expect(parseDateKey("garbage").getTime()).not.toBeNaN();
  });
});

describe("getAdjacentMonthKey", () => {
  it("steps to the previous/next month across year boundaries", () => {
    expect(getAdjacentMonthKey("2026-01", -1)).toBe("2025-12");
    expect(getAdjacentMonthKey("2026-12", 1)).toBe("2027-01");
    expect(getAdjacentMonthKey("2026-06", 0)).toBe("2026-06");
  });

  it("returns null for an invalid month key", () => {
    expect(getAdjacentMonthKey("bad", 1)).toBeNull();
    expect(getAdjacentMonthKey("", -1)).toBeNull();
  });
});

describe("buildExportMonthOptions", () => {
  it("returns sorted, unique, valid month keys and keeps provided ones", () => {
    const result = buildExportMonthOptions(["2020-05"], ["2019-01", "bad"]);
    expect(result).toContain("2020-05");
    expect(result).toContain("2019-01");
    expect(result.every((m) => /^\d{4}-\d{2}$/.test(m))).toBe(true);
    expect(new Set(result).size).toBe(result.length);
    expect([...result]).toEqual([...result].sort((a, b) => a.localeCompare(b)));
  });
});

describe("resolveUploadUrl", () => {
  it("returns absolute urls unchanged", () => {
    expect(resolveUploadUrl("https://cdn.x/a.png")).toBe("https://cdn.x/a.png");
  });

  it("prefixes relative paths with the api base", () => {
    expect(resolveUploadUrl("/uploads/a.png")).toBe(
      "https://api.test/uploads/a.png",
    );
    expect(resolveUploadUrl("uploads/a.png")).toBe(
      "https://api.test/uploads/a.png",
    );
  });

  it("returns null for empty input", () => {
    expect(resolveUploadUrl("")).toBeNull();
    expect(resolveUploadUrl(null)).toBeNull();
  });
});

describe("formatShiftListProjectName", () => {
  it("returns short names unchanged", () => {
    expect(formatShiftListProjectName("Villa Ek")).toBe("Villa Ek");
  });

  it("truncates long names with an ellipsis", () => {
    const long = "A".repeat(40);
    const result = formatShiftListProjectName(long, 30);
    expect(result).toBe(`${"A".repeat(30)}…`);
  });

  it("returns a dash for empty/blank names", () => {
    expect(formatShiftListProjectName("")).toBe("—");
    expect(formatShiftListProjectName("   ")).toBe("—");
    expect(formatShiftListProjectName(null)).toBe("—");
  });
});
