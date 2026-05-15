import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#EEEEEE",
      paddingTop: 48,
      paddingHorizontal: 16,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 32,
    },

    title: {
      fontSize: 18,
      fontWeight: "600",
      color: "#052D50",
    },

    placeholder: {
      width: 44,
    },

    list: {
      backgroundColor: "#ffffff",
      borderRadius: 24,
      overflow: "hidden",
    },

    item: {
      padding: 16,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#E7EDF3",
    },

    itemText: {
      fontSize: 16,
      color: "#052D50",
    },

    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: `${theme.colors.primary}33`,

      alignItems: "center",
      justifyContent: "center",
    },

    checkboxActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    checkmark: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
