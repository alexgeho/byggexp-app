import { StyleSheet } from "react-native";

// Extracted from ChatListScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    searchButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surface,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 48,
      marginBottom: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: c.inputSurface,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: c.textPrimary,
      padding: 0,
    },
    searchContainer: {
      width: "100%",
      marginBottom: 12,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    listContent: {
      paddingBottom: 190,
      // Card spacing (10px, Figma) comes from PersonListItem's marginBottom;
      // no extra gap here or the rows would be 20px apart.
    },
    emptyState: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: c.textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: "center",
    },

    // Conversation row
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    rowSelected: {
      backgroundColor: "rgba(12, 119, 253, 0.6)",
      borderColor: "rgba(12, 119, 253, 0.6)",
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#D9D9D9",
    },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: {
      color: "#052D50",
      fontSize: 15,
      fontWeight: "700",
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowName: {
      color: "#052D50",
      fontSize: 17,
      fontWeight: "500",
    },
    rowTime: {
      color: "#667E93",
      fontSize: 13,
      fontWeight: "500",
    },
    rowPreview: {
      color: "#667E93",
      fontSize: 13,
      fontWeight: "500",
    },
    rowTextOnSel: {
      color: "#FFFFFF",
    },
    rowTimeOnSel: {
      color: "rgba(255, 255, 255, 0.85)",
    },
    rowRight: {
      alignItems: "flex-end",
      gap: 8,
    },
    // Multi-select check indicator shown on each row while picking recipients.
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#C3D2E0",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      marginRight: 4,
    },
    checkCircleOn: {
      backgroundColor: "#FFFFFF",
      borderColor: "#FFFFFF",
    },
    // "Select people" hint / live count shown above the list in select mode.
    selectHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: "rgba(7, 133, 244, 0.10)",
    },
    selectHintText: {
      color: "#0785F4",
      fontSize: 14,
      fontWeight: "600",
    },
    statusBadge: {
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      backgroundColor: "#0785F4",
      alignItems: "center",
      justifyContent: "center",
    },
    unreadBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    projectGroupButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#0785F4",
      borderRadius: 23,
      height: 46,
      marginBottom: 12,
    },
    projectGroupText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },

    // Group-selection bottom bar
    selectionBar: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 34,
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
    },
    cancelButtonText: {
      color: "#052D50",
      fontSize: 16,
      fontWeight: "700",
    },
    groupButton: {
      flex: 1,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0785F4",
    },
    groupButtonDisabled: {
      backgroundColor: "#9DB7D8",
    },
    groupButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
