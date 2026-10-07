import { StyleSheet } from "react-native";
import { radius } from "../../theme/tokens";

import { onDark } from "../../theme/colorUtils";

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
      borderRadius: radius.card,
      borderWidth: 0,
      padding: 20,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: 24,
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
      borderRadius: radius.card,
      borderWidth: 0,
      padding: 16,
    },
    // Same as the shared FieldRow label.
    inputLabel: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "600",
      marginBottom: 2,
    },
    textArea: {
      minHeight: 130,
      color: c.textPrimary,
      fontSize: 16,
      padding: 0,
    },
    attachmentButton: {
      marginTop: 16,
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
      backgroundColor: onDark(c, c.surfaceMuted, "#EFEFF0"),
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
      color: onDark(c, c.danger, "#D92D20"),
      fontSize: 13,
      fontWeight: "600",
    },
  });
