import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  main: {
    marginTop: 30,
    flex: 1,
    justifyContent: "space-between",
    marginBottom: 30,
  },

  projectSelector: {
    alignItems: "center",
  },

  mainActionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 70,
  },

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

  footer: {
    flexDirection: "row",
    height: 68,
    alignItems: "center",
    marginTop: "auto",
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    /*  borderColor: "#fffff",
    borderWidth: 1, */
    marginBottom: 20,
  },
});
