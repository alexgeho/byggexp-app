import AsyncStorage from "@react-native-async-storage/async-storage";

import { readGeofenceState, runGeofenceObservation } from "../geofenceRunner";
import { GEOFENCE_SOURCE_BACKGROUND } from "../geofenceEvaluation";
import { resetObservationQueue } from "../observationQueue";

// Health of the background service must be judged only by what the background
// service itself reported.
//
// The trap this guards: the foreground takeover requests a high-accuracy fix,
// that fix lands in the shared state, and fifteen seconds later the staleness
// check reads it back as proof the background service is fine. The takeover
// switches itself off, and the next look happens only after another full
// silence window — with two confirmations on top, a pause could be minutes late.

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
  noteBackgroundMonitorHealthy: jest.fn(),
}));

const PROJECT_ID = "project-a";
const RADIUS = 500;
const T0 = 1_700_000_000_000;

const goodFix = { distanceMeters: 40, accuracyMeters: 20 };
const coarseFix = { distanceMeters: 900, accuracyMeters: 900 };

const observe = (fix, nowMs, source) =>
  runGeofenceObservation({
    ...fix,
    radiusMeters: RADIUS,
    projectId: PROJECT_ID,
    nowMs,
    ...(source ? { source } : {}),
  });

beforeEach(() => {
  AsyncStorage.__reset();
  jest.clearAllMocks();
  resetObservationQueue();
});

it("a foreground fix never vouches for the background service", async () => {
  await observe(goodFix, T0, GEOFENCE_SOURCE_BACKGROUND);
  const afterBackground = await readGeofenceState();
  expect(afterBackground.lastBackgroundUsableFixAt).toBe(T0);

  // The takeover's own high-accuracy reading must not move the health marks.
  await observe(goodFix, T0 + 60_000);

  const afterForeground = await readGeofenceState();

  expect(afterForeground.lastBackgroundUsableFixAt).toBe(T0);
  expect(afterForeground.lastBackgroundCallbackAt).toBe(T0);
});

it("a background fix does move the health marks", async () => {
  await observe(goodFix, T0, GEOFENCE_SOURCE_BACKGROUND);
  await observe(goodFix, T0 + 60_000, GEOFENCE_SOURCE_BACKGROUND);

  const state = await readGeofenceState();

  expect(state.lastBackgroundCallbackAt).toBe(T0 + 60_000);
  expect(state.lastBackgroundUsableFixAt).toBe(T0 + 60_000);
});

it("a coarse background callback keeps the service visible but not proven", async () => {
  await observe(goodFix, T0, GEOFENCE_SOURCE_BACKGROUND);
  await observe(coarseFix, T0 + 60_000, GEOFENCE_SOURCE_BACKGROUND);

  const state = await readGeofenceState();

  expect(state.lastBackgroundCallbackAt).toBe(T0 + 60_000);
  expect(state.lastBackgroundUsableFixAt).toBe(T0);
});

it("a foreground reading still drives a transition", async () => {
  // Sources differ only in what they may claim about service health; the
  // evaluation and the confirmation counter are shared.
  const { handleShiftEnter } = require("../../tasks/shiftAutoTransition");

  await observe(goodFix, T0);
  await observe(goodFix, T0 + 1000);

  expect(handleShiftEnter).toHaveBeenCalledWith({ projectId: PROJECT_ID });
  expect((await readGeofenceState()).inside).toBe(true);
});

it("does not migrate pre-split timestamps into the background marks", async () => {
  // Older builds wrote these from both monitors, so they prove nothing about
  // the service and must not start the app off believing it is healthy.
  await AsyncStorage.setItem(
    "shiftLocationInside",
    JSON.stringify({
      inside: true,
      lastCallbackAt: T0,
      lastUsableFixAt: T0,
      lastFixAt: T0,
    }),
  );

  const state = await readGeofenceState();

  expect(state.lastBackgroundCallbackAt).toBeNull();
  expect(state.lastBackgroundUsableFixAt).toBeNull();
});
