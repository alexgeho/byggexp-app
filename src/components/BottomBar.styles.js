import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      /* backgroundColor: theme.colors.primary, */
      position: "absolute",
      bottom: 30,
      left: 20,
      right: 20,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    menuWrapper: {
      width: 226,
      height: 81,

      paddingTop: 29,
      paddingRight: 34,
      paddingBottom: 28,
      paddingLeft: 34,

      justifyContent: "center",
      alignItems: "center",

      gap: 10,

      borderRadius: 89,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      backgroundColor: "rgba(255,255,255,0.6)",
      flexDirection: "row",
      justifyContent: "space-around",
    },
  });
}
