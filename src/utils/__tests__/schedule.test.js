// Isolate the pure scheduling logic from the i18n stack.
import {
  EVENT_COLORS,
  buildEmployeeItems,
  buildEmployeeOptions,
  buildProjectSpanItem,
  colorForKey,
  daysBetween,
  getTaskDates,
  getWeekNumber,
  normalizeId,
  startOfWeek,
} from "../schedule";

jest.mock("../dateLocale", () => ({ getDateLocale: () => "en-GB" }));

describe("date helpers", () => {
  it("normalizeId handles ids and populated objects", () => {
    expect(normalizeId("abc")).toBe("abc");
    expect(normalizeId({ _id: "x1" })).toBe("x1");
    expect(normalizeId({ id: "y2" })).toBe("y2");
    expect(normalizeId(null)).toBeNull();
  });

  it("startOfWeek returns the Monday of the week", () => {
    // 2026-07-29 is a Wednesday -> Monday is 2026-07-27
    const monday = startOfWeek(new Date(2026, 6, 29));
    expect(monday.getFullYear()).toBe(2026);
    expect(monday.getMonth()).toBe(6);
    expect(monday.getDate()).toBe(27);
  });

  it("daysBetween counts whole days", () => {
    expect(daysBetween(new Date(2026, 6, 1), new Date(2026, 6, 8))).toBe(7);
  });

  it("getWeekNumber matches ISO week", () => {
    expect(getWeekNumber(new Date(2026, 6, 1))).toBe(27);
  });

  it("getTaskDates spans start..due inclusive (+1 day end)", () => {
    const range = getTaskDates({
      startDate: "2026-07-01",
      dueDate: "2026-07-03",
    });
    expect(range).not.toBeNull();
    // exclusive end = 3 days later than the start-of-day start
    expect((range.end - range.start) / (24 * 60 * 60 * 1000)).toBe(3);
  });

  it("getTaskDates returns null for invalid dates", () => {
    expect(
      getTaskDates({ startDate: "nope", dueDate: "2026-07-03" }),
    ).toBeNull();
  });
});

describe("colorForKey", () => {
  it("is deterministic and within the palette", () => {
    const a = colorForKey("Målning");
    expect(EVENT_COLORS).toContain(a);
    expect(colorForKey("Målning")).toBe(a);
  });

  it("spreads different keys across colors", () => {
    const colors = ["Målning", "Rivning", "Svetsning", "Gjutning"].map(
      colorForKey,
    );
    expect(new Set(colors).size).toBeGreaterThan(1);
  });
});

describe("buildEmployeeOptions", () => {
  it("uses populated worker names and resolves ids via the user list", () => {
    const users = [
      { _id: "u2", name: "Erik", role: "worker", profession: "El" },
    ];
    const projects = [
      {
        _id: "p1",
        workers: [{ _id: "u1", name: "Anna", profession: "Snickare" }, "u2"],
      },
    ];
    const options = buildEmployeeOptions(projects, users);
    const byId = Object.fromEntries(options.map((o) => [o.id, o]));
    expect(byId.u1.name).toBe("Anna");
    expect(byId.u2.name).toBe("Erik");
    // sorted by name
    expect(options.map((o) => o.name)).toEqual(["Anna", "Erik"]);
  });
});

describe("buildEmployeeItems", () => {
  const projectMap = {
    p1: {
      _id: "p1",
      name: "Villa",
      location: "Storgatan 12",
      workers: ["u1", "u2"],
    },
  };
  const tasks = [
    {
      _id: "t1",
      taskTitle: "Målning",
      projectId: "p1",
      startDate: "2026-07-02",
      dueDate: "2026-07-06",
    },
  ];

  it("includes a task for a worker on the project with location + assignee count", () => {
    const items = buildEmployeeItems(tasks, projectMap, "u1");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Målning");
    expect(items[0].location).toBe("Storgatan 12");
    expect(items[0].assigneeCount).toBe(2);
    expect(items[0].color).toBe(colorForKey("Målning"));
  });

  it("excludes tasks for a worker not on the project", () => {
    expect(buildEmployeeItems(tasks, projectMap, "u9")).toHaveLength(0);
  });
});

describe("buildProjectSpanItem", () => {
  it("builds one span bar from the project dates", () => {
    const item = buildProjectSpanItem(
      {
        _id: "p1",
        name: "Villa",
        location: "Storgatan 12",
        beginningDate: "2026-07-01",
        endDate: "2026-07-20",
        workers: ["u1"],
      },
      0,
    );
    expect(item.title).toBe("Villa");
    expect(item.assigneeCount).toBe(1);
    expect(item.color).toBe(colorForKey("Villa"));
  });

  it("returns null when the project has no valid dates", () => {
    expect(buildProjectSpanItem({ _id: "p1", name: "Villa" }, 0)).toBeNull();
  });
});
