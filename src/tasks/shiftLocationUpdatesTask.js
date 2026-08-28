import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { calculateDistanceMeters } from "../utils/shiftLocationGuard";
import { emitShiftLocationCheckError } from "../utils/shiftExitAutoCompleteEvents";
import {
  SHIFT_LOCATION_INSIDE_KEY,
  SHIFT_LOCATION_TARGET_KEY,
  runGeofenceObservation,
} from "../utils/geofenceRunner";
import { GEOFENCE_SOURCE_BACKGROUND } from "../utils/geofenceEvaluation";

// Android-only background location monitor. Strict Android builds reject
// Play-Services geofencing ("registration not permitted"), so instead of
// startGeofencingAsync we run a foreground service that streams GPS and
// computes the project geofence in JS here. Runs even when the app is closed
// or the phone is asleep because the foreground service keeps the process
// alive. iOS keeps native region monitoring (shiftGeofenceTask).
//
// The decision itself lives in geofenceRunner, shared with the in-app monitor,
// so both apply the same accuracy band, hysteresis and confirmation count
// against the same persisted state.
//
// Name is referenced from backgroundGeofence.js. Keep it stable.
export const SHIFT_LOCATION_TASK = "byggexp-shift-location";

// Re-exported for the modules that have always imported them from here.
export { SHIFT_LOCATION_TARGET_KEY, SHIFT_LOCATION_INSIDE_KEY };

// How long we wait for a self-requested fix before giving up for this tick.
const BACKGROUND_FIX_TIMEOUT_MS = 10000;

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("background-fix-timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Android 16+/targetSdk 36 frequently wakes this task through a deferred
// JobScheduler trigger that carries no location payload (logcat:
// "Handling job ... has a deadline"). When that happens the stream itself is
// running but this tick has nothing to evaluate, so pull a fix directly. A
// fresh reading is preferred; the last known position is a fallback so the
// geofence is still evaluated rather than skipped (which left shifts open until
// the app was reopened). The foreground-service + background permission make
// both calls legal while the app is closed.
const requestBackgroundFix = async () => {
  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      BACKGROUND_FIX_TIMEOUT_MS,
    );
  } catch {
    return Location.getLastKnownPositionAsync().catch(() => null);
  }
};

TaskManager.defineTask(SHIFT_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    await emitShiftLocationCheckError(error);
    return;
  }

  // Resolve the monitored target first: with no project there is nothing to
  // evaluate and no reason to spend a GPS fix on an empty delivery.
  let target = null;
  try {
    const raw = await AsyncStorage.getItem(SHIFT_LOCATION_TARGET_KEY);
    target = raw ? JSON.parse(raw) : null;
  } catch {
    target = null;
  }

  if (
    !target?.projectId ||
    target.latitude == null ||
    target.longitude == null
  ) {
    return;
  }

  const locations = data?.locations;
  let latest = locations?.[locations.length - 1];
  if (!latest?.coords) {
    // Empty delivery (see requestBackgroundFix): fetch our own reading instead
    // of bailing, so a worker leaving the site is still detected in the
    // background.
    latest = await requestBackgroundFix();
    if (!latest?.coords) {
      return;
    }
  }

  const distanceMeters = calculateDistanceMeters(
    latest.coords.latitude,
    latest.coords.longitude,
    target.latitude,
    target.longitude,
  );

  const { error: transitionError } = await runGeofenceObservation({
    distanceMeters,
    accuracyMeters: latest.coords.accuracy,
    radiusMeters: target.radius,
    projectId: target.projectId,
    // Only this call site may vouch for the background service's health.
    source: GEOFENCE_SOURCE_BACKGROUND,
  });

  if (transitionError) {
    await emitShiftLocationCheckError(transitionError);
  }
});
