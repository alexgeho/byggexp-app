import { StyleSheet } from "react-native";

// Figma value-tour look (1:1 with the "Onbording" frames): flat #EEEEEE
// background with a soft blue halo behind the card, BYGGEXP wordmark + "Skip" in
// the top bar, a translucent product mockup card, one DM Sans SemiBold benefit
// sentence, page dots and a brand-blue pill CTA.
const NAVY = "#052D50";
const BRAND = "#0785F4";
const FONT_MED = "DMSans-Medium";
const FONT_SEMI = "DMSans-SemiBold";

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
      fontFamily: FONT_MED,
      fontSize: 15,
    },
    list: {
      flex: 1,
    },
    // Figma pins the heading near y=497 (~58%) and grows the card UPWARD from
    // just above it. Bottom-anchoring the [card + 24 gap + heading] stack with a
    // fixed bottom inset reproduces that: tall cards (calendar) rise toward the
    // top bar, short cards (notification) sit low near the heading.
    slide: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 20,
      paddingBottom: 130,
    },
    heroWrap: {
      width: "100%",
      alignItems: "center",
    },
    title: {
      color: NAVY,
      fontFamily: FONT_SEMI,
      fontSize: 21,
      lineHeight: 27,
      textAlign: "center",
      marginTop: 24,
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
    ctaText: {
      color: "#FFFFFF",
      fontFamily: FONT_MED,
      fontSize: 16,
    },
  });
}
