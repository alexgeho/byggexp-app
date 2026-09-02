import {
  handleProjectSwitch,
  handleShiftEnter,
  handleShiftExit,
} from "../shiftAutoTransition";
import { shiftService } from "../../services";
import { resetShiftTransitionQueue } from "../../utils/shiftTransitionQueue";
import {
  announceShiftAutoCompleted,
  announceShiftAutoPaused,
  announceShiftAutoResumed,
  announceShiftAutoStarted,
} from "../../utils/shiftAutoAnnounce";

jest.mock("../../services", () => ({
  shiftService: {
    getCurrent: jest.fn(),
    start: jest.fn(),
    resume: jest.fn(),
    pause: jest.fn(),
    complete: jest.fn(),
  },
}));

jest.mock("../../utils/shiftLocationGuard", () => ({
  assertShiftScheduleAllowsStart: jest.fn(),
}));

// The real conflict helpers are exercised here (only Sentry is stubbed), so the
// scoped/unscoped fallback is covered rather than mocked away.
jest.mock("../../utils/sentry", () => ({
  captureException: jest.fn(),
}));

jest.mock("../../utils/shiftTransitionLog", () => ({
  shouldSkipTransition: jest.fn().mockResolvedValue(false),
}));

jest.mock("../../utils/shiftAutoAnnounce", () => ({
  announceShiftAutoStarted: jest.fn().mockResolvedValue(undefined),
  announceShiftAutoResumed: jest.fn().mockResolvedValue(undefined),
  announceShiftAutoPaused: jest.fn().mockResolvedValue(undefined),
  announceShiftAutoCompleted: jest.fn().mockResolvedValue(undefined),
  isAppInForeground: jest.fn(() => true),
}));

const PROJECT_A = "project-a";
const PROJECT_B = "project-b";

const ACCUMULATED_MS = 2 * 60 * 60 * 1000;

const activeShift = (overrides = {}) => ({
  id: "shift-a",
  projectId: PROJECT_A,
  status: "active",
  storedDurationMs: ACCUMULATED_MS,
  ...overrides,
});

const pausedShift = (overrides = {}) =>
  activeShift({ status: "paused", ...overrides });

const conflictError = () => {
  const error = new Error("Request failed with status code 409");
  error.response = {
    status: 409,
    data: {
      message:
        "A shift for this project already exists today. Resume it instead.",
    },
  };
  return error;
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  resetShiftTransitionQueue();
});

describe("leaving the project area", () => {
  it("pauses the shift instead of completing it, keeping accumulated time", async () => {
    shiftService.getCurrent.mockResolvedValue(activeShift());
    shiftService.pause.mockResolvedValue(
      pausedShift({ storedDurationMs: ACCUMULATED_MS }),
    );

    const result = await handleShiftExit({ projectId: PROJECT_A });

    expect(shiftService.pause).toHaveBeenCalledWith("shift-a", {
      reason: "outside_project_area",
      source: "gps",
    });
    expect(shiftService.complete).not.toHaveBeenCalled();
    expect(result.status).toBe("paused");
    expect(result.storedDurationMs).toBe(ACCUMULATED_MS);
    expect(announceShiftAutoPaused).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the shift is already paused", async () => {
    shiftService.getCurrent.mockResolvedValue(pausedShift());

    const result = await handleShiftExit({ projectId: PROJECT_A });

    expect(result).toBeNull();
    expect(shiftService.pause).not.toHaveBeenCalled();
    expect(shiftService.complete).not.toHaveBeenCalled();
  });

  it("does nothing when there is no open shift", async () => {
    shiftService.getCurrent.mockResolvedValue(null);

    await expect(handleShiftExit({ projectId: PROJECT_A })).resolves.toBeNull();
    expect(shiftService.pause).not.toHaveBeenCalled();
  });
});

