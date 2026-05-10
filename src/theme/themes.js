import {
  greenColors,
  blueColors,
  orangeColors,
  darkGrayColors,
} from "./colors";

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
  colors: greenColors,
};

export const blueTheme = {
  ...common,
  colors: blueColors,
};

export const orangeTheme = {
  ...common,
  colors: orangeColors,
};

export const darkGrayTheme = {
  ...common,
  colors: darkGrayColors,
};