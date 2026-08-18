import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

// Extracted from SelectWorkers.jsx.
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      justifyContent: "space-between",
      alignItems: "center",
    },
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
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
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      paddingBottom: 96,
      width: "100%",
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
      fontSize: 16,
      color: c.textPrimary,
    },
    workerEmail: {
      fontSize: 14,
      color: c.textMuted,
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
    noWorkersText: {
      textAlign: "center",
      marginTop: 20,
      color: c.textMuted,
      fontSize: 16,
    },
    addButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
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
