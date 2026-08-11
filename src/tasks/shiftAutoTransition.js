import { shiftService } from "../services";
import {
  emitShiftAutoCompleted,
  emitShiftAutoStarted,
} from "../utils/shiftExitAutoCompleteEvents";
import {
  notifyShiftAutoCompleted,
  notifyShiftAutoStarted,
} from "../utils/shiftBackgroundNotifications";

// Auto start/stop a shift when the worker enters or leaves the project area.
// Shared by both background monitors: the iOS native geofence task
// (shiftGeofenceTask) and the Android foreground-service location task
// (shiftLocationUpdatesTask), so a transition behaves identically on both.

const MONITORED_SHIFT_STATUSES = new Set(["active", "paused"]);

const getShiftId = (shift) => shift?.id || shift?._id || null;

// Best-effort de-dupe shared across both tasks: the OS can deliver the same
// transition more than once, and only one of the two monitors should ever run
// per platform, but this guard keeps a rapid duplicate from firing twice while
// the JS context stays alive.
//
// Each key (e.g. "enter:projectId") gets its own timestamp so that alternating
// enter/exit events don't reset each other's window.
const lastHandledMap = {};
const DEDUPE_WINDOW_MS = 3 * 60 * 1000; // 3 minutes per-event type

export const isDuplicateTransition = (key, nowMs) => {
  const last = lastHandledMap[key] || 0;
  if (nowMs - last < DEDUPE_WINDOW_MS) {
    return true;
  }
  lastHandledMap[key] = nowMs;
  return false;
};

// Re-entry cooldown: after an exit, don't auto-start again for this project
// until at least RE_ENTRY_COOLDOWN_MS has passed. Prevents GPS oscillation at
// the boundary from rapidly cycling the shift on/off.
const lastExitAtMap = {};
const RE_ENTRY_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

export const handleShiftExit = async () => {
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

  // Record the exit time so handleShiftEnter can enforce the re-entry cooldown.
  if (currentShift.projectId) {
    lastExitAtMap[currentShift.projectId] = Date.now();
  }

  await notifyShiftAutoCompleted(completedShift);
  await emitShiftAutoCompleted(completedShift);
};

export const handleShiftEnter = async (projectId) => {
  if (!projectId) {
    return;
  }

  // Re-entry cooldown: if we just exited this project's geofence recently it
  // is most likely GPS oscillation at the boundary, not a real arrival. Skip
  // auto-start until the cooldown expires.
  const lastExit = lastExitAtMap[projectId] || 0;
  if (Date.now() - lastExit < RE_ENTRY_COOLDOWN_MS) {
    return;
  }

  // Scope to this project: the backend allows only one open shift per
  // project/day, so returning to a site must resume today's shift rather than
  // start a second one.
  const currentShift = await shiftService.getCurrent(projectId);
  const shiftId = getShiftId(currentShift);

  // Already running for this project — nothing to do.
  if (shiftId && currentShift?.status === "active") {
    return;
  }

  // Paused earlier today (manual break, auto-pause, or a prior exit) — resume
  // it instead of starting a new one.
  const shift =
    shiftId && currentShift?.status === "paused"
      ? await shiftService.resume(shiftId)
      : await shiftService.start(projectId);

  await notifyShiftAutoStarted(shift);
  await emitShiftAutoStarted(shift);
};
