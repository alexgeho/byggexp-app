import { isValidEmail } from "../validation";

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("john.doe@example.com")).toBe(true);
    expect(isValidEmail("  trimmed@example.com  ")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("bad")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);
    expect(isValidEmail("with space@example.com")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("rejects empty/nullish input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});
