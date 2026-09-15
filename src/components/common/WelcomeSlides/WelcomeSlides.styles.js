import { StyleSheet } from "react-native";

// Figma value-tour look (1:1 with the "Onbording" frames): flat #EEEEEE
// background with a soft blue halo behind the card, BYGGEXP wordmark + "Skip" in
// the top bar, a translucent product mockup card, one DM Sans SemiBold benefit
// sentence, page dots and a brand-blue pill CTA.
const NAVY = "#052D50";
const BRAND = "#0785F4";

export function createStyles() {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#EEEEEE",
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
      paddingHorizontal: 20,
      height: 44,
    },
    skip: {
      color: NAVY,
      fontFamily: "System",
      fontWeight: "500",
      fontSize: 15,
    },
    list: {
      flex: 1,
    },
    // Anchor the heading to the bottom (fixed position just above the dots) and
    // let the mockup fill and center in the space above it — so the caption
    // never "jumps" between slides of different mockup heights.
    slide: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 20,
    },
    heroWrap: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    // Wraps tightly around the mockup so the top/bottom fade overlays pin to the
    // screenshot's own edges (not the whole hero area).
    mockWrap: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: NAVY,
      fontFamily: "System",
      fontWeight: "700",
      fontSize: 21,
      lineHeight: 27,
      textAlign: "center",
      marginTop: 16,
      marginBottom: 4,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 24,
      backgroundColor: "rgba(5,45,80,0.1)",
    },
    dotActive: {
      backgroundColor: BRAND,
      width: 35,
    },
    cta: {
      marginHorizontal: 16,
      backgroundColor: BRAND,
      borderRadius: 100,
      height: 60,
      alignItems: "center",
      justifyContent: "center",
    },
    // Transparent "ghost" CTA — like the Guide's secondary "Visa Kom igång igen"
    // button: no fill (the page/glow shows through), a brand-blue outline and a
    // brand-blue label. The airiest button in the lightening pass.
    ctaLight: {
      backgroundColor: "transparent",
      borderWidth: 1,
      // Pale brand-blue outline — soft, not the full-strength blue that "hit the
      // eye" too hard.
      borderColor: "rgba(7,133,244,0.30)",
    },
    ctaTextLight: {
      color: BRAND,
    },
    ctaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    ctaIcon: {
      marginLeft: 8,
    },
    ctaText: {
      color: "#FFFFFF",
      fontFamily: "System",
      fontWeight: "600",
      fontSize: 16,
    },
  });
}