describe("returning to the project area", () => {
  it("resumes the same shift and never issues a second start", async () => {
    shiftService.getCurrent.mockResolvedValue(pausedShift());
    shiftService.resume.mockResolvedValue(activeShift());

    const result = await handleShiftEnter({ projectId: PROJECT_A });

    expect(shiftService.resume).toHaveBeenCalledWith("shift-a", {
      source: "gps",
    });
    expect(shiftService.start).not.toHaveBeenCalled();
    expect(result.id).toBe("shift-a");
    expect(result.storedDurationMs).toBe(ACCUMULATED_MS);
    expect(announceShiftAutoResumed).toHaveBeenCalledTimes(1);
  });

  it("starts a new shift when the project has none today", async () => {
    shiftService.getCurrent.mockResolvedValue(null);
    shiftService.start.mockResolvedValue(activeShift({ id: "shift-new" }));

    await handleShiftEnter({ projectId: PROJECT_A });

    expect(shiftService.start).toHaveBeenCalledWith(PROJECT_A);
    expect(shiftService.resume).not.toHaveBeenCalled();
    expect(announceShiftAutoStarted).toHaveBeenCalledTimes(1);
  });

  it("treats a repeated enter event as a no-op while the shift runs", async () => {
    shiftService.getCurrent.mockResolvedValue(activeShift());

    await handleShiftEnter({ projectId: PROJECT_A });
    await handleShiftEnter({ projectId: PROJECT_A });

    expect(shiftService.start).not.toHaveBeenCalled();
    expect(shiftService.resume).not.toHaveBeenCalled();
    expect(announceShiftAutoStarted).not.toHaveBeenCalled();
  });

  it("resumes instead of erroring when the backend reports today's shift already exists", async () => {
    shiftService.getCurrent
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pausedShift());
    shiftService.start.mockRejectedValue(conflictError());
    shiftService.resume.mockResolvedValue(activeShift());

    const result = await handleShiftEnter({ projectId: PROJECT_A });

    expect(shiftService.resume).toHaveBeenCalledWith("shift-a", {
      source: "gps",
    });
    expect(result.status).toBe("active");
    expect(announceShiftAutoResumed).toHaveBeenCalledTimes(1);
  });

  it("falls back to the unscoped lookup when the scoped one hides the paused shift", async () => {
    // Simulates /shifts/current?projectId= filtering paused shifts out.
    shiftService.getCurrent.mockImplementation(async (projectId) =>
      projectId ? null : pausedShift(),
    );
    shiftService.start.mockRejectedValue(conflictError());
    shiftService.resume.mockResolvedValue(activeShift());

    const result = await handleShiftEnter({ projectId: PROJECT_A });

    expect(shiftService.resume).toHaveBeenCalledWith("shift-a", {
      source: "gps",
    });
    expect(result.status).toBe("active");
  });

  it("ignores an unscoped shift that belongs to another project", async () => {
    shiftService.getCurrent.mockImplementation(async (projectId) =>
      projectId ? null : pausedShift({ projectId: PROJECT_B }),
    );
    shiftService.start.mockRejectedValue(conflictError());

    await expect(handleShiftEnter({ projectId: PROJECT_A })).rejects.toThrow(
      "Request failed with status code 409",
    );
    expect(shiftService.resume).not.toHaveBeenCalled();
  });

  it("reports an unrecoverable conflict so it is visible in crash reporting", async () => {
    const { captureException } = require("../../utils/sentry");
    shiftService.getCurrent.mockResolvedValue(null);
    shiftService.start.mockRejectedValue(conflictError());

    await expect(handleShiftEnter({ projectId: PROJECT_A })).rejects.toThrow();

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ reason: "shift_conflict_unrecoverable" }),
    );
  });

  it("propagates errors that are not the duplicate-shift conflict", async () => {
    const failure = new Error("network down");
    shiftService.getCurrent.mockResolvedValue(null);
    shiftService.start.mockRejectedValue(failure);

    await expect(handleShiftEnter({ projectId: PROJECT_A })).rejects.toThrow(
      "network down",
    );
  });
});

