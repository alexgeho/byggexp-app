const autoCompletedListeners = new Set();
const autoStartedListeners = new Set();
const autoResumedListeners = new Set();
const autoPausedListeners = new Set();
const checkErrorListeners = new Set();

export const subscribeToShiftAutoCompleted = (listener) => {
  autoCompletedListeners.add(listener);

  return () => {
    autoCompletedListeners.delete(listener);
  };
};

export const emitShiftAutoCompleted = async (shift) => {
  await Promise.allSettled(
    Array.from(autoCompletedListeners).map((listener) => listener(shift)),
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
