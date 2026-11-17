import { saveBooking } from "../booking.service";
import { assignmentService } from "../assignment.service";
import { projectService } from "../project.service";

// Isolate the booking logic from the i18n stack.
jest.mock("../../utils/dateLocale", () => ({ getDateLocale: () => "en-GB" }));
jest.mock("../assignment.service", () => ({
  assignmentService: {
    create: jest.fn(() => Promise.resolve({})),
    update: jest.fn(() => Promise.resolve({})),
    remove: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock("../client.service", () => ({ clientService: {} }));
jest.mock("../project.service", () => ({
  projectService: {
    create: jest.fn(() => Promise.resolve({ _id: "p9" })),
    update: jest.fn(() => Promise.resolve({})),
  },
}));

const loose = [
  {
    _id: "a1",
    userId: "u1",
    projectId: null,
    date: "2026-11-25T00:00:00.000Z",
  },
  {
    _id: "a2",
    userId: "u1",
    projectId: null,
    date: "2026-11-26T00:00:00.000Z",
  },
];
const base = {
  title: "Order",
  from: "2026-11-25",
  to: "2026-11-26",
  start: "07:00",
  hours: 8,
  workerIds: ["u1"],
};

describe("saveBooking — a booking made without an order", () => {
  beforeEach(() => jest.clearAllMocks());

  it("makes the order and moves the bookings onto it, booking nothing twice", async () => {
    const result = await saveBooking({ ...base, loose });
    expect(result.projectId).toBe("p9");
    expect(projectService.create).toHaveBeenCalledTimes(1);
    expect(assignmentService.create).not.toHaveBeenCalled();
    expect(assignmentService.remove).not.toHaveBeenCalled();
    expect(assignmentService.update.mock.calls).toEqual([
      ["a1", { projectId: "p9", startTime: "07:00", hours: 8, note: "" }],
      ["a2", { projectId: "p9", startTime: "07:00", hours: 8, note: "" }],
    ]);
  });

  it("moves them onto an order picked in the form", async () => {
    await saveBooking({ ...base, loose, existingOrder: { _id: "p1" } });
    expect(projectService.create).not.toHaveBeenCalled();
    expect(assignmentService.update).toHaveBeenCalledWith(
      "a2",
      expect.objectContaining({ projectId: "p1" }),
    );
  });

  it("a shorter range drops the day left out, a new person is booked", async () => {
    await saveBooking({
      ...base,
      loose,
      to: "2026-11-25",
      workerIds: ["u1", "u2"],
    });
    expect(assignmentService.remove).toHaveBeenCalledWith("a2");
    expect(assignmentService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u2",
        projectId: "p9",
        date: "2026-11-25",
      }),
    );
  });

  it("a plain new booking still books every day", async () => {
    await saveBooking(base);
    expect(assignmentService.create).toHaveBeenCalledTimes(2);
    expect(assignmentService.update).not.toHaveBeenCalled();
  });
});
