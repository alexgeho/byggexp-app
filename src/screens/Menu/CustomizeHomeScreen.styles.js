import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

export function createStyles(theme) {
  const c = theme.content;
  const isDark = c.scheme === "dark";

  // Exact Figma values for the dark (black) drawer. On light themes there is no
  // Figma reference, so fall back to theme tokens.
  // Active pill / theme ring: #3A73F0. Inactive pill: #484848 @40% + #595959
  // 1px stroke. Pill label: white on dark (both states).
  const accent = isDark ? "#3A73F0" : theme.colors.primary;
  const pillOffBg = isDark ? "rgba(72,72,72,0.40)" : c.surface;
  const pillOffBorder = isDark ? "#595959" : "transparent";
  const pillOffLabel = isDark ? "#FFFFFF" : c.textPrimary;

  return StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 140,
    },

    header: {
      ...standardScreenHeader,
      // Left-align with a gap so the title sits clear of the back button
      // (instead of space-between crowding it against the arrow).
      justifyContent: "flex-start",
      gap: 16,
    },

    title: {
      // Figma: DM Sans 600, 17px.
      fontSize: 17,
      fontFamily: theme.text.fontFamily.semiBold,
      color: c.textPrimary,
    },

    placeholder: {
      width: 44,
    },

    themeContainer: {
      marginBottom: 24,
    },

    sectionTitle: {
      // Figma: DM Sans 500 (medium), 17px, white.
      fontSize: 17,
      fontFamily: theme.text.fontFamily.medium,
      color: c.textPrimary,
      marginBottom: 14,
      marginLeft: 4,
    },

    themeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      rowGap: 14,
    },

    themeButton: {
      // Figma: 44×44 ellipses.
      width: 44,
      height: 44,
      borderRadius: 999,
      overflow: "hidden",
      // Outline the full circle so light/white theme halves stay visible
      // against the screen background (were blending in and looking clipped).
      borderWidth: 1,
      borderColor: c.border,
    },

    splitThemePreview: {
      flex: 1,
      flexDirection: "row",
    },

    splitThemeHalf: {
      flex: 1,
    },

    activeThemeButton: {
      // Figma: active dot has a 3px #3A73F0 ring.
      borderWidth: 3,
      borderColor: accent,
    },

    // Drag-reorder list: rows are absolutely positioned (translateY animated),
    // so the container needs an explicit height (set inline). Standalone pills,
    // 14px gaps, no card wrapper.
    dragList: {
      position: "relative",
      marginBottom: 24,
    },

    // One absolutely-positioned pill slot, 52 tall (Figma).
    dragRow: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 52,
    },

    // Figma pill: 52 tall, radius 84 (fully rounded), 14 padding. Enabled =
    // #3A73F0 (no border); disabled = #484848 @40% + #595959 1px stroke.
    // Label left, 6-dot drag handle on the right.
    item: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingLeft: 14,
      paddingRight: 8,
      borderRadius: 999,
      backgroundColor: pillOffBg,
      borderWidth: 1,
      borderColor: pillOffBorder,
    },

    itemActive: {
      backgroundColor: accent,
      borderColor: accent,
    },

    // Tappable label region (fills the pill left of the handle).
    itemLabelTap: {
      flex: 1,
      height: "100%",
      justifyContent: "center",
    },

    itemText: {
      // Figma label: DM Sans 500, 17px, white.
      fontSize: 17,
      fontFamily: theme.text.fontFamily.medium,
      color: pillOffLabel,
    },

    itemTextActive: {
      color: "#FFFFFF",
    },

    // 6-dot drag handle on the pill's right edge (Figma).
    dragHandle: {
      width: 36,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryRow: {
      flexDirection: "column",
      // Figma: 14px between pills.
      gap: 14,
    },
    // Pill-shaped selector matching Figma "Second round button": 52 tall,
    // radius 84, 14 padding, icon → label gap 12, left-aligned. Inactive =
    // #484848 @40% + #595959 stroke, active = #3A73F0.
    secondaryOption: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      // Figma: icon + label centred as a group in the pill.
      justifyContent: "center",
      // Figma: icon → label gap 12.
      gap: 12,
      // Figma pill: 52 tall, 14 padding, fully rounded.
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: pillOffBg,
      borderWidth: 1,
      borderColor: pillOffBorder,
    },
    secondaryOptionActive: {
      backgroundColor: accent,
      borderColor: accent,
    },
    secondaryOptionLabel: {
      // Figma label: DM Sans 500, 17px, white on the pill.
      fontSize: 17,
      color: pillOffLabel,
      fontFamily: theme.text.fontFamily.medium,
    },
    secondaryOptionLabelActive: {
      color: "#FFFFFF",
    },
  });
}
