// Home screen background per theme (top → bottom). Shared by the regular
// home and the solo Egenkontroll home so both look like the same app.
const HOME_GRADIENTS = {
  blue: ["#5BC8FF", "#0D5DB8"],
  blueDarkText: ["#5BC8FF", "#0D5DB8"],
  black: ["#1C1C1C", "#1C1C1C"],
  lightBlue: ["#ECF6FF", "#ECF6FF"],
  lightGray: ["#EEEEEE", "#EEEEEE"],
  colorful: ["#EEEEEE", "#EEEEEE"],
  green: ["#8ED057", "#4C9E3C"],
  orange: ["#FFAE63", "#F97316"],
  darkGray: ["#363636", "#121212"],
};

export const homeGradientFor = (themeName) =>
  HOME_GRADIENTS[themeName] || HOME_GRADIENTS.blue;

// Light-background themes use dark text/icons on the home screen.
export const isLightHomeTheme = (themeName) =>
  themeName === "lightBlue" ||
  themeName === "colorful" ||
  themeName === "lightGray";
