import { StyleSheet } from "react-native";

// `glass` is the light/dark glass palette picked in the component.
export function createStyles(glass) {
  return StyleSheet.create({
    backButton: {
      width: 44,
      height: 44,

      padding: 12,

      justifyContent: "center",
      alignItems: "center",

      borderRadius: 22,

      borderWidth: 1,
      borderColor: glass.border,

      backgroundColor: glass.bg,
    },

    // Clips the glass gradients to the round shape without clipping the
    // button's own drop shadow.
    inner: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
      overflow: "hidden",
    },

    baseGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
    },

    highlight: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 18,

      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },

    innerRing: {
      position: "absolute",
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,

      borderRadius: 21,

      borderWidth: 1,
      borderColor: glass.ring,
    },

    hardLightGlow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
      backgroundColor: glass.hardGlow,
    },

    backIcon: {
      width: 20,
      height: 20,
      tintColor: glass.icon,
    },
  });
}
