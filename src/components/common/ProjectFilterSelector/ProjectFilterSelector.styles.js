import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  trigger: {
    width: "100%",
    height: 48,
    backgroundColor: "#052D500D",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  triggerText: {
    flex: 1,
    color: "#052D50",
    fontSize: 16,
  },
});
