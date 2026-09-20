import {
  blueColors,
  blackColors,
  lightBlueColors,
  lightGrayColors,
  colorfulColors,
} from "./colors";
import {
  spacing as spacingTokens,
  radius as radiusTokens,
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
  content as contentTokens,
  darkContent,
} from "./tokens";

function withIconBadgeBackground(colors) {
  return {
    ...colors,
    // iOS-style rows: no filled pill behind field icons — the glyph sits on the
    // row (FieldIcon renders it in the accent colour). Kept as a key so existing
    // `backgroundColor: primaryIconBadge` call sites simply render transparent.
    primaryIconBadge: "transparent",
  };
}

const common = {
  borderRadius: {
    small: 8,
    medium: 16,
    large: 24,
    full: 50,
  },

  // Legacy keys kept for back-compat; prefer the 4pt `spacing` scale below.
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
    ...spacingTokens,
  },

  // New design tokens (single source of truth) — see src/theme/tokens.js.
  radius: radiusTokens,
  fontSize: fontSizeTokens,
  fontWeight: fontWeightTokens,
  content: contentTokens,

  text: {
    // iOS system font (San Francisco). "System" → SF on iOS / Roboto on Android;
    // weight comes from each style's fontWeight (paired below via typography).
    fontFamily: {
      regular: "System",
      medium: "System",
      semiBold: "System",
      bold: "System",
    },

    sizes: {
      small: 12,
      medium: 16,
      large: 20,
    },
  },

  homeButton: {
    width: "47%",
    height: 110,
    radius: 20,
    padding: 20,
    iconSize: 28,
    gridJustify: "flex-start",
    gridGap: 11,
    alignItems: "stretch",
    iconAlignSelf: "flex-start",
    contentGap: 8,
    textWeight: "600",
    labelSize: 16,
    labelFamily: "regular",
  },
};

export const blueTheme = {
  ...common,
  homeButton: {
    ...common.homeButton,
    // Plain label, not semibold — same 16px as before, just not shouting.
    textWeight: "400",
  },
  colors: withIconBadgeBackground(blueColors),
};

export const blackTheme = {
  ...common,
  // Dark theme: override the default (light) semantic tokens with the dark set.
  content: darkContent,
  colors: withIconBadgeBackground(blackColors),
};

export const lightBlueTheme = {
  ...common,
  homeButton: {
    ...common.homeButton,
    // Asked for on the pale-blue home: the label reads like the section
    // headings under the grid — 15px, regular weight.
    textWeight: "400",
    labelSize: 15,
    labelFamily: "medium",
  },
  colors: withIconBadgeBackground(lightBlueColors),
};

export const lightGrayTheme = {
  ...common,
  homeButton: {
    ...common.homeButton,
    // Asked for on the pale-blue home: the label reads like the section
    // headings under the grid — 15px, regular weight.
    textWeight: "400",
    labelSize: 15,
    labelFamily: "medium",
  },
  colors: withIconBadgeBackground(lightGrayColors),
};

export const colorfulTheme = {
  ...common,
  homeButton: {
    ...common.homeButton,
    height: 110,
    radius: 24,
    // One padding across the app: the card's text starts where every other
    // card's text starts. (Figma's colourful mock drew 14 here.)
    padding: 20,
    gridGap: 11,
  },
  colors: withIconBadgeBackground(colorfulColors),
};

export const themeOptions = [
  {
    id: "blue",
    color: blueColors.primary,
  },
  {
    id: "black",
    color: blackColors.background,
    secondaryColor: "#FFFFFF",
  },
  {
    id: "lightBlue",
    color: lightBlueColors.background,
  },
  {
    id: "lightGray",
    color: lightGrayColors.background,
    secondaryColor: lightGrayColors.primary,
  },
  {
    id: "colorful",
    color: colorfulColors.buttonColors.employees,
    secondaryColor: colorfulColors.buttonColors.camera,
  },
];
