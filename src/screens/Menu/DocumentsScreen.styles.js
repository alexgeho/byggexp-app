import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";

// Extracted from DocumentsScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    centeredContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
    },
    statusText: {
      marginTop: 12,
      fontSize: 15,
      color: "#4D6376",
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
    },
    placeholder: {
      ...standardScreenHeaderPlaceholder,
    },
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
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      padding: 20,
    },
    heroIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: 20,
      marginBottom: 8,
    },
    heroText: {
      color: "#4D6376",
      fontSize: 15,
      lineHeight: 22,
    },
    summaryRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 18,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 18,
      backgroundColor: c.surface,
      paddingVertical: 14,
      paddingHorizontal: 10,
      alignItems: "center",
    },
    summaryValue: {
      color: c.textPrimary,
      fontSize: 20,
      marginBottom: 4,
    },
    summaryLabel: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: "center",
    },
    sectionWrap: {
      width: "100%",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 17,
    },
    sectionCountBadge: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(5, 45, 80, 0.08)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    sectionCountText: {
      color: c.textPrimary,
      fontSize: 13,
    },
    groupCard: {
      width: "100%",
      backgroundColor: "rgba(255,255,255,0.6)",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      overflow: "hidden",
    },
    documentRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    documentRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: "#e9e9e9",
    },
    documentIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "rgba(5, 45, 80, 0.08)",
      alignItems: "center",
      justifyContent: "center",
    },
    documentContent: {
      flex: 1,
      gap: 2,
    },
    documentName: {
      color: c.textPrimary,
      fontSize: 15,
    },
    documentMeta: {
      color: "#4D6376",
      fontSize: 13,
    },
    documentSubMeta: {
      color: c.textMuted,
      fontSize: 12,
    },
    documentRight: {
      alignItems: "flex-end",
      gap: 8,
    },
    extensionBadge: {
      minWidth: 44,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 8,
      backgroundColor: "rgba(5, 45, 80, 0.08)",
      alignItems: "center",
      justifyContent: "center",
    },
    extensionText: {
      color: c.textPrimary,
      fontSize: 10,
    },
    emptySection: {
      paddingHorizontal: 18,
      paddingVertical: 20,
    },
    emptySectionText: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    logoutButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
    },
  });
