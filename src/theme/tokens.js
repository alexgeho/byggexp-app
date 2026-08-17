// Design tokens — the single source of truth for spacing, radius, typography
// and semantic content colours. Palette-agnostic (light-first); dark overrides
// can be layered on later. Values were consolidated from the ~137 hard-coded
// colours previously scattered across screens.

// 4pt spacing scale.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};

// Font sizes on an iOS-ish type scale. Pair with theme.text.fontFamily.*.
export const fontSize = {
  caption: 12,
  footnote: 13,
  body: 14,
  callout: 15,
  subhead: 16,
  title: 17,
  h2: 20,
  h1: 24,
};

export const fontWeight = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
};

// Semantic content colours (light theme). Chrome colours (primary, background,
// card…) stay on the per-palette `theme.colors`.
// Light semantic content tokens (default). Dark equivalents live in
// `darkContent`; each theme picks one (see theme/themes.js) and components read
// them via `theme.content.*` so they follow the active theme.
export const lightContent = {
  scheme: "light", // lets components branch light/dark glass effects
  // Text
  textPrimary: "#052D50", // headings / primary text (navy)
  textSecondary: "#687898", // labels
  textMuted: "#667E93", // subtitles / meta
  placeholder: "#A7B3C2",
  onAccent: "#FFFFFF",

  // Surfaces
  surface: "#FFFFFF",
  surfaceMuted: "rgba(255,255,255,0.6)", // frosted cards
  inputSurface: "#052D500D", // muted field / filter pill background
  background: "#EEEEEE", // app screen background (Figma)

  // Lines
  divider: "#E9E9E9",
  border: "#E7ECF0",

  // Accent
  accent: "#0785F4",
  accentSoft: "#0785F41A",

  // States (foreground + soft background pairs)
  danger: "#FF3B30",
  dangerSoft: "#FF3B301F",
  success: "#248A3D",
  successSoft: "#34C75924",
  warning: "#C77700",
  warningSoft: "#FF95001F",

  // Presence/status badge colours — exact values from the Figma design
  // (solid text + dot, opaque tinted pill background).
  statusAtWork: "#04B251",
  statusAtWorkSoft: "#E5F7EA",
  statusNotAtWork: "#FC1D2C",
  statusNotAtWorkSoft: "#FFDCDE",
  statusWaiting: "#0C77FD",
  statusWaitingSoft: "#EBF4FE",
  // Off-duty has no Figma reference — neutral slate, matching the muted meta text.
  statusOffDuty: "#667E93",
  statusOffDutySoft: "#667E931A",
};

// Dark semantic content tokens — used by the "black" theme. Values are aligned
// with the dark palette (background #1C1C1C, card #232323, white text) and the
// status pills use translucent tints that read on dark surfaces.
export const darkContent = {
  scheme: "dark",
  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#AEB9C6",
  textMuted: "#8A97A6",
  placeholder: "#6B7683",
  onAccent: "#FFFFFF",

  // Surfaces — card sits a step above the near-black background for separation.
  surface: "#2C2C2E",
  surfaceMuted: "rgba(255,255,255,0.10)",
  inputSurface: "rgba(255,255,255,0.08)",
  background: "#141414",

  // Lines
  divider: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.20)",

  // Accent
  accent: "#3097F7",
  accentSoft: "rgba(48,151,247,0.20)",

  // States
  danger: "#FF6B6B",
  dangerSoft: "rgba(255,69,58,0.22)",
  success: "#32D74B",
  successSoft: "rgba(50,215,75,0.20)",
  warning: "#FFD60A",
  warningSoft: "rgba(255,214,10,0.18)",

  // Presence/status badges — brighter foregrounds + translucent pills for dark.
  statusAtWork: "#3DDC84",
  statusAtWorkSoft: "rgba(4,178,81,0.22)",
  statusNotAtWork: "#FF6B6B",
  statusNotAtWorkSoft: "rgba(252,29,44,0.22)",
  statusWaiting: "#4DA3FF",
  statusWaitingSoft: "rgba(12,119,253,0.24)",
  statusOffDuty: "#8A97A6",
  statusOffDutySoft: "rgba(255,255,255,0.10)",
};

// Back-compat: existing `import { content }` sites keep the light values until
// they migrate to `theme.content.*`. New code should read `theme.content`.
export const content = lightContent;

export const tokens = { spacing, radius, fontSize, fontWeight, content };

export default tokens;
