import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  timer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
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
