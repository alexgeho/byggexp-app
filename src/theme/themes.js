import {
  greenColors,
  lightColors,
  blueColors,
  blueDarkTextColors,
  blackColors,
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

  homeButton: {
    width: "47%",
    height: 1 50,
    radius: 20,
    padding: 20,
    iconSize: 28,
    gridJustify: "space-between",
    gridGap: 16,
    alignItems: "stretch",
    iconAlignSelf: "flex-start",
    contentGap: 8,
    textWeight: "600",
  },
};

export const greenTheme = {
  ...common,
  colors: withIconBadgeBackground(greenColors),
};

export const lightTheme = {
  ...common,
  colors: withIconBadgeBackground(lightColors),
};

export const blueTheme = {
  ...common,
  colors: withIconBadgeBackground(blueColors),
};

export const blueDarkTextTheme = {
  ...common,
  colors: withIconBadgeBackground(blueDarkTextColors),
};

export const blackTheme = {
  ...common,
  colors: withIconBadgeBackground(blackColors),
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
    id: "light",
    color: lightColors.background,
    secondaryColor: lightColors.primary,
  },
  {
    id: "blue",
    color: blueColors.primary,
  },
  {
    id: "blueDarkText",
    color: blueColors.primary,
    secondaryColor: blueDarkTextColors.homeButtonText,
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
    id: "orange",
    color: orangeColors.primary,
  },
  {
    id: "darkGray",
    color: darkGrayColors.primary,
  },
];