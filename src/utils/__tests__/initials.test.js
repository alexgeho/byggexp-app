import { getInitials } from "../initials";

describe("getInitials", () => {
  it("uses the first and last word's first letter", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("John Michael Doe")).toBe("JD");
  });

  it("uppercases the result", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("returns a single letter for a one-word name", () => {
    expect(getInitials("Madonna")).toBe("M");
  });

  it("collapses extra whitespace", () => {
    expect(getInitials("  Anna   Svensson  ")).toBe("AS");
  });

  it("falls back to '?' for empty/blank/nullish names", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
    expect(getInitials(null)).toBe("?");
    expect(getInitials(undefined)).toBe("?");
  });
});
