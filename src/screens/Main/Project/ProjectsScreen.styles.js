import { StyleSheet } from "react-native";

// Extracted from ProjectsScreen.jsx.
export const createStyles = (c) =>
  StyleSheet.create({
    // "All projects" as a heading over the list, not a card.
    allProjectsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 4,
    },
    allProjectsText: {
      fontSize: 15,
      fontFamily: "DMSans-Medium",
      color: c.textMuted,
    },
    allProjectsTextActive: {
      color: c.textPrimary,
    },
    screenExtra: {
      justifyContent: "space-between",
      alignItems: "center",
    },
    inlineLoader: {
      minHeight: 240,
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    searchContainer: {
      width: "100%",
    },
    searchInputWrapper: {
      width: "100%",
      height: 48,
      backgroundColor: c.inputSurface,
      borderRadius: 20,
      paddingLeft: 16,
      paddingRight: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    searchInput: {
      flex: 1,
      height: "100%",
      color: c.textPrimary,
      fontSize: 16,
      paddingVertical: 0,
      paddingRight: 12,
    },
    searchIconWrapper: {
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      width: "100%",
      gap: 12,
      paddingBottom: 140,
    },
    // Red "delete" panel revealed when a project card is swiped left.
    swipeDeleteAction: {
      backgroundColor: "#FF3B30",
      width: 92,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    swipeDeleteText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },

    noProjectsText: {
      textAlign: "center",
      marginTop: 20,
      color: c.textMuted,
      fontSize: 16,
    },
    // Theme the card's secondary (location) line so it follows dark mode.
    mutedText: {
      color: c.textMuted,
    },
    floatingAddButton: {
      position: "absolute",
      right: 16,
      bottom: 45,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#0091FF",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
    },
  });
