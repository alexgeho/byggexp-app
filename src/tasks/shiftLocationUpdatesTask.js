import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";

import { calculateDistanceMeters } from "../utils/shiftLocationGuard";
import { emitShiftLocationCheckError } from "../utils/shiftExitAutoCompleteEvents";
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
// Name is referenced from backgroundGeofence.js. Keep it stable.
export const SHIFT_LOCATION_TASK = "byggexp-shift-location";

// The monitored project's geofence (written by backgroundGeofence.js) and the
// last inside/outside reading, so this headless task knows the target and can
// detect edge transitions across separate location callbacks.
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

  const distance = calculateDistanceMeters(
    latest.coords.latitude,
    latest.coords.longitude,
    target.latitude,
    target.longitude,
  );
  const inside = distance <= (target.radius || 0);

  const prevRaw = await AsyncStorage.getItem(SHIFT_LOCATION_INSIDE_KEY).catch(
    () => null,
  );
  const prevInside = prevRaw === "1";
  // Date.now is available at runtime on-device (not in workflow scripts).
  const nowMs = Date.now();

  try {
    // Act on the first fix (prevRaw === null) or a real edge transition. Acting
    // on the first fix mirrors the OS geofence's initial enter/exit event: a
    // shift left running while already outside gets auto-closed, and arriving
    // inside auto-starts.
    if (prevRaw === null || inside !== prevInside) {
      if (inside) {
        if (
          !(await isDuplicateTransition(SHIFT_ENTER, target.projectId, nowMs))
        ) {
          await handleShiftEnter({ projectId: target.projectId });
        }
      } else if (
        !(await isDuplicateTransition(SHIFT_EXIT, target.projectId, nowMs))
      ) {
        await handleShiftExit({ projectId: target.projectId });
      }
    }
  } catch (taskError) {
    await emitShiftLocationCheckError(taskError);
  } finally {
    await AsyncStorage.setItem(
      SHIFT_LOCATION_INSIDE_KEY,
      inside ? "1" : "0",
    ).catch(() => {});
  }
});
