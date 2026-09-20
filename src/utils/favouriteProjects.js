import AsyncStorage from "@react-native-async-storage/async-storage";

// Projects the user pinned for quick access. A per-device preference, like the
// home layout — not account data, so it lives in storage rather than on the
// server. Pinned projects sort to the top of the projects list, which is also
// what the project filter opens.
const KEY = "favourite-project-ids";

export async function getFavouriteProjectIds() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function toggleFavouriteProject(projectId) {
  const id = String(projectId || "");
  if (!id) return [];
  const current = await getFavouriteProjectIds();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Worst case the pin doesn't survive a restart.
  }
  return next;
}

// Pinned first, everything else in the order it arrived.
export function sortByFavourite(items, favouriteIds, idOf) {
  const pinned = new Set(favouriteIds.map(String));
  return [...items].sort((left, right) => {
    const leftPinned = pinned.has(String(idOf(left)));
    const rightPinned = pinned.has(String(idOf(right)));
    if (leftPinned === rightPinned) return 0;
    return leftPinned ? -1 : 1;
  });
}
