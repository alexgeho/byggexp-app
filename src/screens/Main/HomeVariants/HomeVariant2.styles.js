import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#3097F7",
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
    gap: 20,
  },

  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shiftBody: {
    flexDirection: "column",
    gap: 10,
  },
  shiftBodyMain: {
    flexDirection: "row",
    justifyContent: "space-between",
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
