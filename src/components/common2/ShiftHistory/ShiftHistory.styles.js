import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  shiftHistorySection: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },

  shiftHeader: {
    width: 353,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shiftHeaderText: {
    color: "#ffffff",
    fontSize: 17,
    fontFamily: "DMSans-Medium",
  },
  shiftBodyHeaderText: {
    fontFamily: "DMSans-Medium",
    color: "#ffffff",
    fontSize: 15,
    opacity: 0.5,
  },
  shiftBody: {
    width: 353,
    padding: 20,
    flexDirection: "column",
    gap: 30,

    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  shiftBodyMain: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shiftBodyMainLeft: {
    gap: 2,
  },
  shiftBodyMainRight: {
    gap: 2,
  },
  shiftBodyMainLeftText: {
    fontFamily: "DMSans-Medium",
    color: "#ffffff",
    fontSize: 15,
  },
});
