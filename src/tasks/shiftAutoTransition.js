import { shiftService } from "../services";
import { runExclusive } from "../utils/shiftTransitionQueue";
import { shouldSkipTransition } from "../utils/shiftTransitionLog";
import { assertShiftScheduleAllowsStart } from "../utils/shiftLocationGuard";
import {
  findExistingShiftForProject,
  isShiftAlreadyExistsError,
  reportUnrecoverableShiftConflict,
} from "../utils/shiftConflict";
import {
  announceShiftAutoCompleted,
  announceShiftAutoPaused,
  announceShiftAutoResumed,
  announceShiftAutoStarted,
} from "../utils/shiftAutoAnnounce";

// Single source of truth for automatic shift transitions.
//
// Used by every caller that can move a shift without the user pressing a
// button: the iOS region-monitoring task (shiftGeofenceTask), the Android
// foreground-service location task (shiftLocationUpdatesTask) and the
// foreground monitor (ShiftLocationMonitor). Routing all of them through the
// same functions is what keeps foreground and background behaviour identical.
//
// State model, matching the backend contract (one open shift per project/day):
//
//   leaving the area  -> pause    (keeps the shift open, stops the clock)
//   returning         -> resume   (same shift, accumulated time is preserved)
//   switching project -> complete (the old project's shift really is finished)
//
// The previous implementation completed the shift on exit and then only knew
// how to resume a *paused* shift on re-entry, so returning the same day always
// fell through to `start` and the backend rejected it with
// "A shift for this project already exists today. Resume it instead."

export const SHIFT_ENTER = "enter";
export const SHIFT_EXIT = "exit";

const getShiftId = (shift) => shift?.id || shift?._id || null;

const resumeExisting = async (shift) => {
  const shiftId = getShiftId(shift);
  if (!shiftId) {
    return null;
  }

  const resumedShift = (await shiftService.resume(shiftId)) || shift;
  await announceShiftAutoResumed(resumedShift);

  return resumedShift;
};

// Recovery path for a `start` the backend rejected because today's shift
// already exists: re-read it and resume it instead of bubbling the error up as
// a "Resume it instead" dialog.
const recoverFromExistingShift = async (projectId, error) => {
  const existingShift = await findExistingShiftForProject(projectId);

  if (!getShiftId(existingShift)) {
    reportUnrecoverableShiftConflict(projectId, error);
    throw error;
  }

  if (existingShift.status === "active") {
    return existingShift;
  }

  return resumeExisting(existingShift);
};

// Unqueued primitives, composed inside a single queued operation by
// handleProjectSwitch. External callers use the queued wrappers further down so
// transitions can never interleave.

const performShiftEnter = async ({ projectId, project } = {}) => {
  if (!projectId) {
    return null;
  }

  const currentShift = await shiftService.getCurrent(projectId);
  const currentShiftId = getShiftId(currentShift);

  // Already running for this project — a repeated enter event is a no-op.
  if (currentShiftId && currentShift.status === "active") {
    return currentShift;
  }

  if (currentShiftId && currentShift.status === "paused") {
    return resumeExisting(currentShift);
  }

  // Only the foreground monitor knows the full project, so the schedule window
  // is asserted when it is available; the backend validates it in every case.
  if (project) {
    assertShiftScheduleAllowsStart(project);
  }

  let startedShift;
  try {
    startedShift = await shiftService.start(projectId);
  } catch (error) {
    if (!isShiftAlreadyExistsError(error)) {
      throw error;
    }

    return recoverFromExistingShift(projectId, error);
  }

  await announceShiftAutoStarted(startedShift);

  return startedShift;
};

const performShiftExit = async ({ projectId } = {}) => {
  const currentShift = await shiftService.getCurrent(projectId || undefined);
  const currentShiftId = getShiftId(currentShift);

  // Only an actively running shift has a clock to stop. A paused shift is
  // already where an exit would leave it.
  if (!currentShiftId || currentShift.status !== "active") {
    // Diagnostic: an exit that finds no active shift for the monitored project
    // is usually a stale geofence target — the worker is clocked into another
    // project and the monitor has not re-synced the target yet. Log the
    // worker's actual current shift so a genuine "nothing to pause" can be told
    // apart from a target/shift project mismatch.
    let workerStatus = "-";
    let workerProject = "-";
    try {
      const workerShift = await shiftService.getCurrent();
      workerStatus = workerShift?.status ?? "none";
      workerProject = workerShift?.projectId ?? "-";
    } catch {
      workerStatus = "err";
    }
    console.log(
      `[shift] exit no-op target=${projectId ?? "-"} ` +
        `found=${currentShiftId ?? "none"}/${currentShift?.status ?? "-"} ` +
        `workerCurrent=${workerStatus}@${workerProject}`,
    );
    return null;
  }

  const pausedShift =
    (await shiftService.pause(currentShiftId)) || currentShift;

  console.log(
    `[shift] exit paused ${currentShiftId} (project ${currentShift.projectId})`,
  );

  await announceShiftAutoPaused(pausedShift);

  return pausedShift;
};

const performShiftComplete = async ({ projectId, shiftId } = {}) => {
  let targetShiftId = shiftId || null;
  let targetShift = null;

  if (!targetShiftId) {
    targetShift = await shiftService.getCurrent(projectId || undefined);
    targetShiftId = getShiftId(targetShift);
  }

  if (!targetShiftId) {
    return null;
  }

  const completedShift =
    (await shiftService.complete(targetShiftId, {
      reason: "project_switched",
      source: "mobile_project_switch",
      // The app posts its own message in the user's language.
      notifyUser: false,
    })) || targetShift;

  // Completing here always means the worker switched project (the geofence-exit
  // path pauses instead of completing), so the message must say the project was
  // switched, not that they left the area.
  await announceShiftAutoCompleted(completedShift, {
    reason: "project_switched",
  });

  return completedShift;
};

// Queued public API.

export const handleShiftEnter = (options) => {
  // Backwards-compatible with the previous positional signature.
  const normalized =
    typeof options === "string" ? { projectId: options } : options || {};

  return runExclusive(() => performShiftEnter(normalized));
};

export const handleShiftExit = (options) => {
  const normalized =
    typeof options === "string" ? { projectId: options } : options || {};

  return runExclusive(() => performShiftExit(normalized));
};

// Switching project finishes the old project's shift for good, then hands the
// new project to the normal enter logic — which resumes today's shift for it or
// starts a fresh one. Both steps run inside one queued operation so a start for
// B can never overtake the complete for A.
export const handleProjectSwitch = ({
  fromProjectId,
  fromShiftId,
  toProjectId,
  toProject,
  isWithinTargetArea = false,
} = {}) =>
  runExclusive(async () => {
    const completedShift = await performShiftComplete({
      projectId: fromProjectId,
      shiftId: fromShiftId,
    });

    if (!toProjectId || !isWithinTargetArea) {
      return { completedShift, startedShift: null };
    }

    const startedShift = await performShiftEnter({
      projectId: toProjectId,
      project: toProject,
    });

    return { completedShift, startedShift };
  });

// De-dupe helper used by the two background tasks before dispatching. The
// handlers above are idempotent on their own; this only avoids redundant API
// calls when the OS redelivers a transition or the GPS flaps at the boundary.
export const isDuplicateTransition = (direction, projectId, nowMs) =>
  shouldSkipTransition(direction, projectId, nowMs);
