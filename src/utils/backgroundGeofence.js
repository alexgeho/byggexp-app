import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Location from "expo-location";

import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import { SHIFT_GEOFENCE_TASK } from "../tasks/shiftGeofenceTask";
import { resolveProjectGeofenceRegion } from "./shiftLocationGuard";

// AsyncStorage key: timestamp of when we last showed the consent priming
// screen, so it is offered at most once automatically.
export const LOCATION_CONSENT_PROMPTED_KEY = "shiftGeofenceConsentPromptedAt";

// iOS only for now. Android background geofencing needs a properly declared
// location foreground service (via prebuild) + the Play Store background
// location declaration; without them startGeofencingAsync destabilises the
// app. On Android the foreground shift monitor still handles auto in/out.
export const isBackgroundGeofencingSupported = () =>
  Platform.OS === "ios" &&
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

const stopIfRunning = async () => {
  const started = await Location.hasStartedGeofencingAsync(
    SHIFT_GEOFENCE_TASK,
  ).catch(() => false);

  if (started) {
    await Location.stopGeofencingAsync(SHIFT_GEOFENCE_TASK).catch(() => {});
  }
};

export const stopShiftGeofencing = async () => {
  await stopIfRunning();
};

// Register the OS-level geofence for a single project. The task fires enter/exit
// even when the app is closed or the phone is asleep. Returns true when a
// geofence is now active for the project, false otherwise (unsupported, no
// permission, or the project has no usable location).
export const syncShiftGeofenceForProject = async ({
  project,
  fallbackProjectLocation,
} = {}) => {
  if (!(await hasBackgroundLocationPermission())) {
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

  // startGeofencingAsync replaces any regions previously registered for the
  // task, so we don't need to stop first — but stop keeps state clean if the
  // new region list is otherwise identical.
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
};
