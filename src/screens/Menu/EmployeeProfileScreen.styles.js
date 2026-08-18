import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

// Extracted from EmployeeProfileScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: c.textPrimary,
      fontSize: 17,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    contentScroll: {
      flex: 1,
      width: "100%",
    },
    contentContent: {
      paddingBottom: 120,
      gap: 16,
    },
    heroCard: {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 24,
      padding: 20,
      alignItems: "center",
      gap: 8,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 999,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
    },
    heroSubtitle: {
      color: c.textMuted,
      fontSize: 15,
      textAlign: "center",
    },
    heroMeta: {
      color: c.textPrimary,
      fontSize: 14,
      textAlign: "center",
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 999,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
    },
    actionButtonPrimary: {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      borderColor: "#FFFFFF",
    },
    actionButtonDanger: {
      backgroundColor: "rgba(198, 40, 40, 0.08)",
      borderColor: "rgba(198, 40, 40, 0.2)",
    },
    actionButtonDisabled: {
      opacity: 0.55,
    },
    actionButtonText: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: "600",
      flexShrink: 1,
    },
    actionButtonTextDanger: {
      color: "#C62828",
    },
    groupCard: {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 24,
      overflow: "hidden",
    },
    infoRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 4,
    },
    groupRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    infoLabel: {
      fontSize: 12,
      color: "rgba(5, 45, 80, 0.55)",
    },
    infoValue: {
      fontSize: 16,
      color: c.textPrimary,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    sectionCount: {
      color: c.textMuted,
      fontSize: 13,
    },
    emptySection: {
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      padding: 16,
    },
    emptySectionText: {
      color: c.textMuted,
      textAlign: "center",
    },
    noteComposer: {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 24,
      padding: 16,
      gap: 12,
    },
    noteInput: {
      minHeight: 96,
      color: c.textPrimary,
      fontSize: 15,
      textAlignVertical: "top",
    },
    noteSendButton: {
      alignSelf: "flex-end",
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0091FF",
    },
    noteCard: {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 24,
      padding: 16,
      gap: 10,
    },
    noteHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    noteMeta: {
      flex: 1,
      gap: 2,
    },
    noteAuthor: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    noteSubtitle: {
      color: c.textMuted,
      fontSize: 12,
    },
    noteText: {
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 21,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    emptyTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    emptySubtitle: {
      color: c.textMuted,
      fontSize: 14,
      textAlign: "center",
    },
    toolPhoto: {
      width: 48,
      height: 48,
      borderRadius: 12,
    },
    toolPhotoPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#EFF3F8",
    },
  });
