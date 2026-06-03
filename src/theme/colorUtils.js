import { iconBadgeBackgroundAlpha } from "./settings";

export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== "string") {
    return hex;
  }

  const normalized = hex.replace("#", "").trim();

  if (normalized.length === 8) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (expanded.length !== 6) {
    return hex;
  }

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function iconBadgeBackground(color) {
  return hexToRgba(color, iconBadgeBackgroundAlpha);
}
