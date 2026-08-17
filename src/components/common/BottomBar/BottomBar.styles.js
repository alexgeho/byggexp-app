import { Platform, StyleSheet } from "react-native";
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

      alignItems: "center",

      gap: 10,

      borderRadius: 89,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      backgroundColor: "rgba(255,255,255,0.6)",
      flexDirection: "row",
      justifyContent: "space-around",
      overflow: "hidden",
    },
    navButton: {
      width: 80,
      height: 80,

      justifyContent: "center",
      alignItems: "center",
    },
    navIcon: {
      width: 24,
      height: 24,
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
      fontSize: 17,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    menuWrapperTransparent: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    // Dark theme: swap the crisp white pill stroke for a subtle light one so
    // the (dark-filled) pill reads on the dark background.
    menuWrapperDark: {
      borderColor: "rgba(255,255,255,0.08)",
    },
    // Frosted-glass pill for the home screen. A denser white fill + crisp
    // stroke so the pill reads as a solid frosted surface over the light home
    // background instead of a washed-out blob showing the content behind it.
    // overflow:hidden clips the blur to the pill.
    // Figma tab bar (Frame 5804): white 20% fill, white 30% stroke 1px, blur.
    menuWrapperGlass: {
      backgroundColor: "rgba(255,255,255,0.20)",
      // Android has no BlurView, so the pill leans on a crisp solid-white
      // stroke to read as a defined surface; iOS keeps the soft glass stroke.
      borderWidth: 2,
      borderColor:
        Platform.OS === "android" ? "#FFFFFF" : "rgba(255,255,255,0.30)",
      overflow: "hidden",
    },
    navText: {
      marginTop: 4,
      fontSize: 15,
      fontWeight: "300",
      color: theme.colors.bottomNav,
    },
  });
}
