import { StyleSheet } from "react-native";

// Extracted from TasksScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    screenExtra: {
      justifyContent: "space-between",
      alignItems: "center",
    },
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    searchContainer: {
      width: "100%",
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
    // SectionList manages its own layout, so spacing is applied per row/header
    // (12px) instead of via a container `gap`.
    listContent: {
      width: "100%",
      paddingBottom: 140,
    },
    sectionHeaderSpacing: {
      marginBottom: 12,
    },
    taskCardSpacing: {
      marginBottom: 12,
    },
    projectGroup: {
      width: "100%",
      gap: 12,
    },
    projectGroupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    projectTitle: {
      color: c.textPrimary,
      fontSize: 17,
      flex: 1,
      marginRight: 12,
    },
    projectCount: {
      color: c.textMuted,
      fontSize: 14,
    },

    headerDateText: {
      fontSize: 13,
      flexShrink: 0,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: c.textMuted,
      fontSize: 16,
    },
  });
