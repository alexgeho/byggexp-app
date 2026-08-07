// Bridge for returning a project pick from the Projects screen back to the
// caller (e.g. ProjectFilterSelector) WITHOUT putting a callback function into
// navigation params. Functions in navigation params are non-serializable and
// flagged by React Navigation; keeping the callback here sidesteps that.
//
// Only one local selection can be in flight at a time (you open the picker
// from a single screen), so a single slot is enough.
let pendingHandler = null;

export const setLocalProjectSelectionHandler = (handler) => {
  pendingHandler = typeof handler === "function" ? handler : null;
};

export const resolveLocalProjectSelection = (project) => {
  const handler = pendingHandler;
  pendingHandler = null;
  if (handler) {
    handler(project);
  }
};
