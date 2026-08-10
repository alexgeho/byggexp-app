import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { emitShiftLocationCheckError } from "../utils/shiftExitAutoCompleteEvents";
import {
  handleShiftEnter,
  handleShiftExit,
  isDuplicateTransition,
} from "./shiftAutoTransition";

// iOS native region monitoring. The OS wakes the app on enter/exit even while
// it is closed or the phone is asleep. Android uses a foreground-service
// location stream instead (shiftLocationUpdatesTask) because strict Android
// builds reject Play-Services geofencing.
//
// Name is referenced from backgroundGeofence.js when starting/stopping the
// geofence. Keep it stable — changing it orphans an already-registered task.
export const SHIFT_GEOFENCE_TASK = "byggexp-shift-geofence";

TaskManager.defineTask(SHIFT_GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    await emitShiftLocationCheckError(error);
    return;
  }

  const eventType = data?.eventType;
  const region = data?.region;
  if (!region) {
    return;
  }

  // Date.now is available at runtime on-device (not in workflow scripts).
  const nowMs = Date.now();

  try {
    if (eventType === Location.GeofencingEventType.Exit) {
      if (isDuplicateTransition(`exit:${region.identifier}`, nowMs)) {
        return;
      }
      await handleShiftExit();
    } else if (eventType === Location.GeofencingEventType.Enter) {
      if (isDuplicateTransition(`enter:${region.identifier}`, nowMs)) {
        return;
      }
      await handleShiftEnter(region.identifier);
    }
  } catch (taskError) {
    await emitShiftLocationCheckError(taskError);
  }
});
