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
    // Soft elevation wrapper (NOT clipped): defines the pill by a gentle drop
    // shadow instead of a bright stroke, so it reads on white backgrounds
    // (no longer blends) and stays calm on the blue home (no glowing ring).
    // Must sit OUTSIDE the pill because the pill uses overflow:"hidden" (to clip
    // its blur), which would otherwise clip the iOS shadow.
    menuShadow: {
      borderRadius: 89,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 18,
        },
        default: {},
      }),
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
      borderWidth: 1,
      // Soft neutral hairline (was solid #FFFFFF, invisible on white). The
      // shadow does the heavy lifting; the border is just a crisp edge.
      borderColor: "rgba(60,60,67,0.12)",
      backgroundColor: "rgba(255,255,255,0.6)",
      flexDirection: "row",
      justifyContent: "space-around",
      overflow: "hidden",
      // Android draws elevation shadows outside the view even with
      // overflow:"hidden", so it goes on the pill itself (not the outer wrapper,
      // which is transparent and would cast nothing).
      ...Platform.select({ android: { elevation: 8 }, default: {} }),
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
      ...Platform.select({ android: { elevation: 0 }, default: {} }),
    },
    // Opaque pill coloured to match the screen background (home gradient). No
    // border — it blends into the background and is defined only by the drop
    // shadow, so it never pulls focus from the primary action.
    menuWrapperOpaque: {
      borderWidth: 0,
    },
    // Dark theme: swap the crisp white pill stroke for a subtle light one so
    // the (dark-filled) pill reads on the dark background.
    menuWrapperDark: {
      // No visible stroke in dark — a light border reads as a grey outline.
      borderWidth: 0,
    },
    // Back-button-style glass layers over the pill fill.
    glassBase: {
      ...StyleSheet.absoluteFillObject,
    },
    glassHighlight: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 34,
    },
    glassRing: {
      position: "absolute",
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: 88,
      borderWidth: 1,
    },
    // Frosted-glass pill for the home screen. A denser white fill + crisp
    // stroke so the pill reads as a solid frosted surface over the light home
    // background instead of a washed-out blob showing the content behind it.
    // overflow:hidden clips the blur to the pill.
    // Figma tab bar (Frame 5804): white 20% fill, white 30% stroke 1px, blur.
    menuWrapperGlass: {
      backgroundColor: "rgba(255,255,255,0.20)",
      // Softened the bright white ring (was 2px, white / white-30%): over the
      // blue home it read as a glowing capsule that stole focus from the white
      // Play button. Now a thin, low-opacity edge — the drop shadow (menuShadow
      // / Android elevation) grounds the pill instead.
      borderWidth: 1,
      borderColor:
        Platform.OS === "android"
          ? "rgba(255,255,255,0.55)"
          : "rgba(255,255,255,0.16)",
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
