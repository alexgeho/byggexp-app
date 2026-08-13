// Serializes every shift state mutation (start / resume / pause / complete).
//
// Auto check-in/out can be triggered from several places at once: the
// foreground monitor timer, the AppState "active" callback, the Android
// foreground-service location task and the iOS region-monitoring task. Without
// serialization a `complete` still in flight could overlap a `start`, which is
// how a second shift ended up being requested for the same project/day.
//
// Every transition therefore runs through this single-slot queue, so the next
// one only begins once the previous has settled and can observe its result.

const noop = () => undefined;

let tail = Promise.resolve();

export const runExclusive = (operation) => {
  const result = tail.then(() => operation());

  // The chain must survive a rejected operation, otherwise one failed
  // transition would permanently reject every queued transition after it.
  tail = result.then(noop, noop);

  return result;
};

// Test seam: drops any pending chain so specs start from a clean slot.
export const resetShiftTransitionQueue = () => {
  tail = Promise.resolve();
};
