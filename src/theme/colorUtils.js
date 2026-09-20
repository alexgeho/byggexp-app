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

// Flatten a translucent colour onto an opaque backdrop, giving the same look
// as an opaque fill. The home cards are a white wash over the page gradient;
// the nav pill needs that exact tone but OPAQUE, or the card edges it overlaps
// show through it as broken lines.
export function flattenColor(color, backdrop) {
  const parse = (value) => {
    if (typeof value !== "string") return null;
    const rgba = value.trim().match(/^rgba?\(([^)]+)\)$/i);
    if (rgba) {
      const parts = rgba[1].split(",").map((part) => parseFloat(part.trim()));
      if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) {
        return null;
      }
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
    }
    const hex = value.replace("#", "").trim();
    const expand =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;
    if (expand.length !== 6 && expand.length !== 8) return null;
    return {
      r: parseInt(expand.slice(0, 2), 16),
      g: parseInt(expand.slice(2, 4), 16),
      b: parseInt(expand.slice(4, 6), 16),
      a: expand.length === 8 ? parseInt(expand.slice(6, 8), 16) / 255 : 1,
    };
  };

  const top = parse(color);
  if (!top) return color;
  if (top.a >= 1) return color;

  const bottom = parse(backdrop) || { r: 0, g: 0, b: 0, a: 1 };
  const mix = (a, b) => Math.round(a * top.a + b * (1 - top.a));

  return `rgb(${mix(top.r, bottom.r)}, ${mix(top.g, bottom.g)}, ${mix(top.b, bottom.b)})`;
}
