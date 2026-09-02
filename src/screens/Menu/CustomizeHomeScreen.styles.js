import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

export function createStyles(theme) {
  const c = theme.content;
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
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },

    // Figma: standalone pills with 14px gaps — no card wrapper.
    list: {
      gap: 14,
      marginBottom: 24,
    },

    // Figma pill: enabled = solid primary, disabled = surface. Label left,
    // reorder chevrons on the right. Fully rounded, 52 tall.
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 15,
      paddingLeft: 18,
      paddingRight: 8,
      borderRadius: 999,
      backgroundColor: c.surface,
    },

    itemActive: {
      backgroundColor: theme.colors.primary,
    },

    itemText: {
      flex: 1,
      // Figma label: DM Sans medium, 15px.
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
      color: c.textPrimary,
    },

    itemTextActive: {
      color: "#ffffff",
    },

    // Reorder chevrons sit inline on the pill's right edge.
    itemReorderRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    reorderButton: {
      width: 32,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryRow: {
      flexDirection: "column",
      // Figma: 14px between pills.
      gap: 14,
    },
    // Pill-shaped selector matching Figma "Second round button": fully rounded,
    // icon + label left-aligned in a row, no border. Inactive = surface,
    // active = solid primary. Stacked full-width for the narrow (50%) drawer.
    secondaryOption: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      // Figma: icon → label gap 12.
      gap: 12,
      // Figma pill: 52 tall, 14 padding, fully rounded.
      paddingVertical: 15,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: c.surface,
    },
    secondaryOptionActive: {
      backgroundColor: theme.colors.primary,
    },
    secondaryOptionLabel: {
      // Figma label: DM Sans medium, white on the pill.
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: theme.text.fontFamily.medium,
    },
    secondaryOptionLabelActive: {
      color: "#ffffff",
    },
  });
}
