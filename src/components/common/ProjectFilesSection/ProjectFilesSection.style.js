import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    title: {
      fontSize: theme.text.sizes.medium,
      fontFamily: theme.text.fontFamily.medium,
      marginBottom: 2,
      marginLeft: 4,
    },

    container: {
      width: "100%",
      borderWidth: 1,
      borderRadius: 16,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "80",
      paddingVertical: 3,
    },

    scrollContent: {
      paddingHorizontal: 3,
    },

    image: {
      width: 140,
      height: 140,
      borderRadius: 16,
      marginRight: 8,
    },
  });
}
