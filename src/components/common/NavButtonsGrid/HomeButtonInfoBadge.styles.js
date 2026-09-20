import { StyleSheet } from "react-native";

// Base colour per variant; the fill is that colour at `fillAlpha` (the theme
// decides how strong — Figma's colourful home paints these at 60%, the calmer
// themes at 20%).
const BADGE_VARIANTS = {
  live: { color: "4, 178, 81", borderLeftColor: "#04B251" },
  notAtWork: { color: "252, 29, 44", borderLeftColor: "#FC1D2C" },
  shift: { color: "7, 133, 244", borderLeftColor: "#FFFFFF" },
  deadline: { color: "255, 149, 0", borderLeftColor: "#FF9500" },
  overdue: { color: "252, 29, 44", borderLeftColor: "#FC1D2C" },
};

export function createStyles(variant, fillAlpha = 0.2) {
  const variantColors = BADGE_VARIANTS[variant] || BADGE_VARIANTS.shift;
  const colors = {
    backgroundColor: `rgba(${variantColors.color}, ${fillAlpha})`,
    borderLeftColor: variantColors.borderLeftColor,
  };

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
