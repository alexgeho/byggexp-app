import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  SHIFT_LOCATION_INSIDE_KEY,
  readGeofenceState,
  runGeofenceObservation,
} from "../geofenceRunner";
import {
  GEOFENCE_INSIDE,
  GEOFENCE_OUTSIDE,
  GEOFENCE_SOURCE_BACKGROUND,
  GEOFENCE_UNKNOWN,
  MAX_TRANSITION_ATTEMPTS,
  TRANSITION_RETRY_BACKOFF_MS,
} from "../geofenceEvaluation";
import {
  handleShiftEnter,
  handleShiftExit,
} from "../../tasks/shiftAutoTransition";
import { reportTransitionExhausted } from "../shiftGeofenceDebug";
import { resetObservationQueue } from "../observationQueue";

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
  resetObservationQueue();
  // mockReset, not mockClear: clearAllMocks leaves unconsumed *Once queues in
  // place, so a rejection staged by one test would fire inside the next.
  handleShiftEnter.mockReset();
  handleShiftExit.mockReset();
  handleShiftEnter.mockResolvedValue(null);
  handleShiftExit.mockResolvedValue(null);
});

describe("a fix too coarse to judge", () => {
  const observeInBackground = (fix, nowMs) =>
    runGeofenceObservation({
      ...fix,
      radiusMeters: RADIUS,
      projectId: PROJECT_ID,
      source: GEOFENCE_SOURCE_BACKGROUND,
      nowMs,
    });

  it("does not mark the monitor as having produced a usable fix", async () => {
    const { verdict } = await observeInBackground(coarseFix, T0);
    const state = await readGeofenceState();

    expect(verdict).toBe(GEOFENCE_UNKNOWN);
    expect(state.lastBackgroundCallbackAt).toBe(T0);
    expect(state.lastBackgroundUsableFixAt).toBeNull();
  });

  it("records the callback so a dead service is distinguishable from a blind one", async () => {
    await observeInBackground(insideFix, T0);
    await observeInBackground(insideFix, T0 + 1000);
    await observeInBackground(coarseFix, T0 + 2000);

    const state = await readGeofenceState();

    expect(state.lastBackgroundCallbackAt).toBe(T0 + 2000);
    expect(state.lastBackgroundUsableFixAt).toBe(T0 + 1000);
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

  it("does not replay a retry that a fresh opposite reading contradicts", async () => {
    await arriveInside();
    handleShiftExit.mockRejectedValue(new Error("network down"));

    await observe(outsideFix, T0 + 10_000);
    await observe(outsideFix, T0 + 11_000);
    jest.clearAllMocks();

    // The worker walked back in before the queued "left the area" went through.
    await observe(insideFix, T0 + 11_000 + TRANSITION_RETRY_BACKOFF_MS[0]);

    expect(handleShiftExit).not.toHaveBeenCalled();
    expect((await readGeofenceState()).inside).toBe(true);
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

describe("concurrent observations", () => {
  // Two writers share the state: the foreground-service task and the in-app
  // monitor. Without the observation queue the read-modify-write straddles the
  // network call and both could act on the same confirmation count.
  const observeFor = (fix, nowMs, projectId) =>
    runGeofenceObservation({
      ...fix,
      radiusMeters: RADIUS,
      projectId,
      nowMs,
    });

  it("two simultaneous identical readings produce one transition", async () => {
    await observe(insideFix, T0);

    await Promise.all([
      observe(insideFix, T0 + 1000),
      observe(insideFix, T0 + 1000),
    ]);

    expect(handleShiftEnter).toHaveBeenCalledTimes(1);
    expect((await readGeofenceState()).inside).toBe(true);
  });

  it("a parallel success and failure leave no false pending transition", async () => {
    await observe(insideFix, T0);
    // The second dispatch would fail — but it must never happen, because the
    // serialized second observation sees the first one's committed state.
    handleShiftEnter
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("network down"));

    await Promise.all([
      observe(insideFix, T0 + 1000),
      observe(insideFix, T0 + 1000),
    ]);

    const state = await readGeofenceState();

    expect(handleShiftEnter).toHaveBeenCalledTimes(1);
    expect(state.inside).toBe(true);
    expect(state.pendingTransition).toBeNull();
  });

  it("a failure followed by a successful retry clears the pending transition", async () => {
    await observe(insideFix, T0);
    handleShiftEnter.mockRejectedValueOnce(new Error("network down"));

    await observe(insideFix, T0 + 1000);
    expect((await readGeofenceState()).pendingTransition).not.toBeNull();

    handleShiftEnter.mockResolvedValue(null);
    await observe(coarseFix, T0 + 1000 + TRANSITION_RETRY_BACKOFF_MS[0]);

    const state = await readGeofenceState();

    expect(state.inside).toBe(true);
    expect(state.pendingTransition).toBeNull();
  });

  it("keeps project A's state from being applied to project B", async () => {
    await observeFor(insideFix, T0, "project-a");
    await observeFor(insideFix, T0 + 1000, "project-a");
    expect((await readGeofenceState()).inside).toBe(true);
    jest.clearAllMocks();

    // Switching project must not inherit "already inside" from the old area.
    await observeFor(insideFix, T0 + 2000, "project-b");
    const afterFirst = await readGeofenceState();

    expect(afterFirst.projectId).toBe("project-b");
    expect(afterFirst.inside).toBeNull();
    expect(handleShiftEnter).not.toHaveBeenCalled();

    await observeFor(insideFix, T0 + 3000, "project-b");

    expect(handleShiftEnter).toHaveBeenCalledWith({ projectId: "project-b" });
  });

  it("drops a retry left over from another project", async () => {
    await observeFor(insideFix, T0, "project-a");
    await observeFor(insideFix, T0 + 1000, "project-a");
    handleShiftExit.mockRejectedValue(new Error("network down"));
    await observeFor(outsideFix, T0 + 2000, "project-a");
    await observeFor(outsideFix, T0 + 3000, "project-a");
    expect((await readGeofenceState()).pendingTransition).not.toBeNull();
    jest.clearAllMocks();

    await observeFor(
      coarseFix,
      T0 + 3000 + TRANSITION_RETRY_BACKOFF_MS[0],
      "project-b",
    );

    expect(handleShiftExit).not.toHaveBeenCalled();
    expect((await readGeofenceState()).pendingTransition).toBeNull();
  });

  it("keeps serving observations after one of them rejects", async () => {
    // A thrown error inside the queue must not poison the chain for the next
    // reading — that would silence the monitor permanently.
    handleShiftEnter.mockRejectedValueOnce(new Error("network down"));

    await observe(insideFix, T0);
    await observe(insideFix, T0 + 1000);

    handleShiftEnter.mockResolvedValue(null);
    const { verdict } = await observe(
      insideFix,
      T0 + 1000 + TRANSITION_RETRY_BACKOFF_MS[0],
    );

    expect(verdict).toBe(GEOFENCE_INSIDE);
    expect((await readGeofenceState()).inside).toBe(true);
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
