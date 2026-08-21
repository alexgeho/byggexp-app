import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  timer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  // Probe text used only for measuring; kept out of flow and invisible.
  measure: {
    position: "absolute",
    opacity: 0,
  },

  timerText: {
    fontSize: 140,
    lineHeight: 132,
    fontFamily: "Landasans-Medium",
    letterSpacing: -2.5,
    color: "#FFFFFF",
    includeFontPadding: false,
    paddingVertical: 0,
    fontVariant: ["tabular-nums"],
  },

  timerTextSeconds: {
    opacity: 0.35,
    includeFontPadding: false,
  },
});
