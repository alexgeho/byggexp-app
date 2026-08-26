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

const bucketSeconds = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "never";
  }

  const seconds = Math.round(value / 1000);
  const thresholds = [60, 300, 900, 3600];
  const match = thresholds.find((limit) => seconds <= limit);

  return match ? `<=${match}s` : ">1h";
};

// The staleness check runs every 15 s, so an episode of silence would otherwise
// emit a breadcrumb four times a minute and push everything else out of the
// window Sentry keeps.
const STALE_REPORT_INTERVAL_MS = 5 * 60 * 1000;
let staleEpisodeActive = false;
let lastStaleReportAt = 0;

export const resetStaleReporting = () => {
  staleEpisodeActive = false;
  lastStaleReportAt = 0;
};

// The background monitor stopped producing usable fixes and the foreground
// check took over. Doze, battery optimisation or an OEM task killer is
// interfering on that device.
//
// The two ages are reported separately on purpose: a service that was killed
// stops calling back at all, while a service that is alive but blind keeps
// calling back with fixes too coarse to judge. Only the second one can be fixed
// in the app.
export const reportBackgroundMonitorStale = ({
  callbackAgeMs,
  usableFixAgeMs,
}) => {
  if (shiftLocationPolicy.debugLoggingEnabled) {
    console.log(
      `${SHIFT_GEOFENCE_LOG_TAG} stale: last callback ${round(
        callbackAgeMs,
      )}ms ago, last usable fix ${round(
        usableFixAgeMs,
      )}ms ago -> foreground takeover`,
    );
  }

  const data = {
    lastCallback: bucketSeconds(callbackAgeMs),
    lastUsableFix: bucketSeconds(usableFixAgeMs),
    // No callbacks at all points at a killed service; callbacks without usable
    // fixes point at Doze-grade accuracy.
    likely:
      callbackAgeMs === null || callbackAgeMs > STALE_REPORT_INTERVAL_MS
        ? "service_not_running"
        : "fixes_too_coarse",
  };

  addBreadcrumb({
    category: "geofence",
    message: "background monitor stale, foreground takeover",
    level: "warning",
    data,
  });

  // Breadcrumbs only travel attached to an event, and this path throws nothing.
  // Without an explicit message the whole episode would be invisible in Sentry —
  // exactly how the previous build ended up with no geofence telemetry at all.
  const nowMs = Date.now();
  const isNewEpisode = !staleEpisodeActive;
  const intervalElapsed = nowMs - lastStaleReportAt > STALE_REPORT_INTERVAL_MS;

  if (isNewEpisode || intervalElapsed) {
    staleEpisodeActive = true;
    lastStaleReportAt = nowMs;
    captureMessage("geofence background monitor stale", {
      reason: "geofence_monitor_stale",
      ...data,
    });
  }
};

// A usable fix arrived: the episode is over, so the next silence reports again.
export const noteBackgroundMonitorHealthy = () => {
  staleEpisodeActive = false;
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
