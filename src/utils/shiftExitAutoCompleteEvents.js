const autoCompletedListeners = new Set();
const autoStartedListeners = new Set();
const autoResumedListeners = new Set();
const autoPausedListeners = new Set();
const checkErrorListeners = new Set();
const geofenceResyncListeners = new Set();

export const subscribeToShiftAutoCompleted = (listener) => {
  autoCompletedListeners.add(listener);

  return () => {
    autoCompletedListeners.delete(listener);
  };
};

export const emitShiftAutoCompleted = async (shift, meta) => {
  await Promise.allSettled(
    Array.from(autoCompletedListeners).map((listener) => listener(shift, meta)),
  );
};

export const subscribeToShiftAutoStarted = (listener) => {
  autoStartedListeners.add(listener);

  return () => {
    autoStartedListeners.delete(listener);
  };
};

export const emitShiftAutoStarted = async (shift) => {
  await Promise.allSettled(
    Array.from(autoStartedListeners).map((listener) => listener(shift)),
  );
};

export const subscribeToShiftAutoResumed = (listener) => {
  autoResumedListeners.add(listener);

  return () => {
    autoResumedListeners.delete(listener);
  };
};

export const emitShiftAutoResumed = async (shift) => {
  await Promise.allSettled(
    Array.from(autoResumedListeners).map((listener) => listener(shift)),
  );
};

export const subscribeToShiftAutoPaused = (listener) => {
  autoPausedListeners.add(listener);

  return () => {
    autoPausedListeners.delete(listener);
  };
};

export const emitShiftAutoPaused = async (shift) => {
  await Promise.allSettled(
    Array.from(autoPausedListeners).map((listener) => listener(shift)),
  );
};

// Fired right after a shift is started or resumed so the location monitor can
// immediately re-point the OS geofence at that shift's project. Without it the
// persisted geofence target only catches up on the next interval tick, so a
// worker who starts a shift on a new project and leaves at once is measured
// against the PREVIOUS project's area and never gets auto-paused.
export const subscribeToGeofenceResyncRequest = (listener) => {
  geofenceResyncListeners.add(listener);

  return () => {
    geofenceResyncListeners.delete(listener);
  };
};

export const emitGeofenceResyncRequest = async () => {
  await Promise.allSettled(
    Array.from(geofenceResyncListeners).map((listener) => listener()),
  );
};

export const subscribeToShiftLocationCheckError = (listener) => {
  checkErrorListeners.add(listener);

  return () => {
    checkErrorListeners.delete(listener);
  };
};

export const emitShiftLocationCheckError = async (error) => {
  await Promise.allSettled(
    Array.from(checkErrorListeners).map((listener) => listener(error)),
  );
};
