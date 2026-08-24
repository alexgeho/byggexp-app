import { shiftLocationPolicy } from "../config/shiftLocationPolicy";

// One compact line per location fix, so the decision the app made can be read
// back from `adb logcat -s ReactNativeJS` while testing on a real device.
//
// Format:
//   [geofence] d=340m acc=25m r=500m -> inside | was=true pending=- (0) | act=none
//
//   d    distance from the project centre
//   acc  accuracy reported by the OS for this fix
//   r    the monitored radius
//   ->   verdict for this fix: inside / outside / unknown (too coarse to tell)
//   was  the stored inside/outside state before this fix
//   act  the transition actually dispatched, if any

export const SHIFT_GEOFENCE_LOG_TAG = "[geofence]";

const round = (value) =>
  typeof value === "number" && Number.isFinite(value) ? Math.round(value) : "?";

export const logGeofenceFix = ({
  distanceMeters,
  accuracyMeters,
  radiusMeters,
  verdict,
  previousState,
  transition,
}) => {
  if (!shiftLocationPolicy.debugLoggingEnabled) {
    return;
  }

  const was =
    previousState?.inside === null || previousState?.inside === undefined
      ? "-"
      : String(previousState.inside);

  console.log(
    `${SHIFT_GEOFENCE_LOG_TAG} d=${round(distanceMeters)}m acc=${round(
      accuracyMeters,
    )}m r=${round(radiusMeters)}m -> ${verdict} | was=${was} pending=${
      previousState?.pendingVerdict || "-"
    } (${previousState?.pendingCount || 0}) | act=${transition || "none"}`,
  );
};

export const logGeofenceTarget = (target) => {
  if (!shiftLocationPolicy.debugLoggingEnabled) {
    return;
  }

  console.log(
    `${SHIFT_GEOFENCE_LOG_TAG} monitoring project=${target?.projectId} lat=${target?.latitude} lng=${target?.longitude} r=${target?.radius}m`,
  );
};
