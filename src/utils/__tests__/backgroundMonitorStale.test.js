import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import {
  BACKGROUND_MONITOR_MAX_SILENCE_MS,
  isBackgroundMonitorStale,
} from "../backgroundGeofence";
import { reportBackgroundMonitorStale } from "../shiftGeofenceDebug";
import { SHIFT_LOCATION_INSIDE_KEY } from "../../tasks/shiftLocationUpdatesTask";

// A registered background service that stopped reporting must not keep the
// foreground check standing down: that is what left a shift running while the
// worker was hundreds of metres away with the app open.
//
// Health is judged only by the background service's own marks — a foreground
// reading landing in the shared state would otherwise prove the service alive
// and switch the takeover back off.

jest.mock("react-native", () => ({ Platform: { OS: "android" } }));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("expo-location", () => ({
  hasStartedLocationUpdatesAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  hasStartedGeofencingAsync: jest.fn(),
  startGeofencingAsync: jest.fn(),
  stopGeofencingAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  Accuracy: { High: 5 },
}));

jest.mock("../shiftLocationGuard", () => ({
  resolveProjectGeofenceRegion: jest.fn(),
  calculateDistanceMeters: jest.fn(),
}));

jest.mock("../shiftGeofenceDebug", () => ({
  logGeofenceTarget: jest.fn(),
  logGeofenceFix: jest.fn(),
  reportBackgroundMonitorStale: jest.fn(),
  reportTransitionExhausted: jest.fn(),
  noteBackgroundMonitorHealthy: jest.fn(),
}));

jest.mock("../geofenceRunner", () => ({
  SHIFT_LOCATION_TARGET_KEY: "shiftLocationTarget",
  SHIFT_LOCATION_INSIDE_KEY: "shiftLocationInside",
  clearGeofenceState: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../tasks/shiftGeofenceTask", () => ({
  SHIFT_GEOFENCE_TASK: "geofence-task",
}));

jest.mock("expo-task-manager", () => ({ defineTask: jest.fn() }));

jest.mock("../../tasks/shiftAutoTransition", () => ({
  SHIFT_ENTER: "enter",
  SHIFT_EXIT: "exit",
  handleShiftEnter: jest.fn(),
  handleShiftExit: jest.fn(),
  isDuplicateTransition: jest.fn(),
}));

jest.mock("../shiftExitAutoCompleteEvents", () => ({
  emitShiftLocationCheckError: jest.fn(),
}));

const storeState = (state) => {
  AsyncStorage.getItem.mockImplementation(async (key) =>
    key === SHIFT_LOCATION_INSIDE_KEY && state ? JSON.stringify(state) : null,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
});

it("treats a monitor that never reported as stale", async () => {
  storeState(null);

  await expect(isBackgroundMonitorStale()).resolves.toBe(true);
});

it("treats a recent background reading as fresh", async () => {
  storeState({
    inside: true,
    lastBackgroundCallbackAt: Date.now() - 10_000,
    lastBackgroundUsableFixAt: Date.now() - 10_000,
  });

  await expect(isBackgroundMonitorStale()).resolves.toBe(false);
});

it("treats a long silence as stale so the foreground check takes over", async () => {
  const age = BACKGROUND_MONITOR_MAX_SILENCE_MS + 1000;
  storeState({
    inside: true,
    lastBackgroundCallbackAt: Date.now() - age,
    lastBackgroundUsableFixAt: Date.now() - age,
  });

  await expect(isBackgroundMonitorStale()).resolves.toBe(true);
});

it("migrates the old 1/0 state as stale rather than assuming it is live", async () => {
  AsyncStorage.getItem.mockImplementation(async (key) =>
    key === SHIFT_LOCATION_INSIDE_KEY ? "1" : null,
  );

  await expect(isBackgroundMonitorStale()).resolves.toBe(true);
});

it("treats a service that only delivers unusable fixes as silent", async () => {
  // Alive and firing every 15 s, but Doze leaves it with cell-tower accuracy:
  // it decides nothing, so the foreground check has to take over regardless.
  storeState({
    inside: true,
    lastBackgroundCallbackAt: Date.now(),
    lastBackgroundUsableFixAt:
      Date.now() - BACKGROUND_MONITOR_MAX_SILENCE_MS - 1000,
  });

  await expect(isBackgroundMonitorStale()).resolves.toBe(true);
});

it("stays stale even after a good foreground fix", async () => {
  // The foreground reading writes no background marks at all, so the service
  // is still unproven and the takeover must remain in charge.
  storeState({
    inside: true,
    lastBackgroundCallbackAt: null,
    lastBackgroundUsableFixAt: null,
  });

  await expect(isBackgroundMonitorStale()).resolves.toBe(true);
});

it("never reports stale on iOS, where region monitoring is event-driven", async () => {
  storeState(null);

  // The module reads Platform.OS once at import time, so the iOS branch has to
  // be exercised on a freshly loaded copy.
  let iosIsBackgroundMonitorStale;
  jest.isolateModules(() => {
    Platform.OS = "ios";
    ({ isBackgroundMonitorStale: iosIsBackgroundMonitorStale } =
      jest.requireActual("../backgroundGeofence"));
  });

  await expect(iosIsBackgroundMonitorStale()).resolves.toBe(false);
});

describe("what the diagnostics blame", () => {
  it("blames coarse fixes while callbacks keep arriving", async () => {
    storeState({
      lastBackgroundCallbackAt: Date.now() - 5_000,
      lastBackgroundUsableFixAt:
        Date.now() - BACKGROUND_MONITOR_MAX_SILENCE_MS - 1000,
    });

    await isBackgroundMonitorStale();

    expect(reportBackgroundMonitorStale).toHaveBeenCalledWith(
      expect.objectContaining({
        silenceThresholdMs: BACKGROUND_MONITOR_MAX_SILENCE_MS,
      }),
    );
    const { callbackAgeMs } = reportBackgroundMonitorStale.mock.calls[0][0];
    expect(callbackAgeMs).toBeLessThan(BACKGROUND_MONITOR_MAX_SILENCE_MS);
  });

  it("blames a dead service once the callbacks stop too", async () => {
    const age = BACKGROUND_MONITOR_MAX_SILENCE_MS + 30_000;
    storeState({
      lastBackgroundCallbackAt: Date.now() - age,
      lastBackgroundUsableFixAt: Date.now() - age,
    });

    await isBackgroundMonitorStale();

    const { callbackAgeMs, silenceThresholdMs } =
      reportBackgroundMonitorStale.mock.calls[0][0];

    // Classification has to use the health threshold, not the Sentry rate
    // limit: between minute three and five a killed service was being filed as
    // merely imprecise.
    expect(callbackAgeMs).toBeGreaterThan(silenceThresholdMs);
  });
});
