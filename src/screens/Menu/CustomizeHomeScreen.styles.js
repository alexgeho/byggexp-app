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
    },

    title: {
      fontSize: 18,
      fontWeight: "600",
      color: c.textPrimary,
    },

    placeholder: {
      width: 44,
    },

    themeContainer: {
      marginBottom: 24,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: c.textPrimary,
      marginBottom: 12,
      marginLeft: 4,
    },

    themeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      rowGap: 12,
    },

    themeButton: {
      width: 42,
      height: 42,
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

    list: {
      backgroundColor: c.surface,
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 24,
    },

    // Narrow (50%) drawer: name + checkbox on the top row, reorder arrows
    // stacked underneath the name.
    item: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 6,
    },

    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },

    itemTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },

    itemText: {
      flex: 1,
      fontSize: 16,
      color: c.textPrimary,
    },

    itemReorderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    sectionRowActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    reorderButton: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: `${theme.colors.primary}33`,
      backgroundColor: c.surface,

      alignItems: "center",
      justifyContent: "center",
    },

    checkboxActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    checkmark: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },

    secondaryRow: {
      flexDirection: "column",
      gap: 10,
    },
    // Pill-shaped selector (fully rounded, icon + label in a row), matching the
    // Finance filter chips: inactive = surface, active = solid primary.
    // Stacked full-width in a column so they fit the narrow (50%) drawer.
    secondaryOption: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}26`,
    },
    secondaryOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondaryOptionLabel: {
      fontSize: 13,
      color: c.textPrimary,
      fontFamily: theme.text.fontFamily.medium,
    },
    secondaryOptionLabelActive: {
      color: "#ffffff",
    },
  });
}
