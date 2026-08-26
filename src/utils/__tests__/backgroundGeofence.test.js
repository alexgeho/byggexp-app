import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { AppState } from "react-native";

import { resolveProjectGeofenceRegion } from "../shiftLocationGuard";

// These tests pin down the Android foreground-service lifecycle. expo-location
// only starts the location foreground service when startLocationUpdatesAsync is
// called while the app is foregrounded, and TaskManager registrations persist
// across process death. So after the OS revives the app in the background the
// stream keeps running WITHOUT a foreground service (delivered via JobScheduler,
// which Doze freezes) and the shift never auto-pauses while the phone is asleep.
// syncShiftGeofenceForProject must re-register on the next foreground sync to
// promote the stream back to a foreground service.

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  AppState: { currentState: "active" },
}));

jest.mock("expo-device", () => ({ isDevice: true }));

jest.mock("expo-location", () => ({
  Accuracy: { High: 4 },
  hasStartedLocationUpdatesAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  stopLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  hasStartedGeofencingAsync: jest.fn().mockResolvedValue(false),
  stopGeofencingAsync: jest.fn().mockResolvedValue(undefined),
  getForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  getBackgroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../shiftLocationGuard", () => ({
  resolveProjectGeofenceRegion: jest.fn(),
}));

jest.mock("../shiftGeofenceDebug", () => ({
  logGeofenceTarget: jest.fn(),
  reportBackgroundMonitorStale: jest.fn(),
  noteBackgroundMonitorHealthy: jest.fn(),
}));

// Resetting the geofence state now goes through the observation queue, so
// backgroundGeofence imports geofenceRunner. Left unmocked that pulls in the
// shift services and fails on the native ExpoSharing module — a test isolation
// problem only; nothing in the app touches Sharing on this path.
jest.mock("../geofenceRunner", () => ({
  clearGeofenceState: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config/shiftLocationPolicy", () => ({
  shiftLocationPolicy: {
    enabled: true,
    backgroundGeofencingEnabled: true,
    maxDistanceMeters: 500,
    minBackgroundRadiusMeters: 120,
  },
}));

jest.mock("../../tasks/shiftGeofenceTask", () => ({
  SHIFT_GEOFENCE_TASK: "geofence-task",
}));

jest.mock("../../tasks/shiftLocationUpdatesTask", () => ({
  SHIFT_LOCATION_TASK: "location-task",
  SHIFT_LOCATION_TARGET_KEY: "shiftLocationTarget",
  SHIFT_LOCATION_INSIDE_KEY: "shiftLocationInside",
}));

const REGION = {
  identifier: "project-1",
  latitude: 59.3,
  longitude: 18.0,
  radius: 200,
};

// What backgroundGeofence persists for REGION (radius is clamped to >= 120m).
const STORED_TARGET = {
  projectId: "project-1",
  latitude: 59.3,
  longitude: 18.0,
  radius: 200,
};

// Re-require the module fresh so its process-scoped foreground-service flag
// resets — this mirrors a fresh OS process, the exact condition we test.
const loadModule = () => {
  let mod;
  jest.isolateModules(() => {
    mod = require("../backgroundGeofence");
  });
  return mod;
};

const sync = (mod) =>
  mod.syncShiftGeofenceForProject({ project: { id: "project-1" } });

beforeEach(() => {
  jest.clearAllMocks();
  AppState.currentState = "active";
  resolveProjectGeofenceRegion.mockResolvedValue(REGION);
  AsyncStorage.getItem.mockResolvedValue(null);
});

test("fresh foreground start registers the stream with a foreground service", async () => {
  Location.hasStartedLocationUpdatesAsync.mockResolvedValue(false);

  const mod = loadModule();
  const active = await sync(mod);

  expect(active).toBe(true);
  expect(Location.startLocationUpdatesAsync).toHaveBeenCalledTimes(1);
  const [, options] = Location.startLocationUpdatesAsync.mock.calls[0];
  expect(options.foregroundService).toEqual(
    expect.objectContaining({ notificationTitle: "Shift location active" }),
  );
});

test("promotes an already-running stream to a foreground service when foregrounded", async () => {
  // Stream persisted from a background revival: running, same project, but no
  // foreground service in this process yet.
  Location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
  AsyncStorage.getItem.mockResolvedValue(JSON.stringify(STORED_TARGET));

  const mod = loadModule();
  const active = await sync(mod);

  expect(active).toBe(true);
  // Re-registers: stop then start again, promoting to a foreground service.
  expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledTimes(1);
  expect(Location.startLocationUpdatesAsync).toHaveBeenCalledTimes(1);
  // Inside/outside state is preserved (target unchanged) — not cleared.
  expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(
    "shiftLocationInside",
  );
});

test("does not re-register once the foreground service is up this process", async () => {
  Location.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
  const mod = loadModule();
  await sync(mod); // establishes the foreground service

  // Now the stream is running for the same project.
  Location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
  AsyncStorage.getItem.mockResolvedValue(JSON.stringify(STORED_TARGET));
  Location.startLocationUpdatesAsync.mockClear();
  Location.stopLocationUpdatesAsync.mockClear();

  await sync(mod);

  expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
});

test("does not restart in the background where the foreground service cannot start", async () => {
  Location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
  AsyncStorage.getItem.mockResolvedValue(JSON.stringify(STORED_TARGET));
  AppState.currentState = "background";

  const mod = loadModule();
  await sync(mod);

  expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
  expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
});
