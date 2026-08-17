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
export const content = {
  // Text
  textPrimary: "#052D50", // headings / primary text (navy)
  textSecondary: "#687898", // labels
  textMuted: "#667E93", // subtitles / meta
  placeholder: "#A7B3C2",
  onAccent: "#FFFFFF",

  // Surfaces
  surface: "#FFFFFF",
  surfaceMuted: "rgba(255,255,255,0.6)", // frosted cards
  background: "#F2F1F6",

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

export const tokens = { spacing, radius, fontSize, fontWeight, content };

export default tokens;
