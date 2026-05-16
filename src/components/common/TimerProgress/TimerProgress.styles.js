import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
    },

    dot: {
      width: 20,
      height: 42,
      borderRadius: 999,
      borderWidth: 1,
    },

    activeDot: {
      backgroundColor:
        theme.colors.hourBlockFilled,
      borderColor:
        theme.colors.hourBlockFilled,
    },

    inactiveDot: {
      backgroundColor:
        theme.colors.hourBlockEmpty,
      borderColor:
        theme.colors.hourBlockEmpty,
    },
  });
}