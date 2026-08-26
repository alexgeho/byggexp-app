import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  GEOFENCE_INSIDE,
  GEOFENCE_SOURCE_FOREGROUND,
  GEOFENCE_UNKNOWN,
  commitGeofenceTransition,
  createInitialGeofenceState,
  evaluateGeofencePosition,
  failGeofenceTransition,
  getDueTransition,
  isImplausibleJump,
  markGeofenceCallback,
  parseGeofenceState,
  reduceGeofenceState,
  serializeGeofenceState,
} from "./geofenceEvaluation";
import {
  logGeofenceFix,
  reportTransitionExhausted,
} from "./shiftGeofenceDebug";
import { runObservationExclusive } from "./observationQueue";
import {
  handleShiftEnter,
  handleShiftExit,
} from "../tasks/shiftAutoTransition";

// The single place a location reading turns into a shift transition.
//
// Both monitors funnel through here: the Android foreground-service task and
// the in-app monitor that takes over when that service goes quiet. They
// therefore share one accuracy band, one hysteresis margin, one confirmation
// counter and one persisted state.
//
// Every entry point runs inside the observation queue, so the whole
// read → evaluate → dispatch → write sequence is atomic against the other
// writer. The queue is separate from shiftTransitionQueue, which
// handleShiftEnter/handleShiftExit take internally; sharing one would deadlock.

// The monitored project's geofence and the evaluated state. Names are
// referenced from backgroundGeofence.js and the task; keep them stable.
export const SHIFT_LOCATION_TARGET_KEY = "shiftLocationTarget";
export const SHIFT_LOCATION_INSIDE_KEY = "shiftLocationInside";

const readState = async () =>
  parseGeofenceState(
    await AsyncStorage.getItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => null),
  );

const writeState = async (state) => {
  await AsyncStorage.setItem(
    SHIFT_LOCATION_INSIDE_KEY,
    serializeGeofenceState(state),
  ).catch(() => {});
};

// Reads outside the queue are fine for diagnostics; anything that then writes
// has to go through runObservationExclusive.
export const readGeofenceState = readState;

// Clearing shares the key with observations, so it queues too — otherwise a
// reset could land between an observation's read and its write and be undone.
export const clearGeofenceState = () =>
  runObservationExclusive(async () => {
    await AsyncStorage.removeItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => {});
  });

// Sends one transition and folds the outcome back into the state. `inside` only
// moves on success; a failure schedules a retry instead of pretending the shift
// already changed, which used to wedge the monitor for the rest of the day.
//
// No de-dupe guard here on purpose: handleShiftEnter/handleShiftExit re-read the
// server's current shift and are idempotent, and a guard that recorded the
// attempt before the call could report "already handled" for a transition the
// backend never accepted, committing `inside` on a lie.
const dispatchTransition = async ({ state, direction, projectId, nowMs }) => {
  try {
    if (direction === GEOFENCE_INSIDE) {
      await handleShiftEnter({ projectId });
    } else {
      await handleShiftExit({ projectId });
    }

    return { state: commitGeofenceTransition(state, direction), error: null };
  } catch (error) {
    const {
      state: nextState,
      exhausted,
      attempts,
    } = failGeofenceTransition(state, direction, nowMs);

    if (exhausted) {
      reportTransitionExhausted({ direction, projectId, attempts, error });
    }

    return { state: nextState, error };
  }
};

// Monitoring a different project must not inherit the previous one's history: a
// stale `inside` would suppress the first real transition for the new area.
const scopeToProject = (state, projectId) =>
  state.projectId && state.projectId !== projectId
    ? createInitialGeofenceState(projectId)
    : { ...state, projectId: state.projectId ?? projectId };

export const runGeofenceObservation = ({
  distanceMeters,
  accuracyMeters,
  radiusMeters,
  projectId,
  // Defaults to foreground: only shiftLocationUpdatesTask may claim its
  // readings prove the background service is alive.
  source = GEOFENCE_SOURCE_FOREGROUND,
  nowMs = Date.now(),
}) =>
  runObservationExclusive(async () => {
    const storedState = scopeToProject(await readState(), projectId);

    // Evaluate first. The freshest reading decides whether a queued retry is
    // still meaningful — replaying a stale "you left" after the worker walked
    // back in would pause a shift that should be running.
    const rawVerdict = evaluateGeofencePosition({
      distanceMeters,
      accuracyMeters,
      radiusMeters,
    });

    // Discard "teleports": a fix implying impossibly fast travel from the last
    // trusted position is indoor Wi-Fi noise, not the worker leaving. Measured
    // against the last trusted position, so a run of bad fixes is dropped too.
    const verdict =
      rawVerdict !== GEOFENCE_UNKNOWN &&
      isImplausibleJump({
        distanceMeters,
        lastDistanceMeters: storedState.lastTrustedDistanceMeters,
        lastFixAt: storedState.lastTrustedAt,
        nowMs,
      })
        ? GEOFENCE_UNKNOWN
        : rawVerdict;

    const usable = verdict !== GEOFENCE_UNKNOWN;
    const observedState = {
      ...markGeofenceCallback(storedState, nowMs, usable, source),
      // Advance the trusted position only on a fix we accepted, so the next
      // jump is always measured from the last position we believed.
      lastTrustedDistanceMeters: usable
        ? distanceMeters
        : storedState.lastTrustedDistanceMeters,
      lastTrustedAt: usable ? nowMs : storedState.lastTrustedAt,
    };
    const { state: reducedState, transition } = reduceGeofenceState(
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

    if (transition) {
      const { state: dispatchedState, error } = await dispatchTransition({
        state: reducedState,
        direction: transition,
        projectId,
        nowMs,
      });

      await writeState(dispatchedState);
      return { verdict, transition, error };
    }

    const pending = reducedState.pendingTransition;
    const dueDirection = getDueTransition(reducedState, nowMs);

    // A usable reading that points the other way invalidates the queued
    // transition; let the confirmation counter replace it rather than sending
    // something the device no longer believes.
    const contradicted =
      verdict !== GEOFENCE_UNKNOWN && pending && verdict !== pending.direction;

    // A retry left over from another project is meaningless here.
    const foreign =
      pending?.projectId && pending.projectId !== projectId ? true : false;

    if (!dueDirection || contradicted || foreign) {
      await writeState(
        foreign ? { ...reducedState, pendingTransition: null } : reducedState,
      );
      return { verdict, transition: null };
    }

    const { state: retriedState, error } = await dispatchTransition({
      state: reducedState,
      direction: dueDirection,
      projectId,
      nowMs,
    });

    await writeState(retriedState);
    return { verdict, transition: dueDirection, error, isRetry: true };
  });
