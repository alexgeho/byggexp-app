import AsyncStorage from "@react-native-async-storage/async-storage";
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

TaskManager.defineTask(SHIFT_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    await emitShiftLocationCheckError(error);
    return;
  }

  const locations = data?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest?.coords) {
    return;
  }

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
