// dateLocale reads the active language off the i18n instance; stub it so the
// module resolves and the locale is deterministic under jest.
import {
  getDateLocale,
  formatDisplayDate,
  formatDateOrNull,
} from "../dateLocale";

jest.mock("../../i18n", () => ({
  __esModule: true,
  default: { language: "en" },
}));

describe("getDateLocale", () => {
  it("returns the active language", () => {
    expect(getDateLocale()).toBe("en");
  });
});

describe("formatDisplayDate", () => {
  it("returns an empty string for empty input", () => {
    expect(formatDisplayDate("")).toBe("");
    expect(formatDisplayDate(null)).toBe("");
  });

  it("echoes back a value that is not a valid date", () => {
    expect(formatDisplayDate("not-a-date")).toBe("not-a-date");
  });

  it("formats a valid ISO date to a non-empty localized string", () => {
    const result = formatDisplayDate("2025-08-05");
    expect(typeof result).toBe("string");
    expect(result).toContain("2025");
  });
});

describe("formatDateOrNull", () => {
  it("returns null for missing/unparseable values", () => {
    expect(formatDateOrNull(null)).toBeNull();
    expect(formatDateOrNull("")).toBeNull();
    expect(formatDateOrNull(0)).toBeNull();
    expect(formatDateOrNull("garbage")).toBeNull();
  });

  it("returns null for epoch-ish (<= 1970) dates", () => {
    expect(formatDateOrNull("1970-01-01")).toBeNull();
    expect(formatDateOrNull("1969-06-15")).toBeNull();
  });

  it("returns a localized string for a real date", () => {
    const result = formatDateOrNull("2026-08-19");
    expect(result).toBeTruthy();
    expect(result).toContain("2026");
  });
});
