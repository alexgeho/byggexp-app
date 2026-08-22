import {
  completeShiftSerialized,
  pauseShiftSerialized,
  resumeShiftWithGuards,
  startShiftWithLocationGuard,
} from "../shiftLocationGuard";
import {
  handleShiftEnter,
  handleShiftExit,
} from "../../tasks/shiftAutoTransition";
import { shiftService } from "../../services";
import { resetShiftTransitionQueue } from "../shiftTransitionQueue";

// The worker taps Play or Pause at the same moment the geofence monitor acts on
// its own. Every mutation — manual and automatic, including the conflict
// recovery paths — has to pass through the single transition queue, so the two
// can never interleave and leave the shift in a state neither side expected.

jest.mock("../../services", () => ({
  shiftService: {
    getCurrent: jest.fn(),
    start: jest.fn(),
    resume: jest.fn(),
    pause: jest.fn(),
    complete: jest.fn(),
  },
}));

jest.mock("../shiftSchedule", () => ({
  getShiftScheduleWindow: jest.fn(() => ({ enforced: false, canStart: true })),
  getStartWindowErrorMessage: jest.fn(() => "outside window"),
}));

jest.mock("../sentry", () => ({ captureException: jest.fn() }));
jest.mock("../shiftAutoAnnounce", () => ({
  announceShiftAutoStarted: jest.fn().mockResolvedValue(undefined),
  announceShiftAutoResumed: jest.fn().mockResolvedValue(undefined),
  announceShiftAutoPaused: jest.fn().mockResolvedValue(undefined),
  announceShiftAutoCompleted: jest.fn().mockResolvedValue(undefined),
  isAppInForeground: jest.fn(() => true),
}));
jest.mock("../shiftTransitionLog", () => ({
  shouldSkipTransition: jest.fn().mockResolvedValue(false),
}));

jest.mock("expo-device", () => ({ isDevice: false }));
jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: "granted",
  })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 0, longitude: 0 },
  })),
  geocodeAsync: jest.fn(async () => []),
  Accuracy: { Balanced: 3 },
}));
jest.mock("../../services/project.service", () => ({
  __esModule: true,
  default: { searchAddressSuggestions: jest.fn(async () => []) },
}));

const PROJECT_ID = "project-a";
const PROJECT = { _id: PROJECT_ID, id: PROJECT_ID };
const SHIFT_ID = "shift-a";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const stateError = (message) => {
  const error = new Error("Request failed with status code 400");
  error.response = { status: 400, data: { message } };
  return error;
};

// Minimal server model: rejects transitions that do not match the shift state,
// exactly as the backend does.
const createFakeBackend = (initialStatus) => {
  const shift = { id: SHIFT_ID, projectId: PROJECT_ID, status: initialStatus };
  const calls = [];

  shiftService.getCurrent.mockImplementation(async () => {
    await tick();
    return { ...shift };
  });

  shiftService.resume.mockImplementation(async () => {
    await tick();
    if (shift.status !== "paused") {
      throw stateError("Only a paused shift can be resumed.");
    }
    shift.status = "active";
    calls.push("resume");
    return { ...shift };
  });

  shiftService.pause.mockImplementation(async () => {
    await tick();
    if (shift.status !== "active") {
      throw stateError("Only an active shift can be paused.");
    }
    shift.status = "paused";
    calls.push("pause");
    return { ...shift };
  });

  shiftService.complete.mockImplementation(async () => {
    await tick();
    shift.status = "completed";
    calls.push("complete");
    return { ...shift };
  });

  return { shift, calls };
};

beforeEach(() => {
  jest.clearAllMocks();
  resetShiftTransitionQueue();
});

