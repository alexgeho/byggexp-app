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
      justifyContent: "center",
      gap: 14,
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
    navButton: {
      width: 40,
      height: 40,

      justifyContent: "center",
      alignItems: "center",
    },
    navIcon: {
      width: 44,
      height: 44,
      resizeMode: "contain",
      tintColor: theme.colors.icon,
    },
    actionButton: {
      width: 81,
      height: 81,
      borderRadius: 100,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      padding: 10,
    },
    addIcon: {
      width: 20,
      height: 20,
      resizeMode: "contain",
    },
    logoutButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
    menuWrapperTransparent: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    navText: {
      marginTop: 4,
      fontSize: 18,
      fontWeight: "300",
      color: theme.colors.bottomNav,
    },
  });
}
