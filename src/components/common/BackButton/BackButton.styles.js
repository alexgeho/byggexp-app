import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    backButton: {
      width: 44,
      height: 44,

      padding: 12,

      justifyContent: "center",
      alignItems: "center",

      borderRadius: 22,

      borderWidth: 1,
      borderColor: "#FFFFFF",

      backgroundColor: "rgba(255,255,255,0.6)",

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
      borderColor: "rgba(255,255,255,0.35)",
    },

    hardLightGlow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.03)",
    },

    backIcon: {
      width: 20,
      height: 20,
      tintColor: "#20384D",
    },
  });
}