describe("manual Play racing the automatic re-entry", () => {
  it("resumes exactly once and neither side sees an error", async () => {
    const backend = createFakeBackend("paused");

    const [manual] = await Promise.all([
      resumeShiftWithGuards({
        shiftId: SHIFT_ID,
        project: PROJECT,
        skipLocationCheck: true,
      }),
      handleShiftEnter({ projectId: PROJECT_ID }),
    ]);

    expect(backend.calls.filter((call) => call === "resume")).toHaveLength(1);
    expect(backend.shift.status).toBe("active");
    expect(manual.status).toBe("active");
    expect(shiftService.start).not.toHaveBeenCalled();
  });

  it("holds regardless of which side reaches the queue first", async () => {
    const backend = createFakeBackend("paused");

    const [, manual] = await Promise.all([
      handleShiftEnter({ projectId: PROJECT_ID }),
      resumeShiftWithGuards({
        shiftId: SHIFT_ID,
        project: PROJECT,
        skipLocationCheck: true,
      }),
    ]);

    expect(backend.calls.filter((call) => call === "resume")).toHaveLength(1);
    expect(manual.status).toBe("active");
  });
});

describe("manual Pause racing the automatic exit", () => {
  it("pauses exactly once and neither side sees an error", async () => {
    const backend = createFakeBackend("active");

    const [manual] = await Promise.all([
      pauseShiftSerialized({ shiftId: SHIFT_ID, projectId: PROJECT_ID }),
      handleShiftExit({ projectId: PROJECT_ID }),
    ]);

    expect(backend.calls.filter((call) => call === "pause")).toHaveLength(1);
    expect(backend.shift.status).toBe("paused");
    expect(manual.status).toBe("paused");
  });

  it("holds regardless of which side reaches the queue first", async () => {
    const backend = createFakeBackend("active");

    const [, manual] = await Promise.all([
      handleShiftExit({ projectId: PROJECT_ID }),
      pauseShiftSerialized({ shiftId: SHIFT_ID, projectId: PROJECT_ID }),
    ]);

    expect(backend.calls.filter((call) => call === "pause")).toHaveLength(1);
    expect(manual.status).toBe("paused");
  });
});

describe("queue coverage of the remaining mutations", () => {
  it("keeps the conflict recovery for start inside the same queued slot", async () => {
    const order = [];

    shiftService.start.mockImplementation(async () => {
      await tick();
      order.push("start");
      throw stateError("A shift for this project already exists today.");
    });
    shiftService.getCurrent.mockImplementation(async () => {
      await tick();
      order.push("getCurrent");
      return { id: SHIFT_ID, projectId: PROJECT_ID, status: "paused" };
    });
    shiftService.resume.mockImplementation(async () => {
      await tick();
      order.push("resume");
      return { id: SHIFT_ID, projectId: PROJECT_ID, status: "active" };
    });
    shiftService.pause.mockImplementation(async () => {
      await tick();
      order.push("auto-pause");
      return { id: SHIFT_ID, projectId: PROJECT_ID, status: "paused" };
    });

    await Promise.all([
      startShiftWithLocationGuard({
        projectId: PROJECT_ID,
        project: PROJECT,
        skipLocationCheck: true,
      }),
      handleShiftExit({ projectId: PROJECT_ID }),
    ]);

    // The recovery must not be split by the concurrent automatic exit.
    const startIndex = order.indexOf("start");
    const resumeIndex = order.indexOf("resume");
    const autoPauseIndex = order.indexOf("auto-pause");

    expect(startIndex).toBeGreaterThanOrEqual(0);
    expect(resumeIndex).toBeGreaterThan(startIndex);
    expect(autoPauseIndex === -1 || autoPauseIndex > resumeIndex).toBe(true);
  });

  it("serializes a manual complete against an automatic exit", async () => {
    const backend = createFakeBackend("active");

    await Promise.all([
      completeShiftSerialized(SHIFT_ID),
      handleShiftExit({ projectId: PROJECT_ID }),
    ]);

    expect(backend.calls).toContain("complete");
    // Once completed the shift is no longer active, so the exit must not pause it.
    expect(backend.calls.filter((call) => call === "pause")).toHaveLength(0);
    expect(backend.shift.status).toBe("completed");
  });

  it("rejects a pause that cannot be reconciled", async () => {
    shiftService.pause.mockRejectedValue(
      stateError("Only an active shift can be paused."),
    );
    shiftService.getCurrent.mockResolvedValue({
      id: SHIFT_ID,
      projectId: PROJECT_ID,
      status: "completed",
    });

    await expect(
      pauseShiftSerialized({ shiftId: SHIFT_ID, projectId: PROJECT_ID }),
    ).rejects.toThrow("Request failed with status code 400");
  });
});
