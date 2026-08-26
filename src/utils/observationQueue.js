// Serializes whole geofence observations: read state, evaluate, dispatch the
// transition, write state back.
//
// Deliberately separate from shiftTransitionQueue. That one guards the shift
// mutations themselves and is taken *inside* handleShiftEnter/handleShiftExit,
// which an observation calls. Reusing it here would mean a nested acquire of a
// single-slot, non-reentrant queue — an immediate deadlock.
//
// Two writers share the persisted geofence state (the Android foreground
// service task and the in-app monitor). Without this the read-modify-write
// straddles an await on the network call, so two concurrent readings could both
// see the same confirmation count and both dispatch.

const noop = () => undefined;

let tail = Promise.resolve();

export const runObservationExclusive = (operation) => {
  const result = tail.then(() => operation());

  // The chain must survive a rejected operation, otherwise one failed
  // observation would permanently reject every one queued after it.
  tail = result.then(noop, noop);

  return result;
};

// Test seam: drops any pending chain so specs start from a clean slot.
export const resetObservationQueue = () => {
  tail = Promise.resolve();
};
