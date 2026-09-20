import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  projectSelector: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingVertical: 12,

    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  // The pill sits on the coloured home (white label, white hairline), so the
  // chevron is white too. Light-surface themes pass their own tint through
  // `iconStyle`, which wins over this.
  projectSelectorIcon: {
    tintColor: "#FFFFFF",
  },

  projectSelectorText: {
    flex: 1,

    color: "#FFFFFF",

    fontFamily: "DMSans-Medium",
    fontSize: 17,

    lineHeight: 22,
  },
});
