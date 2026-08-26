import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import { addBreadcrumb, captureException, captureMessage } from "./sentry";

// Diagnostics for the geofence monitor.
//
// Two channels, deliberately different in what they carry:
//
//   logcat   full numbers, for `adb logcat -s ReactNativeJS` during on-device
//            testing. Never leaves the phone.
//   Sentry   breadcrumbs only, with distance and accuracy reduced to buckets.
//            Enough to reconstruct why a transition did or did not happen,
//            without recording where anyone actually was.
//
// The previous build logged to logcat only, which is useless once the device is
// out of reach — every field report had to be reproduced from scratch.

export const SHIFT_GEOFENCE_LOG_TAG = "[geofence]";

const round = (value) =>
  typeof value === "number" && Number.isFinite(value) ? Math.round(value) : "?";

// Coarse buckets: they answer "was the fix usable" and "was the worker near or
// far" without being a location trail.
const bucketMeters = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "unknown";
  }

  const thresholds = [50, 100, 200, 500, 1000, 2000];
  const match = thresholds.find((limit) => value <= limit);

  return match ? `<=${match}m` : ">2000m";
};

export const logGeofenceFix = ({
  distanceMeters,
  accuracyMeters,
  radiusMeters,
  verdict,
  previousState,
  transition,
}) => {
  const was =
    previousState?.inside === null || previousState?.inside === undefined
      ? "-"
      : String(previousState.inside);

  if (shiftLocationPolicy.debugLoggingEnabled) {
    console.log(
      `${SHIFT_GEOFENCE_LOG_TAG} d=${round(distanceMeters)}m acc=${round(
        accuracyMeters,
      )}m r=${round(radiusMeters)}m -> ${verdict} | was=${was} pending=${
        previousState?.pendingVerdict || "-"
      } (${previousState?.pendingCount || 0}) | act=${transition || "none"}`,
    );
  }

  addBreadcrumb({
    category: "geofence",
    message: `fix -> ${verdict}${transition ? ` (act ${transition})` : ""}`,
    level: transition ? "info" : "debug",
    data: {
      distance: bucketMeters(distanceMeters),
      accuracy: bucketMeters(accuracyMeters),
      radius: round(radiusMeters),
      verdict,
      was,
      pendingCount: previousState?.pendingCount || 0,
      transition: transition || "none",
    },
  });
};

export const logGeofenceTarget = (target) => {
  if (shiftLocationPolicy.debugLoggingEnabled) {
    console.log(
      `${SHIFT_GEOFENCE_LOG_TAG} monitoring project=${target?.projectId} lat=${target?.latitude} lng=${target?.longitude} r=${target?.radius}m`,
    );
  }

  // Coordinates stay out of Sentry; the radius alone explains most "why did it
  // not trigger" reports.
  addBreadcrumb({
    category: "geofence",
    message: "monitoring registered",
    level: "info",
    data: { projectId: target?.projectId, radius: round(target?.radius) },
  });
};

// The foreground check took over because the background monitor stopped
// producing usable fixes. Worth seeing: it means Doze or an OEM task killer is
// interfering on that device.
export const reportBackgroundMonitorStale = ({ silentForMs }) => {
  if (shiftLocationPolicy.debugLoggingEnabled) {
    console.log(
      `${SHIFT_GEOFENCE_LOG_TAG} background monitor silent for ${round(
        silentForMs,
      )}ms, foreground check taking over`,
    );
  }

  addBreadcrumb({
    category: "geofence",
    message: "background monitor stale, foreground takeover",
    level: "warning",
    data: { silentFor: bucketMeters(silentForMs / 1000) },
  });
};

// A transition the backend never accepted, after every retry. The shift is now
// out of sync with the server until something else reconciles it.
export const reportTransitionExhausted = ({
  direction,
  projectId,
  attempts,
  error,
}) => {
  if (shiftLocationPolicy.debugLoggingEnabled) {
    console.log(
      `${SHIFT_GEOFENCE_LOG_TAG} giving up on ${direction} after ${attempts} attempts`,
    );
  }

  if (error) {
    captureException(error, {
      reason: "geofence_transition_exhausted",
      direction,
      projectId,
      attempts,
    });
    return;
  }

  captureMessage("geofence transition exhausted", {
    reason: "geofence_transition_exhausted",
    direction,
    projectId,
    attempts,
  });
};
