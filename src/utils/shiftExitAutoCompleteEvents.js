const autoCompletedListeners = new Set();
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
