import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#3097F7",
    paddingVertical: 60,
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

  },

  projectSelector: {
    alignItems: "center",
  },

  timer: {
    alignItems: "center",
  },

  mainActionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: "auto",
  },
});
