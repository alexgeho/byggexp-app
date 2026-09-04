import { StyleSheet } from "react-native";

// Brand-blue full-screen intro. Not theme-dependent — it's a one-time branded
// splash-style overlay, always the blue appearance.
const BRAND_BLUE = "#0785F4";

export function createStyles() {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: BRAND_BLUE,
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
      color: "rgba(255,255,255,0.85)",
      fontSize: 15,
      fontWeight: "600",
    },
    slide: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 18,
    },
    illustration: {
      marginBottom: 12,
    },
    title: {
      color: "#FFFFFF",
      fontSize: 26,
      fontWeight: "700",
      textAlign: "center",
    },
    text: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.4)",
    },
    dotActive: {
      backgroundColor: "#FFFFFF",
      width: 22,
    },
    cta: {
      marginHorizontal: 24,
      backgroundColor: "#FFFFFF",
      borderRadius: 999,
      paddingVertical: 18,
      alignItems: "center",
    },
    ctaText: {
      color: BRAND_BLUE,
      fontSize: 17,
      fontWeight: "700",
    },
  });
}
