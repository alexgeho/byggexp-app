// Single source of truth for environment-derived config.
// The API base URL comes from EXPO_PUBLIC_API_URL, falling back to production.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.byggexp.se";

// Resolve a possibly-relative asset/avatar path against the API host.
export const resolveAssetUrl = (value) => {
  if (!value) {
    return null;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};
