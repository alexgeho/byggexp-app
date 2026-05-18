import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  mainActionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 35,
  },

  actionButton: {
    width: 124,
    height: 124,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  actionButtonCamera: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.3,
  },

  iconAction: {
    width: 124,
    height: 124,
    resizeMode: "contain",
  },

  icon: {
    width: 124,
    height: 124,
    resizeMode: "contain",
  },
});