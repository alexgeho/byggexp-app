// Decides whether a location fix really puts the worker inside or outside the
// project area.
//
// The Android background monitor previously compared the raw distance against
// the radius and nothing else. Indoors the fused provider derives a position
// from Wi-Fi and cell towers with an accuracy of hundreds of metres, so a
// phone lying still on a table reports coordinates that wander across the
// boundary and toggled the shift between paused and resumed on its own.
//
// Three guards, applied in order:
//
//   1. accuracy band  - a fix only counts when its whole uncertainty circle is
//                       unambiguously on one side; otherwise it says nothing
//   2. hysteresis     - leaving needs a bit more distance than entering, so a
//                       position parked on the boundary cannot flip
//   3. confirmation   - a state change needs several consecutive readings that
//                       agree, so one outlier cannot move the shift
//
// iOS is unaffected: there the OS does its own region monitoring and applies
// the equivalent smoothing natively.

export const GEOFENCE_INSIDE = "inside";
export const GEOFENCE_OUTSIDE = "outside";
export const GEOFENCE_UNKNOWN = "unknown";

// A fix coarser than this cannot resolve a site-sized area at all.
export const MAX_USABLE_ACCURACY_METERS = 150;

// Extra distance required before a fix counts as "left the area".
export const EXIT_HYSTERESIS_METERS = 60;

// Consecutive agreeing readings needed before the state actually changes.
export const CONFIRMATIONS_REQUIRED = 2;

const isUsableNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

// Classifies a single fix. Returns GEOFENCE_UNKNOWN whenever the reading is too
// coarse or sits in the dead zone between the entry and exit thresholds, which
// means "this fix carries no information" rather than "the worker left".
export const evaluateGeofencePosition = ({
  distanceMeters,
  accuracyMeters,
  radiusMeters,
} = {}) => {
  if (
    !isUsableNumber(distanceMeters) ||
    !isUsableNumber(radiusMeters) ||
    radiusMeters <= 0
  ) {
    return GEOFENCE_UNKNOWN;
  }

  // A missing accuracy is treated as unusable, never as perfect.
  const accuracy = isUsableNumber(accuracyMeters)
    ? Math.max(0, accuracyMeters)
    : Number.POSITIVE_INFINITY;

  if (accuracy > Math.max(MAX_USABLE_ACCURACY_METERS, radiusMeters)) {
    return GEOFENCE_UNKNOWN;
  }

  if (distanceMeters + accuracy <= radiusMeters) {
    return GEOFENCE_INSIDE;
  }

  if (distanceMeters - accuracy > radiusMeters + EXIT_HYSTERESIS_METERS) {
    return GEOFENCE_OUTSIDE;
  }

  return GEOFENCE_UNKNOWN;
};

export const createInitialGeofenceState = () => ({
  inside: null,
  pendingVerdict: null,
  pendingCount: 0,
});

// Folds one verdict into the stored state.
//
// Returns the next state plus the transition to dispatch, or null when nothing
// should happen yet. An unknown verdict leaves the pending run untouched: it
// carries no information, so it neither confirms nor resets a streak.
export const reduceGeofenceState = (
  state,
  verdict,
  confirmationsRequired = CONFIRMATIONS_REQUIRED,
) => {
  const current = state || createInitialGeofenceState();

  if (verdict !== GEOFENCE_INSIDE && verdict !== GEOFENCE_OUTSIDE) {
    return { state: current, transition: null };
  }

  const verdictInside = verdict === GEOFENCE_INSIDE;

  // Already in this state: clear any half-finished streak in the other
  // direction so a later change starts counting from scratch.
  if (current.inside === verdictInside) {
    return {
      state: { inside: verdictInside, pendingVerdict: null, pendingCount: 0 },
      transition: null,
    };
  }

  const pendingCount =
    current.pendingVerdict === verdict ? current.pendingCount + 1 : 1;

  if (pendingCount < confirmationsRequired) {
    return {
      state: {
        inside: current.inside,
        pendingVerdict: verdict,
        pendingCount,
      },
      transition: null,
    };
  }

  return {
    state: { inside: verdictInside, pendingVerdict: null, pendingCount: 0 },
    transition: verdict,
  };
};

// Reads the persisted state, tolerating the older "1"/"0" format so an app
// updating in place does not lose track of where the worker was.
export const parseGeofenceState = (raw) => {
  if (raw === null || raw === undefined) {
    return createInitialGeofenceState();
  }

  if (raw === "1" || raw === "0") {
    return { inside: raw === "1", pendingVerdict: null, pendingCount: 0 };
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      inside: typeof parsed?.inside === "boolean" ? parsed.inside : null,
      pendingVerdict: parsed?.pendingVerdict ?? null,
      pendingCount: Number(parsed?.pendingCount) || 0,
    };
  } catch {
    return createInitialGeofenceState();
  }
};

export const serializeGeofenceState = (state) => JSON.stringify(state);
