import { resolveNewestTimestamp, sortByNewest } from "../sortByNewest";

describe("resolveNewestTimestamp", () => {
  it("returns the first parseable timestamp", () => {
    const iso = "2026-07-01T00:00:00.000Z";
    expect(resolveNewestTimestamp(iso)).toBe(new Date(iso).getTime());
  });

  it("skips falsy and invalid values", () => {
    const iso = "2026-07-01T00:00:00.000Z";
    expect(resolveNewestTimestamp(null, "", "not-a-date", iso)).toBe(
      new Date(iso).getTime(),
    );
  });

  it("returns 0 when nothing is parseable", () => {
    expect(resolveNewestTimestamp(null, undefined, "nope")).toBe(0);
    expect(resolveNewestTimestamp()).toBe(0);
  });
});

describe("sortByNewest", () => {
  it("orders items newest-first by their comparable value", () => {
    const items = [
      { id: "old", date: "2026-01-01" },
      { id: "new", date: "2026-12-31" },
      { id: "mid", date: "2026-06-15" },
    ];
    const sorted = sortByNewest(items, (item) => item.date);
    expect(sorted.map((item) => item.id)).toEqual(["new", "mid", "old"]);
  });

  it("uses the first available candidate field as the sort key", () => {
    const items = [
      // createdAt present -> used (Jan), updatedAt ignored
      { id: "a", createdAt: "2026-01-01", updatedAt: "2026-12-01" },
      // createdAt missing -> falls back to updatedAt (Jun)
      { id: "b", createdAt: null, updatedAt: "2026-06-01" },
    ];
    const sorted = sortByNewest(items, (item) => [
      item.createdAt,
      item.updatedAt,
    ]);
    // b's fallback key (Jun) is newer than a's primary key (Jan)
    expect(sorted.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the original array", () => {
    const items = [
      { id: "a", date: "2026-01-01" },
      { id: "b", date: "2026-02-01" },
    ];
    const snapshot = [...items];
    sortByNewest(items, (item) => item.date);
    expect(items).toEqual(snapshot);
  });

  it("keeps undated items last", () => {
    const items = [
      { id: "none", date: null },
      { id: "dated", date: "2026-02-01" },
    ];
    const sorted = sortByNewest(items, (item) => item.date);
    expect(sorted.map((item) => item.id)).toEqual(["dated", "none"]);
  });
});
