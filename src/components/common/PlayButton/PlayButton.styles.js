import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    playButtonContainer: {
      alignItems: "center",
      justifyContent: "center",
    },

    playButton: {
      width: 150,
      height: 150,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",

      backgroundColor: theme.colors.primary,

      shadowColor: theme.colors.glow,
      borderColor: theme.colors.glow,

      shadowOpacity: 0.7,
      shadowRadius: 40,

      elevation: 25,
    },

    playButtonPaused: {
      opacity: 0.9,
    },

    playIcon: {
      width: 52,
      height: 52,
      tintColor: "#ffffff",
    },
  });
}