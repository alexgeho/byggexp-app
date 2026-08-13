import AsyncStorage from "@react-native-async-storage/async-storage";

// Persisted record of the last geofence transition per project.
//
// The previous implementation kept this in module-level maps, which meant the
// state was lost on every app restart and was not shared between the foreground
// monitor and the headless background task (they can run in separate JS
// contexts). Persisting it makes the de-dupe survive both.
//
// De-duplication here is an optimisation to avoid pointless API chatter only —
// the transition handlers are idempotent on their own, because they read the
// current shift from the server before deciding what to do.

export const SHIFT_TRANSITION_LOG_KEY = "shiftGeofenceTransitionLog";

// The OS can redeliver the same transition several times; ignore repeats of the
// same direction inside this window.
export const DUPLICATE_WINDOW_MS = 3 * 60 * 1000;

// Damps GPS flapping right at the geofence boundary. Short enough that a real
// return to the site still resumes the shift promptly.
export const OSCILLATION_WINDOW_MS = 30 * 1000;

const readLog = async () => {
  try {
    const raw = await AsyncStorage.getItem(SHIFT_TRANSITION_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeLog = async (log) => {
  try {
    await AsyncStorage.setItem(SHIFT_TRANSITION_LOG_KEY, JSON.stringify(log));
  } catch {
    // Best-effort: losing the log only costs a redundant API call.
  }
};

// Returns true when the caller should skip this transition. Records the
// transition as handled when it returns false.
export const shouldSkipTransition = async (direction, projectId, nowMs) => {
  if (!projectId) {
    return false;
  }

  const log = await readLog();
  const previous = log[projectId];
  const elapsed = previous ? nowMs - previous.atMs : Number.POSITIVE_INFINITY;

  if (previous) {
    if (previous.direction === direction && elapsed < DUPLICATE_WINDOW_MS) {
      return true;
    }

    if (previous.direction !== direction && elapsed < OSCILLATION_WINDOW_MS) {
      return true;
    }
  }

  log[projectId] = { direction, atMs: nowMs };
  await writeLog(log);

  return false;
};

// Called when the user explicitly switches project so the new project is not
// judged against a stale transition from a previous session.
export const clearTransitionLogForProject = async (projectId) => {
  if (!projectId) {
    return;
  }

  const log = await readLog();
  if (!(projectId in log)) {
    return;
  }

  delete log[projectId];
  await writeLog(log);
};

export const clearTransitionLog = async () => {
  try {
    await AsyncStorage.removeItem(SHIFT_TRANSITION_LOG_KEY);
  } catch {
    // Best-effort.
  }
};
