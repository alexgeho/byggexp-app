import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { calculateDistanceMeters } from "../../utils/shiftLocationGuard";
import { handleShiftEnter, handleShiftExit } from "../shiftAutoTransition";
import { SHIFT_GEOFENCE_TASK } from "../shiftGeofenceTask";
import {
  SHIFT_LOCATION_TASK,
  SHIFT_LOCATION_INSIDE_KEY,
  SHIFT_LOCATION_TARGET_KEY,
} from "../shiftLocationUpdatesTask";

// Both background monitors must drive the same transition handlers as the
// foreground monitor — that shared implementation is what keeps Android
// (foreground-service location stream) and iOS (native region monitoring)
// behaving identically.

jest.mock("expo-task-manager", () => ({ defineTask: jest.fn() }));

jest.mock("expo-location", () => ({
  GeofencingEventType: { Enter: 1, Exit: 2 },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/shiftLocationGuard", () => ({
  calculateDistanceMeters: jest.fn(),
  assertShiftScheduleAllowsStart: jest.fn(),
}));

jest.mock("../shiftAutoTransition", () => ({
  SHIFT_ENTER: "enter",
  SHIFT_EXIT: "exit",
  handleShiftEnter: jest.fn().mockResolvedValue(null),
  handleShiftExit: jest.fn().mockResolvedValue(null),
  isDuplicateTransition: jest.fn().mockResolvedValue(false),
}));

jest.mock("../../utils/shiftExitAutoCompleteEvents", () => ({
  emitShiftLocationCheckError: jest.fn().mockResolvedValue(undefined),
}));

const PROJECT_ID = "project-a";

// Both task modules register their callback at import time. Snapshot the
// registrations now, before any clearAllMocks() wipes the recorded calls.
const REGISTERED_TASKS = new Map(TaskManager.defineTask.mock.calls);

const getRegisteredTask = (name) => REGISTERED_TASKS.get(name);

const ANDROID_TARGET = {
  projectId: PROJECT_ID,
  latitude: 59.3293,
  longitude: 18.0686,
  radius: 120,
};

const mockAndroidStorage = ({ previouslyInside }) => {
  AsyncStorage.getItem.mockImplementation(async (key) => {
    if (key === SHIFT_LOCATION_TARGET_KEY) {
      return JSON.stringify(ANDROID_TARGET);
    }

    if (key === SHIFT_LOCATION_INSIDE_KEY) {
      if (previouslyInside === null) {
        return null;
      }

      return previouslyInside ? "1" : "0";
    }

    return null;
  });
};

const androidLocationEvent = () => ({
  data: {
    locations: [{ coords: { latitude: 59.3293, longitude: 18.0686 } }],
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("iOS region monitoring task", () => {
  it("routes an exit event to the shared exit handler", async () => {
    const task = getRegisteredTask(SHIFT_GEOFENCE_TASK);

    await task({
      data: {
        eventType: Location.GeofencingEventType.Exit,
        region: { identifier: PROJECT_ID },
      },
    });

    expect(handleShiftExit).toHaveBeenCalledWith({ projectId: PROJECT_ID });
    expect(handleShiftEnter).not.toHaveBeenCalled();
  });

  it("routes an enter event to the shared enter handler", async () => {
    const task = getRegisteredTask(SHIFT_GEOFENCE_TASK);

    await task({
      data: {
        eventType: Location.GeofencingEventType.Enter,
        region: { identifier: PROJECT_ID },
      },
    });

    expect(handleShiftEnter).toHaveBeenCalledWith({ projectId: PROJECT_ID });
    expect(handleShiftExit).not.toHaveBeenCalled();
  });
});

describe("Android foreground-service location task", () => {
  it("routes crossing out of the radius to the same exit handler", async () => {
    mockAndroidStorage({ previouslyInside: true });
    calculateDistanceMeters.mockReturnValue(900);

    const task = getRegisteredTask(SHIFT_LOCATION_TASK);
    await task(androidLocationEvent());

    expect(handleShiftExit).toHaveBeenCalledWith({ projectId: PROJECT_ID });
    expect(handleShiftEnter).not.toHaveBeenCalled();
  });

  it("routes crossing into the radius to the same enter handler", async () => {
    mockAndroidStorage({ previouslyInside: false });
    calculateDistanceMeters.mockReturnValue(10);

    const task = getRegisteredTask(SHIFT_LOCATION_TASK);
    await task(androidLocationEvent());

    expect(handleShiftEnter).toHaveBeenCalledWith({ projectId: PROJECT_ID });
    expect(handleShiftExit).not.toHaveBeenCalled();
  });

  it("ignores a reading that does not change the inside/outside state", async () => {
    mockAndroidStorage({ previouslyInside: true });
    calculateDistanceMeters.mockReturnValue(10);

    const task = getRegisteredTask(SHIFT_LOCATION_TASK);
    await task(androidLocationEvent());

    expect(handleShiftEnter).not.toHaveBeenCalled();
    expect(handleShiftExit).not.toHaveBeenCalled();
  });

  it("acts on the very first fix so a restart re-syncs the shift", async () => {
    mockAndroidStorage({ previouslyInside: null });
    calculateDistanceMeters.mockReturnValue(10);

    const task = getRegisteredTask(SHIFT_LOCATION_TASK);
    await task(androidLocationEvent());

    expect(handleShiftEnter).toHaveBeenCalledWith({ projectId: PROJECT_ID });
  });
});
