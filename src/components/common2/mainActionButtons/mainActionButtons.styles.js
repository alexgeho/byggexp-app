import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  mainActionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  actionButton: {
    width: 124,
    height: 124,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  actionButtonPaused: {
    opacity: 0.85,
  },

  actionButtonCamera: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.3,
  },

  iconAction: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    tintColor: "#2F80ED",
    opacity: 0.85,
  },

  icon: {
    width: 124,
    height: 124,
    resizeMode: "contain",
  },
});