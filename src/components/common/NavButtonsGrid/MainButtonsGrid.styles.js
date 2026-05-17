import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexWrap: "wrap",
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      gap: 15,
    },

    linesContainer: {
      position: "absolute",
      left: -35,
      bottom: 10,
      transform: [{ rotate: "45deg" }],
      gap: 6,
    },

    line: {
      width: 80,
      height: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },

    button: {
      width: "42%",
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },

    buttonInner: {
      flexDirection: "column",
      padding: 16,
      gap: 18,
      alignItems: "center",
    },

    buttonIcon: {
      width: 26,
      height: 26,
      tintColor: theme.colors.icon,
    },

    buttonText: {
      color: theme.colors.textBtn,
      fontFamily: theme.text.fontFamily.regular,
      fontSize: theme.text.sizes.medium,
    },
  });
}