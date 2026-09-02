import { StyleSheet } from "react-native";

// Extracted from LegalPoliciesScreen.jsx — themed style factory (c = theme.content).
// Container + header now come from the shared <Screen> scaffold.
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
      borderColor: c.border,
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
    groupCard: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
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
    paragraph: {
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 14,
    },
    paragraphLast: {
      marginBottom: 0,
    },
    infoRow: {
      paddingVertical: 12,
    },
    infoRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    infoLabel: {
      color: c.textMuted,
      fontSize: 13,
      marginBottom: 4,
    },
    infoValue: {
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 22,
    },
    loadingRow: {
      paddingTop: 12,
      alignItems: "flex-start",
    },
  });
