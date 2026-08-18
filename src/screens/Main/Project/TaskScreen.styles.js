import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

// Extracted from TaskScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      alignItems: "center",
      paddingBottom: 24,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      flex: 1,
      textAlign: "center",
      fontFamily: "DMSans-SemiBold",
    },
    placeholder: {
      width: 44,
      height: 44,
    },
    tabContainer: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    tabButton: {
      padding: 4,
      flex: 1,
      paddingLeft: 8,
      paddingRight: 8,
      backgroundColor: c.surfaceMuted,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.surface,
    },
    activeTab: {
      borderColor: "#0785F4",
    },
    tabText: {
      color: c.textPrimary,
      width: "100%",
      textAlign: "center",
    },
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      width: "100%",
      paddingBottom: 140,
    },
    groupCard: {
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.surface,
    },
    groupRow: {
      minHeight: 60,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#e9e9e9",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    groupRowLast: {
      borderBottomWidth: 0,
    },
    rowTextContainer: {
      flex: 1,
    },
    rowLabel: {
      color: c.textMuted,
      fontSize: 12,
      marginBottom: 2,
    },
    rowValue: {
      color: c.textPrimary,
      fontSize: 16,
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      height: 30,
      borderRadius: 999,
      justifyContent: "center",
    },
    statusBadge_open: {
      backgroundColor: "rgba(7, 133, 244, 0.12)",
    },
    statusBadge_overdue: {
      backgroundColor: "rgba(255, 59, 48, 0.12)",
    },
    statusBadge_completed: {
      backgroundColor: "rgba(52, 199, 89, 0.14)",
    },
    statusBadgeText: {
      fontSize: 13,
      fontWeight: "700",
    },
    statusBadgeText_open: {
      color: "#0785F4",
    },
    statusBadgeText_overdue: {
      color: "#FF3B30",
    },
    statusBadgeText_completed: {
      color: "#248A3D",
    },
    multilineValue: {
      lineHeight: 22,
    },
    dateChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    scheduleRowContent: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    scheduleLabel: {
      color: c.textPrimary,
      fontSize: 16,
    },
    dateChip: {
      backgroundColor: "#7676801F",
      paddingHorizontal: 12,
      height: 34,
      borderRadius: 17,
      justifyContent: "center",
    },
    dateChipText: {
      color: c.textPrimary,
      fontSize: 14,
    },
    documentItem: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 16,
      gap: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.surface,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    documentPreviewContainer: {
      width: 80,
      height: 80,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: c.background,
    },
    documentPreviewImage: {
      width: "100%",
      height: "100%",
    },
    documentFilePreview: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      gap: 8,
    },
    documentFileType: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      color: c.textPrimary,
      fontSize: 15,
    },
    documentArrowIcon: {
      width: 10,
      height: 20,
      tintColor: c.textPrimary,
    },
    workerItem: {
      width: "100%",
      padding: 8,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.surface,
      gap: 16,
      marginBottom: 12,
    },
    workerAvatar: {
      width: 46,
      height: 46,
      borderRadius: 9999,
    },
    workerInfo: {
      flex: 1,
    },
    workerName: {
      color: c.textPrimary,
    },
    workerSubtitle: {
      marginTop: 2,
      color: c.textMuted,
      fontSize: 12,
    },
    emptyState: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.surface,
    },
    emptyStateTitle: {
      color: c.textPrimary,
      fontSize: 18,
      marginBottom: 6,
    },
    emptyStateText: {
      color: c.textMuted,
    },
  });
