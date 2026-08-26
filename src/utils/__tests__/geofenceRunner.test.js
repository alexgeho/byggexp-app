import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  SHIFT_LOCATION_INSIDE_KEY,
  readGeofenceState,
  runGeofenceObservation,
} from "../geofenceRunner";
import {
  GEOFENCE_INSIDE,
  GEOFENCE_OUTSIDE,
  GEOFENCE_UNKNOWN,
  MAX_TRANSITION_ATTEMPTS,
  TRANSITION_RETRY_BACKOFF_MS,
} from "../geofenceEvaluation";
import {
  handleShiftEnter,
  handleShiftExit,
  isDuplicateTransition,
} from "../../tasks/shiftAutoTransition";
import { reportTransitionExhausted } from "../shiftGeofenceDebug";

// End-to-end for one location reading: evaluation, transaction, retry.
//
// The rules being protected here are the ones a network blip or a coarse indoor
// fix used to break: `inside` must not move until the backend accepted the
// change, and a fix too imprecise to judge must not make the monitor look alive.

jest.mock("@react-native-async-storage/async-storage", () => {
  let store = {};

  return {
    __reset: () => {
      store = {};
    },
    getItem: jest.fn(async (key) => store[key] ?? null),
    setItem: jest.fn(async (key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(async (key) => {
      delete store[key];
    }),
  };
});

jest.mock("../../tasks/shiftAutoTransition", () => ({
  SHIFT_ENTER: "enter",
  SHIFT_EXIT: "exit",
  handleShiftEnter: jest.fn().mockResolvedValue(null),
  handleShiftExit: jest.fn().mockResolvedValue(null),
  isDuplicateTransition: jest.fn().mockResolvedValue(false),
}));

jest.mock("../shiftGeofenceDebug", () => ({
  logGeofenceFix: jest.fn(),
  reportTransitionExhausted: jest.fn(),
  reportBackgroundMonitorStale: jest.fn(),
}));

const PROJECT_ID = "project-a";
const RADIUS = 500;
const T0 = 1_700_000_000_000;

// Distances chosen to be unambiguous under the accuracy band.
const insideFix = { distanceMeters: 40, accuracyMeters: 20 };
const outsideFix = { distanceMeters: 900, accuracyMeters: 20 };
const coarseFix = { distanceMeters: 900, accuracyMeters: 900 };

const observe = (fix, nowMs) =>
  runGeofenceObservation({
    ...fix,
    radiusMeters: RADIUS,
    projectId: PROJECT_ID,
    nowMs,
  });

beforeEach(() => {
  AsyncStorage.__reset();
  jest.clearAllMocks();
  isDuplicateTransition.mockResolvedValue(false);
  handleShiftEnter.mockResolvedValue(null);
  handleShiftExit.mockResolvedValue(null);
});

describe("a fix too coarse to judge", () => {
  it("does not mark the monitor as having produced a usable fix", async () => {
    const { verdict } = await observe(coarseFix, T0);
    const state = await readGeofenceState();

    expect(verdict).toBe(GEOFENCE_UNKNOWN);
    expect(state.lastCallbackAt).toBe(T0);
    expect(state.lastUsableFixAt).toBeNull();
  });

  it("records the callback so a dead service is distinguishable from a blind one", async () => {
    await observe(insideFix, T0);
    await observe(insideFix, T0 + 1000);
    await observe(coarseFix, T0 + 2000);

    const state = await readGeofenceState();

    expect(state.lastCallbackAt).toBe(T0 + 2000);
    expect(state.lastUsableFixAt).toBe(T0 + 1000);
  });
});

describe("a confirmed transition", () => {
  it("needs two agreeing readings and then dispatches once", async () => {
    await observe(insideFix, T0);
    expect(handleShiftEnter).not.toHaveBeenCalled();

    const { transition } = await observe(insideFix, T0 + 1000);

    expect(transition).toBe(GEOFENCE_INSIDE);
    expect(handleShiftEnter).toHaveBeenCalledTimes(1);
    expect(handleShiftEnter).toHaveBeenCalledWith({ projectId: PROJECT_ID });
  });

  it("commits inside only after the backend accepted it", async () => {
    await observe(insideFix, T0);
    await observe(insideFix, T0 + 1000);

    const state = await readGeofenceState();

    expect(state.inside).toBe(true);
    expect(state.pendingTransition).toBeNull();
  });
});

describe("the backend call fails", () => {
  const arriveInside = async () => {
    await observe(insideFix, T0);
    await observe(insideFix, T0 + 1000);
    jest.clearAllMocks();
  };

  it("leaves inside untouched and queues a retry", async () => {
    await arriveInside();
    handleShiftExit.mockRejectedValue(new Error("network down"));

    await observe(outsideFix, T0 + 10_000);
    await observe(outsideFix, T0 + 11_000);

    const state = await readGeofenceState();

    expect(state.inside).toBe(true);
    expect(state.pendingTransition).toMatchObject({
      direction: GEOFENCE_OUTSIDE,
      attempts: 1,
    });
    expect(state.pendingTransition.nextAttemptAt).toBe(
      T0 + 11_000 + TRANSITION_RETRY_BACKOFF_MS[0],
    );
  });

  it("retries once the backoff has passed and then commits", async () => {
    await arriveInside();
    handleShiftExit.mockRejectedValueOnce(new Error("network down"));

    await observe(outsideFix, T0 + 10_000);
    await observe(outsideFix, T0 + 11_000);

    const dueAt = T0 + 11_000 + TRANSITION_RETRY_BACKOFF_MS[0];
    await observe(coarseFix, dueAt);

    const state = await readGeofenceState();

    expect(handleShiftExit).toHaveBeenCalledTimes(2);
    expect(state.inside).toBe(false);
    expect(state.pendingTransition).toBeNull();
  });

  it("does not retry before the backoff has passed", async () => {
    await arriveInside();
    handleShiftExit.mockRejectedValue(new Error("network down"));

    await observe(outsideFix, T0 + 10_000);
    await observe(outsideFix, T0 + 11_000);
    jest.clearAllMocks();

    await observe(coarseFix, T0 + 12_000);

    expect(handleShiftExit).not.toHaveBeenCalled();
  });

  it("bypasses the de-dupe guard on a retry", async () => {
    await arriveInside();
    handleShiftExit.mockRejectedValueOnce(new Error("network down"));
    await observe(outsideFix, T0 + 10_000);
    await observe(outsideFix, T0 + 11_000);

    // The guard would otherwise swallow the retry inside its own window.
    isDuplicateTransition.mockResolvedValue(true);
    await observe(coarseFix, T0 + 11_000 + TRANSITION_RETRY_BACKOFF_MS[0]);

    expect((await readGeofenceState()).inside).toBe(false);
  });

  it("gives up after the attempt limit and reports it", async () => {
    await arriveInside();
    handleShiftExit.mockRejectedValue(new Error("network down"));

    await observe(outsideFix, T0 + 10_000);
    let now = T0 + 11_000;
    await observe(outsideFix, now);

    for (let attempt = 0; attempt < MAX_TRANSITION_ATTEMPTS; attempt += 1) {
      now +=
        TRANSITION_RETRY_BACKOFF_MS[TRANSITION_RETRY_BACKOFF_MS.length - 1];
      await observe(coarseFix, now);
    }

    const state = await readGeofenceState();

    expect(state.pendingTransition).toBeNull();
    expect(reportTransitionExhausted).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: GEOFENCE_OUTSIDE,
        projectId: PROJECT_ID,
        attempts: MAX_TRANSITION_ATTEMPTS,
      }),
    );
  });

  it("drops the pending transition when the worker comes back first", async () => {
    await arriveInside();
    handleShiftExit.mockRejectedValue(new Error("network down"));

    await observe(outsideFix, T0 + 10_000);
    await observe(outsideFix, T0 + 11_000);
    expect((await readGeofenceState()).pendingTransition).not.toBeNull();

    await observe(insideFix, T0 + 12_000);

    const state = await readGeofenceState();

    expect(state.pendingTransition).toBeNull();
    expect(state.inside).toBe(true);
  });
});

describe("state shared between the two monitors", () => {
  it("counts confirmations across callers, whichever one observed the fix", async () => {
    // First reading arrives from the background task, second from the in-app
    // monitor after it took over: together they still confirm one transition.
    await observe(insideFix, T0);
    const { transition } = await observe(insideFix, T0 + 1000);

    expect(transition).toBe(GEOFENCE_INSIDE);
    expect(handleShiftEnter).toHaveBeenCalledTimes(1);
  });

  it("stays put while readings disagree", async () => {
    await observe(insideFix, T0);
    await observe(outsideFix, T0 + 1000);
    await observe(insideFix, T0 + 2000);

    expect(handleShiftEnter).not.toHaveBeenCalled();
    expect(handleShiftExit).not.toHaveBeenCalled();
    expect((await readGeofenceState()).inside).toBeNull();
  });
});

it("persists nothing but the evaluated state under its own key", async () => {
  await observe(insideFix, T0);

  const raw = await AsyncStorage.getItem(SHIFT_LOCATION_INSIDE_KEY);

  expect(JSON.parse(raw)).toMatchObject({
    pendingVerdict: GEOFENCE_INSIDE,
    pendingCount: 1,
  });
});
