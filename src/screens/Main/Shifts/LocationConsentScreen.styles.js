import { StyleSheet } from "react-native";

// Extracted from LocationConsentScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      gap: 12,
      paddingBottom: 24,
    },
    heroCard: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.surface,
      padding: 20,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    heroIcon: {
      width: 32,
      height: 32,
      resizeMode: "contain",
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: 22,
      marginBottom: 8,
      textAlign: "center",
    },
    heroText: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    groupCard: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.surface,
      padding: 20,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 14,
    },
    bulletRowLast: {
      marginBottom: 0,
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
    disclaimer: {
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 19,
      paddingHorizontal: 4,
    },
    footer: {
      width: "100%",
      paddingTop: 8,
      paddingBottom: 12,
      gap: 8,
    },
    primaryButton: {
      width: "100%",
      height: 54,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
    },
    secondaryButton: {
      width: "100%",
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButtonText: {
      color: c.textMuted,
      fontSize: 15,
    },
  });
