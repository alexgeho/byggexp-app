import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      ...standardScreenContainer,
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
      color: "#052D50",
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
      color: "#052D50",
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
      borderColor: "#C2CCD6",
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
      borderColor: "#FFFFFF",
    },

    list: {
      backgroundColor: "#ffffff",
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 24,
    },

    item: {
      padding: 16,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#E7EDF3",
    },

    itemText: {
      fontSize: 16,
      color: "#052D50",
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
      backgroundColor: "#FFFFFF",

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
  });
}
