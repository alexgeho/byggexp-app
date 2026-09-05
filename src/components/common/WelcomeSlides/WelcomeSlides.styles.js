import { StyleSheet } from "react-native";

// Light look, matching the Login screen: soft blue gradient background, a white
// card, navy text and a blue pill button. The illustration sits on a blue hero
// panel inside the card so its white/light-blue art still reads.
const NAVY = "#052d50";
const MUTED = "#687898";
const BLUE = "#3183ff";

export function createStyles() {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1000,
      elevation: 1000,
      paddingTop: 64,
      paddingBottom: 40,
    },
    hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
    },
    skip: {
      color: MUTED,
      fontSize: 15,
      fontWeight: "600",
    },
    list: {
      flex: 1,
    },
    slide: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: "transparent",
      paddingHorizontal: 12,
      gap: 18,
    },
    hero: {
      height: 248,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: NAVY,
      fontSize: 25,
      lineHeight: 33,
      fontWeight: "800",
      letterSpacing: -0.3,
      textAlign: "center",
      marginTop: 2,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 20,
      marginBottom: 18,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: "#c4d3e6",
    },
    dotActive: {
      backgroundColor: BLUE,
      width: 22,
    },
    cta: {
      marginHorizontal: 24,
      backgroundColor: BLUE,
      borderRadius: 999,
      paddingVertical: 17,
      alignItems: "center",
    },
    ctaText: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "700",
    },
  });
}
