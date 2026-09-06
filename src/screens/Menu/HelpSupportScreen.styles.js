import { StyleSheet } from "react-native";

// Extracted from HelpSupportScreen.jsx.
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
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 0,
      padding: 20,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: 24,
      marginBottom: 8,
      textAlign: "center",
    },
    heroText: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    supportCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 0,
      padding: 20,
      gap: 14,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: 24,
      height: 24,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      color: c.textPrimary,
      fontSize: 18,
      marginBottom: 6,
    },
    cardValue: {
      fontSize: 16,
      marginBottom: 6,
    },
    cardDescription: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
  });
