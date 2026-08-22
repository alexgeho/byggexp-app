import { shiftService } from "../services";
import { captureException } from "./sentry";

// The backend allows only one shift per project per day. When one already
// exists it rejects `POST /shifts/start` and asks the client to resume that
// shift instead ("A shift for this project already exists today. Resume it
// instead."). Recognising that specific conflict lets the app recover on its
// own rather than surfacing the message as an error dialog.
export const isShiftAlreadyExistsError = (error) => {
  if (error?.response?.status === 409) {
    return true;
  }

  const message = String(
    error?.response?.data?.message || error?.message || "",
  );

  return /already exists/i.test(message) || /resume it instead/i.test(message);
};

// `POST /shifts/:id/resume` is rejected when the shift is no longer paused —
// typically because the geofence monitor already resumed it a moment earlier.
// Recognising it lets the app reconcile instead of showing a state error the
// user can do nothing about.
export const isShiftNotPausedError = (error) => {
  const message = String(
    error?.response?.data?.message || error?.message || "",
  );

  return (
    /only.*paused/i.test(message) ||
    /paused.*can be resumed/i.test(message) ||
    /not paused/i.test(message)
  );
};

// Mirror of isShiftNotPausedError for the opposite transition: pausing a shift
// the geofence monitor already paused when the worker left the area.
export const isShiftNotActiveError = (error) => {
  const message = String(
    error?.response?.data?.message || error?.message || "",
  );

  return (
    /only.*active/i.test(message) ||
    /active.*can be paused/i.test(message) ||
    /not active/i.test(message)
  );
};

const getShiftId = (shift) => shift?.id || shift?._id || null;

// Locate the shift the backend refused to duplicate.
//
// The project-scoped lookup is the expected path. It is backed up by the
// unscoped one because `/shifts/current` filtering paused shifts out of the
// scoped response would otherwise leave the app unable to address a shift the
// backend insists exists — and it would show the very error dialog this
// recovery exists to avoid.
export const findExistingShiftForProject = async (projectId) => {
  const scopedShift = await shiftService
    .getCurrent(projectId)
    .catch(() => null);
  if (getShiftId(scopedShift)) {
    return scopedShift;
  }

  const unscopedShift = await shiftService.getCurrent().catch(() => null);
  if (
    getShiftId(unscopedShift) &&
    (!unscopedShift.projectId || unscopedShift.projectId === projectId)
  ) {
    return unscopedShift;
  }

  return null;
};

// Recovery failed: the backend says today's shift exists but the app cannot
// reach it. Report it so the cause is visible in crash reporting rather than
// only as a user complaint.
export const reportUnrecoverableShiftConflict = (projectId, error) => {
  captureException(error, {
    reason: "shift_conflict_unrecoverable",
    projectId,
    detail:
      "Backend rejected /shifts/start as a duplicate, but /shifts/current returned no shift to resume.",
  });
};

export default isShiftAlreadyExistsError;
