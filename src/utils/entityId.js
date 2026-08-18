// Id helpers for Mongo-style entities that expose either `_id` or `id`.

// Stringified id (or "" when absent) — handy for React keys and equality
// checks against route params / selected-id state.
export const getEntityId = (entity) => {
  const id = entity?._id || entity?.id;
  return id ? String(id) : "";
};

// Like getEntityId, but also accepts a bare id/string reference and always
// returns a string ("" when nothing resolves) — used when a field may hold
// either a populated object or just its id.
export const normalizeRefId = (value) =>
  String(value?._id || value?.id || value || "");
