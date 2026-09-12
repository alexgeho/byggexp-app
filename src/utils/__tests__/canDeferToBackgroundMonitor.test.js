import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

import { SHIFT_LOCATION_INSIDE_KEY } from "../../tasks/shiftLocationUpdatesTask";

// The in-app foreground check may only stand down when the OS-level monitor can
// actually be trusted this cycle. On Android that means a foreground service
// still producing usable fixes; on iOS region monitoring has no health signal,
// so the foreground check stays on as a safety net while the app is open — that
// is what makes an iPhone auto-pause a shift when the worker leaves the site
// with the app on screen.

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  AppState: { currentState: "active" },
}));

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

const storeState = (state) => {
  AsyncStorage.getItem.mockImplementation(async (key) =>
    key === SHIFT_LOCATION_INSIDE_KEY && state ? JSON.stringify(state) : null,
  );
};

// The module reads Platform.OS once at import for `isAndroid`, so each platform
// has to be exercised on a freshly loaded copy.
const loadFor = (os) => {
  let mod;
  jest.isolateModules(() => {
    Platform.OS = os;
    mod = jest.requireActual("../backgroundGeofence");
  });
  return mod;
};

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
  AppState.currentState = "active";
});

describe("Android — defers only while the service is reporting", () => {
  it("defers when the background service has a fresh usable fix", async () => {
    storeState({
      inside: true,
      lastBackgroundCallbackAt: Date.now() - 5_000,
      lastBackgroundUsableFixAt: Date.now() - 5_000,
    });

    const { canDeferToBackgroundMonitor } = loadFor("android");
    await expect(canDeferToBackgroundMonitor()).resolves.toBe(true);
  });

  it("does not defer when the service has gone silent (foreground takes over)", async () => {
    storeState(null);

    const { canDeferToBackgroundMonitor } = loadFor("android");
    await expect(canDeferToBackgroundMonitor()).resolves.toBe(false);
  });
});

describe("iOS — never defers while the app is foregrounded", () => {
  it("does not defer when the app is active, so the foreground check runs", async () => {
    storeState(null);
    AppState.currentState = "active";

    const { canDeferToBackgroundMonitor } = loadFor("ios");
    await expect(canDeferToBackgroundMonitor()).resolves.toBe(false);
  });

  it("defers to the OS geofence when the app is backgrounded", async () => {
    storeState(null);
    AppState.currentState = "background";

    const { canDeferToBackgroundMonitor } = loadFor("ios");
    await expect(canDeferToBackgroundMonitor()).resolves.toBe(true);
  });
});
