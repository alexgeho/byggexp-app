import { StyleSheet } from "react-native";

// Figma value-tour look: light-gray background, a single high-fidelity product
// mockup centred in the slide, one bold navy benefit sentence beneath it, page
// dots and a blue pill CTA. "Skip" sits alone at the top-right.
const NAVY = "#052D50";
const BLUE = "#0A84FF";

export function createStyles() {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1000,
      elevation: 1000,
      paddingTop: 60,
      paddingBottom: 40,
    },
    hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 24,
      height: 32,
    },
    skip: {
      color: NAVY,
      fontSize: 17,
      fontWeight: "600",
    },
    list: {
      flex: 1,
    },
    // Mockup + heading are centred as a group in the available space, so short
    // mockups (notification, costs) sit mid-screen and tall ones (calendar) rise
    // up — matching the Figma frames.
    slide: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 26,
    },
    hero: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: NAVY,
      fontSize: 25,
      lineHeight: 32,
      fontWeight: "700",
      letterSpacing: -0.2,
      textAlign: "center",
      marginTop: 32,
      paddingHorizontal: 4,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: "#C9CDD4",
    },
    dotActive: {
      backgroundColor: BLUE,
      width: 24,
    },
    cta: {
      marginHorizontal: 24,
      backgroundColor: BLUE,
      borderRadius: 999,
      paddingVertical: 18,
      alignItems: "center",
    },
    ctaText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },
  });
}
