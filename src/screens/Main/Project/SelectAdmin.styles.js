import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

// Extracted from SelectAdmin.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      justifyContent: "space-between",
      alignItems: "center",
    },
    header: {
      ...standardScreenHeader,
    },
    backButton: {
      padding: 16,
      backgroundColor: c.surfaceMuted,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.surface,
    },
    backIcon: {
      width: 20,
      height: 20,
    },
    projectName: {
      color: c.textPrimary,
      flex: 1,
      textAlign: "center",
      fontSize: 17,
      fontWeight: "500",
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
      paddingBottom: 96,
      width: "100%",
    },
    taskItem: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 16,
      gap: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.surface,
      marginBottom: 16,
    },
    taskTitle: {
      color: c.textPrimary,
      fontSize: 22,
    },
    taskDescription: {
      color: c.textMuted,
    },
    taskFooter: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      alignItems: "center",
    },
    taskAssignee: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    assigneeAvatar: {
      width: 30,
      height: 30,
    },
    assigneeName: {
      color: c.textPrimary,
    },
    taskDate: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      padding: 4,
      paddingLeft: 12,
      paddingRight: 12,
      backgroundColor: c.inputSurface,
      borderRadius: 999,
    },
    dateIcon: {
      width: 14,
      height: 14,
    },
    dateText: {
      color: "#0785F4",
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
    documentImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
    },
    documentInfo: {},
    documentName: {
      color: c.textPrimary,
    },
    documentMeta: {
      color: c.textMuted,
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
    workerName: {
      flex: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
      borderColor: c.surface,
      marginRight: 8,
    },
    arrowIcon: {
      width: 16,
      height: 26,
      marginRight: 12,
    },
    accessDeniedContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    accessDeniedText: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.textPrimary,
      marginBottom: 12,
    },
    accessDeniedSubtext: {
      fontSize: 16,
      color: c.textMuted,
      textAlign: "center",
    },
  });
