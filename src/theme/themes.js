import {
  greenColors,
  blueColors,
  lightBlueColors,
  orangeColors,
  darkGrayColors,
} from "./colors";
import { iconBadgeBackground } from "./colorUtils";

function withIconBadgeBackground(colors) {
  return {
    ...colors,
    primaryIconBadge: iconBadgeBackground(colors.primary),
  };
}

const common = {
  borderRadius: {
    small: 8,
    medium: 16,
    large: 24,
    full: 50,
  },

  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },

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
};

export const greenTheme = {
  ...common,
  colors: withIconBadgeBackground(greenColors),
};

export const blueTheme = {
  ...common,
  colors: withIconBadgeBackground(blueColors),
};

export const lightBlueTheme = {
  ...common,
  colors: withIconBadgeBackground(lightBlueColors),
};

export const orangeTheme = {
  ...common,
  colors: withIconBadgeBackground(orangeColors),
};

export const darkGrayTheme = {
  ...common,
  colors: withIconBadgeBackground(darkGrayColors),
};

export const themeOptions = [
  {
    id: "green",
    color: greenColors.primary,
  },
  {
    id: "blue",
    color: blueColors.primary,
  },
  {
    id: "lightBlue",
    color: lightBlueColors.background,
  },
  {
    id: "orange",
    color: orangeColors.primary,
  },
  {
    id: "darkGray",
    color: darkGrayColors.primary,
  },
];