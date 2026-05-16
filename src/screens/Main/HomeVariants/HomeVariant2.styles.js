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
