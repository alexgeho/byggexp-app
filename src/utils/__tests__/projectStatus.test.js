import {
  PROJECT_STATUS_BADGES,
  getProjectStatusBadgeStyle,
  formatProjectStatus,
} from "../projectStatus";

describe("getProjectStatusBadgeStyle", () => {
  it("returns the badge style for a known status", () => {
    expect(getProjectStatusBadgeStyle("planning")).toBe(
      PROJECT_STATUS_BADGES.planning,
    );
    expect(getProjectStatusBadgeStyle("in_progress")).toBe(
      PROJECT_STATUS_BADGES.in_progress,
    );
  });

  it("falls back to a neutral grey badge for unknown/missing status", () => {
    const fallback = getProjectStatusBadgeStyle("nope");
    expect(fallback).toEqual({
      color: "#698196",
      backgroundColor: "#69819624",
    });
    expect(getProjectStatusBadgeStyle(undefined)).toEqual(fallback);
  });
});

describe("formatProjectStatus", () => {
  it("humanizes a snake_case status", () => {
    expect(formatProjectStatus("in_progress")).toBe("In progress");
    expect(formatProjectStatus("on_hold")).toBe("On hold");
    expect(formatProjectStatus("completed")).toBe("Completed");
  });

  it("returns an empty string for a missing status", () => {
    expect(formatProjectStatus("")).toBe("");
    expect(formatProjectStatus(null)).toBe("");
  });
});
