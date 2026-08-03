export const baseColors = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  background: {
    light: "#f2f1f6",
    dark: "#000000",
  },
  text: {
    light: "#000000",
    dark: "#FFFFFF",
    description: "#052D50",
  },
};

export const greenColors = {
  background: "#f2f1f6",

  primary: "#759D3C",

  glow: "#759D3C",

  text: "#282828",

  textBtn: "#4C9E3C",

  hourBlockFilled: "#759D3C",

  hourBlockEmpty: "#759D3C4D",

  border: "#4C9E3C",

  card: "#FFFFFF",

  selectorBackground: "#FFFFFF",

  selectorBorder: "#28282866",

  selectorArrow: "#282828",

  icon: "#4C9E3C",

  bottomNav: "#4C9E3C",
};

export const lightColors = {
  ...greenColors,
  background: "#f2f1f6",
  primary: "#0785F4",
  glow: "#0785F4",
  text: "#282828",
  textBtn: "#1C1C1C",
  hourBlockFilled: "#0785F4",
  hourBlockEmpty: "#0785F44D",
  border: "rgba(1,13,24,0.08)",
  card: "#FFFFFF",
  selectorBackground: "rgba(5, 45, 80, 0.05)",
  selectorBorder: "transparent",
  selectorArrow: "#282828",
  selectorText: "#282828",
  icon: "#1C1C1C",
  bottomNav: "#282828",
  timerText: "#282828",
  timerSeconds: "rgba(40, 40, 40, 0.5)",
  timerFontFamily: "Oswald_500Medium",
  timerFontSize: 60,
  timerFontWeight: "500",
  playButtonSize: 124,
  playIconSize: 40,
  playButtonColor: "#0785F4",
  playButtonShadowOpacity: 0,
  playButtonShadowRadius: 0,
  playButtonElevation: 0,
  homeButtonText: "#1C1C1C",
  hideButtonLines: true,
  hideTimerProgress: true,
  showBottomMenuBackground: true,
  showBottomMenuText: false,
};

export const blueColors = {
  background: "#f2f1f6",

  primary: "#3B82F6",

  glow: "#3B82F6",

  text: "#282828",

  hourBlockFilled: "#3B82F6",

  hourBlockEmpty: "#3B82F64D",

  border: "#2828284D",

  card: "#FFFFFF",

  selectorBackground: "#FFFFFF",

  selectorBorder: "#28282866",

  selectorArrow: "#282828",

  icon: "#1C1C1C80",

  bottomNav: "#282828",

  homeButtonBackground: "rgba(255,255,255,0.3)",
  homeButtonBorder: "rgba(255,255,255,0.2)",
  homeButtonText: "#FFFFFF",
};

export const blackColors = {
  ...blueColors,
  background: "#1C1C1C",
  primary: "#3097F7",
  glow: "#2C9CFF",
  text: "#FFFFFF",
  card: "#232323",
  border: "rgba(255,255,255,0.2)",
  selectorBackground: "transparent",
  selectorBorder: "rgba(255,255,255,0.2)",
  selectorArrow: "#FFFFFF",
  icon: "#FFFFFF",
  bottomNav: "#FFFFFF",
  homeButtonBackground: "#232323",
  homeButtonBorder: "rgba(255,255,255,0.2)",
  // Figma dark home: clean cards, no diagonal lines, soft blue corner glow.
  hideButtonLines: true,
  cardGlow: "#2C9CFF",
};

export const lightBlueColors = {
  background: "#ECF6FF",

  primary: "#3097F7",

  glow: "#3097F7",

  text: "#010D18",

  hourBlockFilled: "#3097F7",

  hourBlockEmpty: "#3097F74D",

  border: "#010D184D",

  card: "#FFFFFF",

  selectorBackground: "#FFFFFF",

  selectorBorder: "#010D1833",

  selectorArrow: "#010D18",

  icon: "#010D18",

  bottomNav: "#010D18",

  homeButtonBackground: "#FFFFFF",
  homeButtonBorder: "rgba(1,13,24,0.08)",
  homeButtonText: "#010D18",
};

// Light grey home (Figma "Home / Blue" light variant): #EEEEEE page, white
// cards, navy-outlined transparent selector, blue #3A81DB play button.
export const lightGrayColors = {
  ...lightBlueColors,
  background: "#EEEEEE",
  primary: "#3A81DB",
  glow: "#3A81DB",
  text: "#282828",
  card: "#FFFFFF",
  border: "rgba(40,40,40,0.30)",
  selectorBackground: "transparent",
  selectorBorder: "rgba(5,45,80,0.30)",
  selectorArrow: "#282828",
  icon: "#282828",
  bottomNav: "#282828",
  homeButtonBackground: "#FFFFFF",
  homeButtonBorder: "rgba(40,40,40,0.06)",
  homeButtonText: "#282828",
};

export const colorfulColors = {
  ...lightColors,
  background: "#EEEEEE",
  // Per-button background colors for the colorful home grid (Figma frame 57).
  buttonColors: {
    employees: "#0785F4",
    tools: "#5222FF",
    camera: "#FF5454",
    chats: "#F3B530",
    shifts: "rgba(40,40,40,0.7)",
    projects: "#0785F4",
    tasks: "#0785F4",
  },
  homeButtonText: "#FFFFFF",
};
