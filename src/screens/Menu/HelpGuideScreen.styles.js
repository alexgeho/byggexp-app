import { StyleSheet } from "react-native";

// Extracted from HelpGuideScreen.jsx.
export const createStyles = (c) =>
  StyleSheet.create({
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      gap: 12,
      paddingBottom: 120,
    },
    heroCard: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.surface,
      padding: 20,
    },
    heroText: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    replayButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 999,
    },
    replayButtonText: {
      color: c.onAccent,
      fontSize: 15,
    },
    groupCard: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.surface,
      padding: 20,
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 18,
      marginBottom: 14,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 12,
    },
    bullet: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginTop: 7,
    },
    bulletText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 22,
    },
  });
