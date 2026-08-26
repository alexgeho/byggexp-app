import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  GEOFENCE_INSIDE,
  GEOFENCE_UNKNOWN,
  commitGeofenceTransition,
  evaluateGeofencePosition,
  failGeofenceTransition,
  getDueTransition,
  markGeofenceCallback,
  parseGeofenceState,
  reduceGeofenceState,
  serializeGeofenceState,
} from "./geofenceEvaluation";
import {
  logGeofenceFix,
  reportTransitionExhausted,
} from "./shiftGeofenceDebug";
import {
  SHIFT_ENTER,
  SHIFT_EXIT,
  handleShiftEnter,
  handleShiftExit,
  isDuplicateTransition,
} from "../tasks/shiftAutoTransition";

// The single place a location reading turns into a shift transition.
//
// Both monitors funnel through here: the Android foreground-service task and
// the in-app monitor that takes over when that service goes quiet. They
// therefore share one accuracy band, one hysteresis margin, one confirmation
// counter and one persisted state — previously the in-app path compared a raw
// distance against the radius and could contradict the background decision.

// The monitored project's geofence and the evaluated state. Names are
// referenced from backgroundGeofence.js and the task; keep them stable.
export const SHIFT_LOCATION_TARGET_KEY = "shiftLocationTarget";
export const SHIFT_LOCATION_INSIDE_KEY = "shiftLocationInside";

export const readGeofenceState = async () =>
  parseGeofenceState(
    await AsyncStorage.getItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => null),
  );

export const writeGeofenceState = async (state) => {
  await AsyncStorage.setItem(
    SHIFT_LOCATION_INSIDE_KEY,
    serializeGeofenceState(state),
  ).catch(() => {});
};

// Sends one transition and folds the outcome back into the state. `inside` only
// moves on success; a failure schedules a retry instead of pretending the shift
// already changed, which used to wedge the monitor for the rest of the day.
export const dispatchGeofenceTransition = async ({
  state,
  direction,
  projectId,
  nowMs,
  isRetry = false,
}) => {
  const isEnter = direction === GEOFENCE_INSIDE;

  try {
    // The de-dupe guard is an API-chatter optimisation; a retry has to bypass it
    // or the backoff would be swallowed by its own window.
    const skip =
      !isRetry &&
      (await isDuplicateTransition(
        isEnter ? SHIFT_ENTER : SHIFT_EXIT,
        projectId,
        nowMs,
      ));

    if (!skip) {
      if (isEnter) {
        await handleShiftEnter({ projectId });
      } else {
        await handleShiftExit({ projectId });
      }
    }

    return { state: commitGeofenceTransition(state, direction), failed: false };
  } catch (error) {
    const {
      state: nextState,
      exhausted,
      attempts,
    } = failGeofenceTransition(state, direction, nowMs);

    if (exhausted) {
      reportTransitionExhausted({ direction, projectId, attempts, error });
    }

    return { state: nextState, failed: true, error };
  }
};

// One reading, start to finish: retry anything the backend never accepted,
// otherwise evaluate the fix and act on a confirmed change.
export const runGeofenceObservation = async ({
  distanceMeters,
  accuracyMeters,
  radiusMeters,
  projectId,
  nowMs = Date.now(),
}) => {
  const storedState = await readGeofenceState();

  // A transition the backend never accepted takes priority over a fresh
  // reading: until it goes through, the app and the server disagree.
  const dueDirection = getDueTransition(storedState, nowMs);
  if (dueDirection) {
    const { state: retriedState, error } = await dispatchGeofenceTransition({
      state: storedState,
      direction: dueDirection,
      projectId,
      nowMs,
      isRetry: true,
    });

    await writeGeofenceState(markGeofenceCallback(retriedState, nowMs, false));

    return { verdict: GEOFENCE_UNKNOWN, transition: dueDirection, error };
  }

  const verdict = evaluateGeofencePosition({
    distanceMeters,
    accuracyMeters,
    radiusMeters,
  });

  const observedState = markGeofenceCallback(
    storedState,
    nowMs,
    verdict !== GEOFENCE_UNKNOWN,
  );
  const { state: nextState, transition } = reduceGeofenceState(
    observedState,
    verdict,
  );

  logGeofenceFix({
    distanceMeters,
    accuracyMeters,
    radiusMeters,
    verdict,
    previousState: storedState,
    transition,
  });

  if (!transition) {
    await writeGeofenceState(nextState);
    return { verdict, transition: null };
  }

  const { state: dispatchedState, error } = await dispatchGeofenceTransition({
    state: nextState,
    direction: transition,
    projectId,
    nowMs,
  });

  await writeGeofenceState(dispatchedState);

  return { verdict, transition, error };
};
