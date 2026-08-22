import { resumeShiftWithGuards } from "../shiftLocationGuard";
import { shiftService } from "../../services";
import { resetShiftTransitionQueue } from "../shiftTransitionQueue";

// Manual Play races the geofence monitor: as soon as the worker is back inside
// the area the monitor resumes the shift on its own, so a tap that started from
// a "paused" screen can reach the backend after the shift is already running.
// The backend then rejects the resume, which used to surface as an error the
// user could do nothing about.

jest.mock("../../services", () => ({
  shiftService: {
    getCurrent: jest.fn(),
    resume: jest.fn(),
    start: jest.fn(),
  },
}));

jest.mock("../shiftSchedule", () => ({
  getShiftScheduleWindow: jest.fn(() => ({ enforced: false, canStart: true })),
  getStartWindowErrorMessage: jest.fn(() => "outside window"),
}));

jest.mock("../sentry", () => ({ captureException: jest.fn() }));

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

const PROJECT = { _id: "project-a", id: "project-a" };
const SHIFT_ID = "shift-a";

const notPausedError = () => {
  const error = new Error("Request failed with status code 400");
  error.response = {
    status: 400,
    data: { message: "Only a paused shift can be resumed." },
  };
  return error;
};

beforeEach(() => {
  jest.clearAllMocks();
  resetShiftTransitionQueue();
});

it("resumes normally when the shift is still paused", async () => {
  const resumed = { id: SHIFT_ID, projectId: "project-a", status: "active" };
  shiftService.resume.mockResolvedValue(resumed);

  await expect(
    resumeShiftWithGuards({
      shiftId: SHIFT_ID,
      project: PROJECT,
      skipLocationCheck: true,
    }),
  ).resolves.toEqual(resumed);
});

it("reconciles instead of erroring when the monitor already resumed the shift", async () => {
  const running = { id: SHIFT_ID, projectId: "project-a", status: "active" };
  shiftService.resume.mockRejectedValue(notPausedError());
  shiftService.getCurrent.mockResolvedValue(running);

  await expect(
    resumeShiftWithGuards({
      shiftId: SHIFT_ID,
      project: PROJECT,
      skipLocationCheck: true,
    }),
  ).resolves.toEqual(running);
});

it("still reports the error when the shift is not running either", async () => {
  shiftService.resume.mockRejectedValue(notPausedError());
  shiftService.getCurrent.mockResolvedValue({
    id: SHIFT_ID,
    projectId: "project-a",
    status: "completed",
  });

  await expect(
    resumeShiftWithGuards({
      shiftId: SHIFT_ID,
      project: PROJECT,
      skipLocationCheck: true,
    }),
  ).rejects.toThrow("Request failed with status code 400");
});

it("does not swallow unrelated failures", async () => {
  shiftService.resume.mockRejectedValue(new Error("network down"));

  await expect(
    resumeShiftWithGuards({
      shiftId: SHIFT_ID,
      project: PROJECT,
      skipLocationCheck: true,
    }),
  ).rejects.toThrow("network down");
  expect(shiftService.getCurrent).not.toHaveBeenCalled();
});

it("requires a shift id", async () => {
  await expect(resumeShiftWithGuards({ project: PROJECT })).rejects.toThrow(
    "Shift is required to resume.",
  );
});
