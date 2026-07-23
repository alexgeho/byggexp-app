import { StyleSheet } from "react-native";

export function createStyles(theme) {
  const playButtonSize =
    theme.colors.playButtonSize || 150;
  const playButtonColor =
    theme.colors.playButtonColor ||
    theme.colors.primary;
  const playIconSize =
    theme.colors.playIconSize || 52;

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

      borderColor: playButtonColor,
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