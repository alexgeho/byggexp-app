import {
  buildBookingItems,
  buildDayBlocks,
  buildDayLeaves,
  buildClientBody,
  clientHasName,
  endTimeFor,
  enumerateDayKeys,
  hoursBetween,
  planBookingChanges,
  shiftEndTime,
  slotAt,
  splitPhone,
  timeOf,
  toDayKey,
  withTime,
} from "../scheduleBooking";

// Isolate the pure booking logic from the i18n stack.
jest.mock("../dateLocale", () => ({ getDateLocale: () => "en-GB" }));

describe("scheduleBooking", () => {
  it("lists every day of a range, weekends optional", () => {
    // 2026-11-13 is a Friday.
    expect(enumerateDayKeys("2026-11-13", "2026-11-16")).toEqual([
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
    ]);
    expect(enumerateDayKeys("2026-11-13", "2026-11-16", true)).toEqual([
      "2026-11-13",
      "2026-11-16",
    ]);
    expect(enumerateDayKeys("2026-11-13", "2026-11-12")).toEqual([]);
  });

  it("does not repeat or skip a day across the DST change", () => {
    expect(enumerateDayKeys("2026-10-24", "2026-10-26")).toEqual([
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
    ]);
  });

  it("handles times", () => {
    expect(hoursBetween("08:00", "10:30")).toBe(2.5);
    expect(hoursBetween("10:00", "08:00")).toBe(0);
    expect(endTimeFor("08:00", 2)).toBe("10:00");
    expect(endTimeFor(undefined, undefined)).toBe("15:00");
    expect(shiftEndTime("08:00", "10:00", "13:15")).toBe("15:15");
    expect(shiftEndTime("08:00", "10:00", "23:00")).toBe("23:45");
    const date = withTime(new Date(2026, 10, 14), "08:45");
    expect(timeOf(date)).toBe("08:45");
    expect(toDayKey(date)).toBe("2026-11-14");
  });

  it("splits a phone number like the user form", () => {
    expect(splitPhone("070-123 45 67")).toEqual({
      phoneAreaCode: 7,
      phoneNumber: 1234567,
    });
    expect(splitPhone("")).toEqual({});
  });

  it("builds a client body without empty or foreign fields", () => {
    const client = {
      clientType: "private",
      firstName: " Anna ",
      lastName: "Berg",
      companyName: "x",
      orgNumber: "",
      contactPerson: "",
      phone: "",
      email: "a@b.se",
      address: "",
      notes: "",
    };
    expect(buildClientBody(client)).toEqual({
      clientType: "private",
      firstName: "Anna",
      lastName: "Berg",
      email: "a@b.se",
    });
    expect(clientHasName(client)).toBe(true);
    expect(clientHasName({ clientType: "company", companyName: " " })).toBe(
      false,
    );
  });

  it("joins a worker's consecutive days of one project into one bar", () => {
    const assignments = [
      {
        _id: "a1",
        userId: "u1",
        projectId: "p1",
        date: "2026-11-16T00:00:00.000Z",
        hours: 2,
      },
      {
        _id: "a2",
        userId: "u1",
        projectId: "p1",
        date: "2026-11-17T00:00:00.000Z",
        hours: 2,
      },
      {
        _id: "a3",
        userId: "u1",
        projectId: "p1",
        date: "2026-11-19T00:00:00.000Z",
        hours: 4,
      },
      {
        _id: "a4",
        userId: "u2",
        projectId: "p1",
        date: "2026-11-16T00:00:00.000Z",
        hours: 2,
      },
      {
        _id: "a5",
        userId: { _id: "u1" },
        projectId: { _id: "p2" },
        date: "2026-11-16T00:00:00.000Z",
      },
    ];
    const items = buildBookingItems(
      assignments,
      { p1: { name: "Kök" }, p2: { name: "Bad" } },
      "u1",
    );
    expect(items.map((item) => [item.title, item.assignmentIds])).toEqual([
      ["Kök", ["a1", "a2"]],
      ["Kök", ["a3"]],
      ["Bad", ["a5"]],
    ]);
    const first = items[0];
    expect(first.type).toBe("booking");
    expect(first.timeLabel).toBe("2 h");
    expect(toDayKey(new Date(first.start))).toBe("2026-11-16");
    expect(toDayKey(new Date(first.end))).toBe("2026-11-18");
    expect(items[2].timeLabel).toBe("8 h");
  });

  it("plans only the difference when a booking is edited", () => {
    const existing = [
      {
        _id: "a1",
        userId: "u1",
        date: "2026-11-16T00:00:00.000Z",
        startTime: "08:00",
        hours: 2,
      },
      {
        _id: "a2",
        userId: "u1",
        date: "2026-11-17T00:00:00.000Z",
        startTime: "08:00",
        hours: 2,
      },
      {
        _id: "a3",
        userId: "u2",
        date: "2026-11-16T00:00:00.000Z",
        startTime: "08:00",
        hours: 2,
      },
    ];
    const plan = planBookingChanges({
      existing,
      workerIds: ["u1", "u3"],
      days: ["2026-11-16"],
      from: "2026-11-16",
      to: "2026-11-16",
      start: "09:00",
      hours: 2,
      note: "",
    });
    expect(plan.toDelete.map((a) => a._id)).toEqual(["a2", "a3"]);
    expect(plan.toUpdate.map((a) => a._id)).toEqual(["a1"]);
    expect(plan.toCreate).toEqual([{ userId: "u3", date: "2026-11-16" }]);
  });

  it("leaves an unchanged booking alone", () => {
    const plan = planBookingChanges({
      existing: [
        {
          _id: "a1",
          userId: "u1",
          date: "2026-11-16T00:00:00.000Z",
          startTime: "08:00",
          hours: 2,
          note: "x",
        },
      ],
      workerIds: ["u1"],
      days: ["2026-11-16"],
      from: "2026-11-16",
      to: "2026-11-16",
      start: "08:00",
      hours: 2,
      note: "x",
    });
    expect(plan).toEqual({ toCreate: [], toDelete: [], toUpdate: [] });
  });

  it("turns a tap on the hour grid into a one-hour slot", () => {
    // 48 px per hour, the grid starts at 06:00.
    expect(slotAt(0, 48)).toEqual({ start: "06:00", end: "07:00" });
    expect(slotAt(48 * 2 + 30, 48)).toEqual({ start: "08:30", end: "09:30" });
    expect(slotAt(99999, 48)).toEqual({ start: "19:00", end: "20:00" });
  });

  it("lays a day's bookings side by side and flags overbooking", () => {
    const day = "2026-11-16T00:00:00.000Z";
    const blocks = buildDayBlocks(
      [
        {
          _id: "a1",
          userId: "u1",
          projectId: "p1",
          date: day,
          startTime: "08:00",
          hours: 6,
        },
        {
          _id: "a2",
          userId: "u1",
          projectId: "p2",
          date: day,
          startTime: "14:00",
          hours: 4,
        },
        {
          _id: "a3",
          userId: "u2",
          projectId: "p1",
          date: day,
          startTime: "09:00",
          hours: 2,
        },
        {
          _id: "a4",
          userId: "u3",
          projectId: "p1",
          date: day,
          startTime: "09:00",
          hours: 2,
        },
      ],
      ["2026-11-16", "2026-11-17"],
      new Set(["u3"]),
    );
    expect(blocks["2026-11-17"]).toEqual([]);
    expect(
      blocks["2026-11-16"].map((b) => [
        b.id,
        b.start,
        b.end,
        b.lane,
        b.lanes,
        b.overbooked,
      ]),
    ).toEqual([
      ["a1", 480, 840, 0, 2, true],
      ["a3", 540, 660, 1, 2, false],
      ["a2", 840, 1080, 0, 2, true],
    ]);
  });

  it("shows approved absences on their days", () => {
    const leaves = buildDayLeaves(
      [
        {
          userId: "u1",
          status: "approved",
          type: "sick",
          startDate: "2026-11-16T00:00:00.000Z",
          endDate: "2026-11-17T00:00:00.000Z",
        },
        {
          userId: "u2",
          status: "pending",
          startDate: "2026-11-16T00:00:00.000Z",
        },
      ],
      ["2026-11-15", "2026-11-16", "2026-11-17"],
    );
    expect(leaves).toEqual({
      "2026-11-15": [],
      "2026-11-16": [{ userId: "u1", type: "sick" }],
      "2026-11-17": [{ userId: "u1", type: "sick" }],
    });
  });
});