describe("concurrent GPS events", () => {
  it("never creates two shifts when enter events overlap", async () => {
    let openShift = null;

    shiftService.getCurrent.mockImplementation(async () => {
      await tick();
      return openShift;
    });
    shiftService.start.mockImplementation(async () => {
      await tick();
      openShift = activeShift({ id: "shift-once" });
      return openShift;
    });

    await Promise.all([
      handleShiftEnter({ projectId: PROJECT_A }),
      handleShiftEnter({ projectId: PROJECT_A }),
      handleShiftEnter({ projectId: PROJECT_A }),
    ]);

    expect(shiftService.start).toHaveBeenCalledTimes(1);
  });

  it("does not let an enter overtake an in-flight exit", async () => {
    const order = [];
    let openShift = activeShift();

    shiftService.getCurrent.mockImplementation(async () => {
      await tick();
      return openShift;
    });
    shiftService.pause.mockImplementation(async () => {
      await tick();
      order.push("pause");
      openShift = pausedShift();
      return openShift;
    });
    shiftService.resume.mockImplementation(async () => {
      await tick();
      order.push("resume");
      openShift = activeShift();
      return openShift;
    });

    await Promise.all([
      handleShiftExit({ projectId: PROJECT_A }),
      handleShiftEnter({ projectId: PROJECT_A }),
    ]);

    expect(order).toEqual(["pause", "resume"]);
    expect(shiftService.start).not.toHaveBeenCalled();
  });
});

describe("switching from project A to project B", () => {
  it("completes A before starting or resuming B", async () => {
    const order = [];

    shiftService.complete.mockImplementation(async () => {
      await tick();
      order.push("complete-a");
      return { id: "shift-a", projectId: PROJECT_A, status: "completed" };
    });
    shiftService.getCurrent.mockImplementation(async () => {
      await tick();
      return null;
    });
    shiftService.start.mockImplementation(async () => {
      await tick();
      order.push("start-b");
      return { id: "shift-b", projectId: PROJECT_B, status: "active" };
    });

    await handleProjectSwitch({
      fromProjectId: PROJECT_A,
      fromShiftId: "shift-a",
      toProjectId: PROJECT_B,
      isWithinTargetArea: true,
    });

    expect(order).toEqual(["complete-a", "start-b"]);
    expect(announceShiftAutoCompleted).toHaveBeenCalledTimes(1);
    expect(announceShiftAutoStarted).toHaveBeenCalledTimes(1);
  });

  it("resumes B's existing shift rather than starting a second one", async () => {
    shiftService.complete.mockResolvedValue({
      id: "shift-a",
      status: "completed",
    });
    shiftService.getCurrent.mockResolvedValue(
      pausedShift({ id: "shift-b", projectId: PROJECT_B }),
    );
    shiftService.resume.mockResolvedValue(
      activeShift({ id: "shift-b", projectId: PROJECT_B }),
    );

    await handleProjectSwitch({
      fromProjectId: PROJECT_A,
      fromShiftId: "shift-a",
      toProjectId: PROJECT_B,
      isWithinTargetArea: true,
    });

    expect(shiftService.resume).toHaveBeenCalledWith("shift-b", {
      source: "gps",
    });
    expect(shiftService.start).not.toHaveBeenCalled();
  });

  it("only completes A when the worker is not inside B's area", async () => {
    shiftService.complete.mockResolvedValue({
      id: "shift-a",
      status: "completed",
    });

    await handleProjectSwitch({
      fromProjectId: PROJECT_A,
      fromShiftId: "shift-a",
      toProjectId: PROJECT_B,
      isWithinTargetArea: false,
    });

    expect(shiftService.complete).toHaveBeenCalledTimes(1);
    expect(shiftService.start).not.toHaveBeenCalled();
    expect(shiftService.resume).not.toHaveBeenCalled();
  });
});
