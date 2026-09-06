import { StyleSheet } from "react-native";

// Extracted from ReportBugScreen.jsx — themed style factory (c = theme.content).
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
      borderRadius: 10,
      borderWidth: 0,
      padding: 20,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 10,
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
    formCard: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 0,
      padding: 18,
    },
    inputLabel: {
      color: c.textMuted,
      fontSize: 12,
      marginBottom: 8,
    },
    textArea: {
      minHeight: 130,
      color: c.textPrimary,
      fontSize: 16,
      padding: 0,
    },
    attachmentButton: {
      marginTop: 18,
      height: 44,
      borderRadius: 16,
      backgroundColor: "rgba(0, 145, 255, 0.1)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    attachmentButtonText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    attachmentPreview: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    previewMedia: {
      width: 96,
      height: 96,
      borderRadius: 16,
      backgroundColor: "#EFEFF0",
    },
    attachmentInfo: {
      flex: 1,
    },
    attachmentName: {
      color: c.textPrimary,
      fontSize: 14,
      marginBottom: 6,
    },
    removeAttachmentText: {
      color: "#D92D20",
      fontSize: 13,
      fontWeight: "600",
    },
    submitButton: {
      height: 54,
      borderRadius: 18,
      backgroundColor: "#0091FF",
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
