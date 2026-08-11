import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Location from "expo-location";

import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import { SHIFT_GEOFENCE_TASK } from "../tasks/shiftGeofenceTask";
import {
  SHIFT_LOCATION_TASK,
  SHIFT_LOCATION_TARGET_KEY,
  SHIFT_LOCATION_INSIDE_KEY,
} from "../tasks/shiftLocationUpdatesTask";
import { resolveProjectGeofenceRegion } from "./shiftLocationGuard";

// AsyncStorage key: timestamp of when we last showed the consent priming
// screen, so it is offered at most once automatically.
export const LOCATION_CONSENT_PROMPTED_KEY = "shiftGeofenceConsentPromptedAt";

const isAndroid = Platform.OS === "android";

// Background auto start/stop is supported on both platforms, but via different
// mechanisms: iOS uses OS-level region monitoring (startGeofencingAsync);
// Android uses a foreground-service location stream (startLocationUpdatesAsync)
// because strict Android builds reject Play-Services geofencing. Both need
// "Always"/background location granted and a physical device.
export const isBackgroundGeofencingSupported = () =>
  (Platform.OS === "ios" || Platform.OS === "android") &&
  shiftLocationPolicy.enabled &&
  shiftLocationPolicy.backgroundGeofencingEnabled &&
  Device.isDevice;

export const hasBackgroundLocationPermission = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === "granted";
};

// Returns true when the location task CAN be started: on Android this requires
// only foreground ("while using") permission because the foreground service
// keeps running while the app is open or backgrounded; on iOS we need the full
// "always" grant for OS-level region monitoring.
export const hasLocationTaskPermission = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  if (isAndroid) {
    const { status } = await Location.getForegroundPermissionsAsync().catch(
      () => ({ status: "denied" }),
    );
    return status === "granted";
  }

  return hasBackgroundLocationPermission();
};

// "granted" | "denied" | "undetermined". Used to decide whether to show the
// consent priming screen (only when we can still raise the OS dialog).
export const getBackgroundPermissionStatus = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return "unsupported";
  }

  const { status } = await Location.getBackgroundPermissionsAsync();
  return status;
};

// Request foreground first (required before background can be granted), then
// background ("Always"). Returns true only when background is granted.
export const requestBackgroundLocationPermission = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    return false;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === "granted";
};

const clampRadius = (radius) => {
  const min = shiftLocationPolicy.minBackgroundRadiusMeters || 0;
  const value = Number(radius);
  if (!Number.isFinite(value) || value <= 0) {
    return min || shiftLocationPolicy.maxDistanceMeters;
  }
  return Math.max(value, min);
};

const clearAndroidState = async () => {
  await AsyncStorage.removeItem(SHIFT_LOCATION_TARGET_KEY).catch(() => {});
  await AsyncStorage.removeItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => {});
};

// Stop whichever background monitor is running on this platform.
const stopIfRunning = async () => {
  if (isAndroid) {
    const updating = await Location.hasStartedLocationUpdatesAsync(
      SHIFT_LOCATION_TASK,
    ).catch(() => false);
    if (updating) {
      await Location.stopLocationUpdatesAsync(SHIFT_LOCATION_TASK).catch(
        () => {},
      );
    }
    await clearAndroidState();
    return;
  }

  const geofencing = await Location.hasStartedGeofencingAsync(
    SHIFT_GEOFENCE_TASK,
  ).catch(() => false);
  if (geofencing) {
    await Location.stopGeofencingAsync(SHIFT_GEOFENCE_TASK).catch(() => {});
  }
};

export const stopShiftGeofencing = async () => {
  await stopIfRunning();
};

// Android: start (or keep) a foreground-service location stream for the given
// project region. The task in shiftLocationUpdatesTask computes enter/exit from
// the stream. Idempotent — a stream already running for the same project is
// left untouched so its inside/outside state is preserved.
const syncAndroidLocationUpdates = async (region) => {
  const target = {
    projectId: region.identifier,
    latitude: region.latitude,
    longitude: region.longitude,
    radius: clampRadius(region.radius),
  };

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
    SHIFT_LOCATION_TASK,
  ).catch(() => false);

  if (alreadyRunning) {
    const raw = await AsyncStorage.getItem(SHIFT_LOCATION_TARGET_KEY).catch(
      () => null,
    );
    const existing = raw ? JSON.parse(raw) : null;
    if (existing?.projectId === target.projectId) {
      return true;
    }
    // Switched to a different project: stop and re-register with fresh state.
    await Location.stopLocationUpdatesAsync(SHIFT_LOCATION_TASK).catch(
      () => {},
    );
  }

  await AsyncStorage.removeItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => {});
  await AsyncStorage.setItem(SHIFT_LOCATION_TARGET_KEY, JSON.stringify(target));

  await Location.startLocationUpdatesAsync(SHIFT_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    // Fixed cadence, no distance gate, and no deferral so Doze/battery
    // optimisation can't batch updates until the screen wakes — otherwise the
    // enter/exit only fires when the app is reopened.
    timeInterval: 15000,
    distanceInterval: 0,
    deferredUpdatesInterval: 0,
    deferredUpdatesDistance: 0,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: "Shift location active",
      notificationBody:
        "ByggExp checks you in and out as you arrive at and leave the project site.",
      notificationColor: "#052D50",
      killServiceOnDestroy: false,
    },
  });

  return true;
};

// Register (or refresh) background auto start/stop for a single project. Returns
// true when monitoring is now active for it, false otherwise (unsupported, no
// permission, or the project has no usable location).
export const syncShiftGeofenceForProject = async ({
  project,
  fallbackProjectLocation,
} = {}) => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  // Android: startLocationUpdatesAsync with a foreground service works with
  // foreground ("while using") permission — the service stays alive while the
  // app is open or backgrounded. With "Always" it also survives app destroy.
  // Do NOT gate on background permission here so at least foreground tracking
  // is active even when the user has only granted "while using".
  if (isAndroid) {
    const { status: fgStatus } =
      await Location.getForegroundPermissionsAsync().catch(() => ({
        status: "denied",
      }));
    if (fgStatus !== "granted") {
      await stopIfRunning();
      return false;
    }
  } else if (!(await hasBackgroundLocationPermission())) {
    await stopIfRunning();
    return false;
  }

  const region = await resolveProjectGeofenceRegion({
    project,
    fallbackProjectLocation,
  });

  if (!region) {
    await stopIfRunning();
    return false;
  }

  try {
    if (isAndroid) {
      return await syncAndroidLocationUpdates(region);
    }

    await Location.startGeofencingAsync(SHIFT_GEOFENCE_TASK, [
      {
        identifier: region.identifier,
        latitude: region.latitude,
        longitude: region.longitude,
        radius: clampRadius(region.radius),
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]);
    return true;
  } catch {
    await stopIfRunning();
    return false;
  }
};
