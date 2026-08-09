import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { shiftService } from "../services";
import {
  emitShiftAutoCompleted,
  emitShiftAutoStarted,
  emitShiftLocationCheckError,
} from "../utils/shiftExitAutoCompleteEvents";
import {
  notifyShiftAutoCompleted,
  notifyShiftAutoStarted,
} from "../utils/shiftBackgroundNotifications";

// Name is referenced from backgroundGeofence.js when starting/stopping the
// geofence. Keep it stable — changing it orphans an already-registered task.
export const SHIFT_GEOFENCE_TASK = "byggexp-shift-geofence";

const MONITORED_SHIFT_STATUSES = new Set(["active", "paused"]);

const getShiftId = (shift) => shift?.id || shift?._id || null;

// Best-effort de-dupe: the OS can deliver the same region transition more than
// once. This module-level guard only helps while the JS context stays alive
// (app in background), which covers the common rapid-duplicate case.
let lastHandled = { key: null, at: 0 };

const isDuplicate = (key, nowMs) => {
  if (lastHandled.key === key && nowMs - lastHandled.at < 30000) {
    return true;
  }
  lastHandled = { key, at: nowMs };
  return false;
};

const handleExit = async () => {
  const currentShift = await shiftService.getCurrent();
  const shiftId = getShiftId(currentShift);

  if (!shiftId || !MONITORED_SHIFT_STATUSES.has(currentShift?.status)) {
    return;
  }

  const completedShift = await shiftService.complete(shiftId, {
    reason: "outside_project_area",
    source: "mobile_geofence_checkout",
    // The app posts its own local notification in the user's language
    // (notifyShiftAutoCompleted), so don't also send the server push.
    notifyUser: false,
  });

  await notifyShiftAutoCompleted(completedShift);
  await emitShiftAutoCompleted(completedShift);
};

const handleEnter = async (region) => {
  const projectId = region?.identifier;
  if (!projectId) {
    return;
  }

  const currentShift = await shiftService.getCurrent();
  const shiftId = getShiftId(currentShift);

  // Only auto-start when there is no shift running at all. Don't touch a shift
  // that belongs to a different project.
  if (shiftId && MONITORED_SHIFT_STATUSES.has(currentShift?.status)) {
    return;
  }

  const startedShift = await shiftService.start(projectId);

  await notifyShiftAutoStarted(startedShift);
  await emitShiftAutoStarted(startedShift);
};

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
      if (isDuplicate(`exit:${region.identifier}`, nowMs)) {
        return;
      }
      await handleExit();
    } else if (eventType === Location.GeofencingEventType.Enter) {
      if (isDuplicate(`enter:${region.identifier}`, nowMs)) {
        return;
      }
      await handleEnter(region);
    }
  } catch (taskError) {
    await emitShiftLocationCheckError(taskError);
  }
});
