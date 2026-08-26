// Decides whether a location fix really puts the worker inside or outside the
// project area, and tracks the lifecycle of the resulting transition.
//
// The Android background monitor originally compared the raw distance against
// the radius and nothing else. Indoors the fused provider derives a position
// from Wi-Fi and cell towers with an accuracy of hundreds of metres, so a
// phone lying still on a table reports coordinates that wander across the
// boundary and toggled the shift between paused and resumed on its own.
//
// Three guards decide a single fix:
//
//   1. accuracy band  - a fix only counts when its whole uncertainty circle is
//                       unambiguously on one side; otherwise it says nothing
//   2. hysteresis     - leaving needs a bit more distance than entering, so a
//                       position parked on the boundary cannot flip
//   3. confirmation   - a state change needs several consecutive readings that
//                       agree, so one outlier cannot move the shift
//
// A confirmed transition is then treated as a transaction: `inside` is only
// committed once the backend accepted the pause/resume. A failed call leaves a
// pending transition that is retried with backoff, so a single network blip can
// no longer wedge the state and silence the monitor for the rest of the day.
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

// Delay before each retry of a transition the backend refused or never
// received. The last entry repeats once the list runs out.
export const TRANSITION_RETRY_BACKOFF_MS = [30_000, 60_000, 120_000, 300_000];

// After this many failed attempts the transition is dropped and reported, so a
// permanently failing call cannot retry forever.
export const MAX_TRANSITION_ATTEMPTS = 5;

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

export const createInitialGeofenceState = (projectId = null) => ({
  // The project this state describes. Monitoring one project must never inherit
  // the inside/outside history of another, and an in-flight call for the old
  // project must not be able to write its result back after a switch.
  projectId,
  inside: null,
  pendingVerdict: null,
  pendingCount: 0,
  // Any callback from the OS, usable or not. Only useful for diagnosing whether
  // the service is running at all.
  lastCallbackAt: null,
  // The last callback that actually produced a verdict. Staleness is measured
  // against this: a service that keeps delivering fixes too coarse to judge is
  // running but blind, and the foreground check has to take over just the same.
  lastUsableFixAt: null,
  // { direction, attempts, nextAttemptAt } while a confirmed transition has not
  // been accepted by the backend yet.
  pendingTransition: null,
});

// Records that a callback arrived. `usable` marks whether it produced a verdict.
export const markGeofenceCallback = (state, nowMs, usable) => {
  const current = state || createInitialGeofenceState();

  return {
    ...current,
    lastCallbackAt: nowMs,
    lastUsableFixAt: usable ? nowMs : current.lastUsableFixAt,
  };
};

// Folds one verdict into the stored state.
//
// A confirmed change does NOT flip `inside`. It records a pending transition for
// the caller to dispatch; `inside` moves only in commitGeofenceTransition, after
// the backend confirmed it. An unknown verdict leaves the pending run untouched:
// it carries no information, so it neither confirms nor resets a streak.
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

  // Already in this state. Clear any half-finished streak in the other
  // direction, and drop a pending transition that this reading contradicts —
  // the worker came back before the earlier one ever went through.
  if (current.inside === verdictInside) {
    return {
      state: {
        ...current,
        pendingVerdict: null,
        pendingCount: 0,
        pendingTransition:
          current.pendingTransition?.direction === verdict
            ? current.pendingTransition
            : null,
      },
      transition: null,
    };
  }

  // A transition in this direction is already queued for retry; let the retry
  // path own it instead of starting a second one.
  if (current.pendingTransition?.direction === verdict) {
    return { state: current, transition: null };
  }

  const pendingCount =
    current.pendingVerdict === verdict ? current.pendingCount + 1 : 1;

  if (pendingCount < confirmationsRequired) {
    return {
      state: { ...current, pendingVerdict: verdict, pendingCount },
      transition: null,
    };
  }

  return {
    state: {
      ...current,
      pendingVerdict: null,
      pendingCount: 0,
      pendingTransition: {
        direction: verdict,
        attempts: 0,
        nextAttemptAt: 0,
        projectId: current.projectId ?? null,
      },
    },
    transition: verdict,
  };
};

// The backend accepted the transition: this is the only place `inside` moves.
export const commitGeofenceTransition = (state, direction) => {
  const current = state || createInitialGeofenceState();

  return {
    ...current,
    inside: direction === GEOFENCE_INSIDE,
    pendingVerdict: null,
    pendingCount: 0,
    pendingTransition: null,
  };
};

// The call failed. Schedule a retry, or give up after MAX_TRANSITION_ATTEMPTS.
// `exhausted` tells the caller to report it rather than keep trying.
export const failGeofenceTransition = (state, direction, nowMs) => {
  const current = state || createInitialGeofenceState();
  const attempts = (current.pendingTransition?.attempts || 0) + 1;

  if (attempts >= MAX_TRANSITION_ATTEMPTS) {
    return {
      state: { ...current, pendingTransition: null },
      exhausted: true,
      attempts,
    };
  }

  const backoff =
    TRANSITION_RETRY_BACKOFF_MS[
      Math.min(attempts - 1, TRANSITION_RETRY_BACKOFF_MS.length - 1)
    ];

  return {
    state: {
      ...current,
      pendingTransition: {
        direction,
        attempts,
        nextAttemptAt: nowMs + backoff,
        projectId: current.projectId ?? null,
      },
    },
    exhausted: false,
    attempts,
  };
};

// The direction to retry right now, or null when nothing is due.
export const getDueTransition = (state, nowMs) => {
  const pending = state?.pendingTransition;

  if (!pending?.direction) {
    return null;
  }

  return nowMs >= (pending.nextAttemptAt || 0) ? pending.direction : null;
};

// Reads the persisted state, tolerating the older formats so an app updating in
// place does not lose track of where the worker was.
export const parseGeofenceState = (raw) => {
  if (raw === null || raw === undefined) {
    return createInitialGeofenceState();
  }

  if (raw === "1" || raw === "0") {
    return { ...createInitialGeofenceState(), inside: raw === "1" };
  }

  try {
    const parsed = JSON.parse(raw);
    const pending = parsed?.pendingTransition;

    return {
      projectId: parsed?.projectId ?? null,
      inside: typeof parsed?.inside === "boolean" ? parsed.inside : null,
      pendingVerdict: parsed?.pendingVerdict ?? null,
      pendingCount: Number(parsed?.pendingCount) || 0,
      // `lastFixAt` is the pre-split field name; treat it as a usable fix so an
      // in-place update does not immediately look stale.
      lastCallbackAt:
        Number(parsed?.lastCallbackAt) || Number(parsed?.lastFixAt) || null,
      lastUsableFixAt:
        Number(parsed?.lastUsableFixAt) || Number(parsed?.lastFixAt) || null,
      pendingTransition: pending?.direction
        ? {
            direction: pending.direction,
            attempts: Number(pending.attempts) || 0,
            nextAttemptAt: Number(pending.nextAttemptAt) || 0,
            projectId: pending.projectId ?? parsed?.projectId ?? null,
          }
        : null,
    };
  } catch {
    return createInitialGeofenceState();
  }
};

export const serializeGeofenceState = (state) => JSON.stringify(state);
