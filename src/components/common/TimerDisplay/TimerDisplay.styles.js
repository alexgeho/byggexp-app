import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    time: {
      color: theme.colors.text,
      fontFamily:
        theme.text.fontFamily.regular,
      fontSize: 72,
    },

    separator: {
      color: theme.colors.text,
      fontFamily:
        theme.text.fontFamily.regular,
      fontSize: 72,
    },

    seconds: {
      color: theme.colors.text,
      fontFamily:
        theme.text.fontFamily.regular,
      fontSize: 72,
    },
  });
}