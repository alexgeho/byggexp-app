import { getEntityId, normalizeRefId } from "../entityId";

describe("getEntityId", () => {
  it("returns the stringified _id when present", () => {
    expect(getEntityId({ _id: "abc123" })).toBe("abc123");
  });

  it("falls back to id when _id is absent", () => {
    expect(getEntityId({ id: "xyz789" })).toBe("xyz789");
  });

  it("prefers _id over id", () => {
    expect(getEntityId({ _id: "primary", id: "secondary" })).toBe("primary");
  });

  it("stringifies a non-string id", () => {
    expect(getEntityId({ id: 42 })).toBe("42");
  });

  it("returns an empty string for null/undefined/empty entities", () => {
    expect(getEntityId(null)).toBe("");
    expect(getEntityId(undefined)).toBe("");
    expect(getEntityId({})).toBe("");
  });
});

describe("normalizeRefId", () => {
  it("reads _id/id from a populated object", () => {
    expect(normalizeRefId({ _id: "a" })).toBe("a");
    expect(normalizeRefId({ id: "b" })).toBe("b");
  });

  it("accepts a bare string reference", () => {
    expect(normalizeRefId("raw-id")).toBe("raw-id");
  });

  it("stringifies a bare numeric reference", () => {
    expect(normalizeRefId(7)).toBe("7");
  });

  it("returns an empty string when nothing resolves", () => {
    expect(normalizeRefId(null)).toBe("");
    expect(normalizeRefId(undefined)).toBe("");
    expect(normalizeRefId("")).toBe("");
  });
});
