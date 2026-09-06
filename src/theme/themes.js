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
    fontFamily: {
      regular: "DMSans-Regular",
      medium: "DMSans-Medium",
      semiBold: "DMSans-SemiBold",
      bold: "DMSans-Bold",
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
  },
};

export const blueTheme = {
  ...common,
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
  colors: withIconBadgeBackground(lightBlueColors),
};

export const lightGrayTheme = {
  ...common,
  colors: withIconBadgeBackground(lightGrayColors),
};

export const colorfulTheme = {
  ...common,
  // Pixel-perfect grid geometry from the Figma "colorful" mockup.
  homeButton: {
    ...common.homeButton,
    height: 110,
    radius: 24,
    padding: 14,
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
