import { StyleSheet } from "react-native";

export function createStyles(theme) {
  const playButtonSize =
    theme.colors.playButtonSize || 150;
  const playButtonColor =
    theme.colors.playButtonColor ||
    theme.colors.primary;
  const playIconSize =
    theme.colors.playIconSize || 52;
  const shadowOpacity =
    theme.colors.playButtonShadowOpacity ?? 0.7;
  const shadowRadius =
    theme.colors.playButtonShadowRadius ?? 40;
  const elevation =
    theme.colors.playButtonElevation ?? 25;

  return StyleSheet.create({
    playButtonContainer: {
      alignItems: "center",
      justifyContent: "center",
    },

    playButton: {
      width: playButtonSize,
      height: playButtonSize,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",

      backgroundColor: playButtonColor,

      shadowColor: playButtonColor,
      borderColor: playButtonColor,

      shadowOpacity,
      shadowRadius,

      elevation,
    },

    playButtonPaused: {
      opacity: 0.9,
    },

    playIcon: {
      width: playIconSize,
      height: playIconSize,
      tintColor: "#ffffff",
    },
  });
}