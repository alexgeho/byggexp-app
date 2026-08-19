import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";

import { calculateDistanceMeters } from "../utils/shiftLocationGuard";
import { emitShiftLocationCheckError } from "../utils/shiftExitAutoCompleteEvents";
import {
  GEOFENCE_INSIDE,
  evaluateGeofencePosition,
  parseGeofenceState,
  reduceGeofenceState,
  serializeGeofenceState,
} from "../utils/geofenceEvaluation";
import {
  SHIFT_ENTER,
  SHIFT_EXIT,
  handleShiftEnter,
  handleShiftExit,
  isDuplicateTransition,
} from "./shiftAutoTransition";

// Android-only background location monitor. Strict Android builds reject
// Play-Services geofencing ("registration not permitted"), so instead of
// startGeofencingAsync we run a foreground service that streams GPS and
// computes the project geofence in JS here. Runs even when the app is closed
// or the phone is asleep because the foreground service keeps the process
// alive. iOS keeps native region monitoring (shiftGeofenceTask).
//
// Whether a fix counts as inside or outside is decided in geofenceEvaluation:
// it weighs the reported accuracy, applies hysteresis and requires consecutive
// agreeing readings, so a stationary phone with coarse indoor fixes can no
// longer toggle the shift by itself.
//
// Name is referenced from backgroundGeofence.js. Keep it stable.
export const SHIFT_LOCATION_TASK = "byggexp-shift-location";

// The monitored project's geofence (written by backgroundGeofence.js) and the
// last evaluated inside/outside state, so this headless task knows the target
// and can detect edge transitions across separate location callbacks.
export const SHIFT_LOCATION_TARGET_KEY = "shiftLocationTarget";
export const SHIFT_LOCATION_INSIDE_KEY = "shiftLocationInside";

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

  const verdict = evaluateGeofencePosition({
    distanceMeters,
    accuracyMeters: latest.coords.accuracy,
    radiusMeters: target.radius,
  });

  const storedState = parseGeofenceState(
    await AsyncStorage.getItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => null),
  );
  const { state: nextState, transition } = reduceGeofenceState(
    storedState,
    verdict,
  );

  // Persist before dispatching: if the transition throws, the state must still
  // reflect what was observed so the next fix does not replay it.
  await AsyncStorage.setItem(
    SHIFT_LOCATION_INSIDE_KEY,
    serializeGeofenceState(nextState),
  ).catch(() => {});

  if (!transition) {
    return;
  }

  // Date.now is available at runtime on-device (not in workflow scripts).
  const nowMs = Date.now();

  try {
    if (transition === GEOFENCE_INSIDE) {
      if (
        !(await isDuplicateTransition(SHIFT_ENTER, target.projectId, nowMs))
      ) {
        await handleShiftEnter({ projectId: target.projectId });
      }
      return;
    }

    if (!(await isDuplicateTransition(SHIFT_EXIT, target.projectId, nowMs))) {
      await handleShiftExit({ projectId: target.projectId });
    }
  } catch (taskError) {
    await emitShiftLocationCheckError(taskError);
  }
});
