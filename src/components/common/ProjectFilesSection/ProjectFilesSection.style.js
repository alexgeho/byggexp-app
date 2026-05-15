import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      width: "100%",
      /* borderWidth: 1,
      borderColor: theme.colors.primary, */
      alignSelf: "center",
    },
    image: {
      width: "100%",
      resizeMode: "cover",
    },
  });
}
