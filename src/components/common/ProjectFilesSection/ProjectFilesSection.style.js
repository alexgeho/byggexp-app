import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
      paddingHorizontal: 4,
    },

    title: {
      fontSize: theme.text.sizes.medium,
      fontFamily: theme.text.fontFamily.bold,
      color: theme.colors.text,
    },

    closeButton: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    closeText: {
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: theme.text.fontFamily.medium,
    },

    container: {
      width: "100%",
      borderWidth: 1,
      borderRadius: 18,
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}25`,
      paddingVertical: 4,
      overflow: "hidden",
    },

    scrollContent: {
      paddingHorizontal: 4,
    },

    image: {
      width: 140,
      height: 140,
      borderRadius: 16,
      marginRight: 8,
    },
  });
}