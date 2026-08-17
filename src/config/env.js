// Single source of truth for environment-derived config.
// The API base URL comes from EXPO_PUBLIC_API_URL, falling back to production.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.byggexp.se";
