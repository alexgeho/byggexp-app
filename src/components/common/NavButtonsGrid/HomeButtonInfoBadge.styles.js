import { StyleSheet } from "react-native";

const BADGE_VARIANTS = {
  live: {
    backgroundColor: "rgba(4, 178, 81, 0.2)",
    borderLeftColor: "#04B251",
  },
  notAtWork: {
    backgroundColor: "rgba(252, 29, 44, 0.2)",
    borderLeftColor: "#FC1D2C",
  },
  shift: {
    backgroundColor: "rgba(7, 133, 244, 0.2)",
    borderLeftColor: "#FFFFFF",
  },
  deadline: {
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    borderLeftColor: "#FF9500",
  },
  overdue: {
    backgroundColor: "rgba(252, 29, 44, 0.2)",
    borderLeftColor: "#FC1D2C",
  },
};

export function createStyles(variant) {
  const colors = BADGE_VARIANTS[variant] || BADGE_VARIANTS.shift;

  return StyleSheet.create({
    badge: {
      backgroundColor: colors.backgroundColor,
      borderLeftWidth: 1,
      borderLeftColor: colors.borderLeftColor,
      borderRadius: 6,
      paddingVertical: 1,
      paddingHorizontal: 6,
    },
    text: {
      color: "#FFFFFF",
      fontSize: 12,
      lineHeight: 16,
    },
  });
}
