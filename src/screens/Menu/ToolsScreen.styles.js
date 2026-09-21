import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

// Extracted from ToolsScreen.jsx — themed style factory (c = theme.content).
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
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
      flex: 1,
    },
    scanButton: {
      height: 44,
      minWidth: 72,
      paddingHorizontal: 14,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0785F4",
      // Admin-style primary button glow for depth.
    },
    scanButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    searchContainer: {
      // No margin of its own: the list already leaves one gap under the
      // controls, and a second one here made the space above the first card
      // twice the gap between two cards.
      width: "100%",
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
      paddingBottom: 140,
      gap: 12,
    },
    toolPhoto: {
      width: 28,
      height: 28,
      borderRadius: 8,
      marginRight: 12,
    },
    toolPhotoPlaceholder: {
      width: 28,
      height: 28,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: c.inputSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    // Swipe-left delete action behind a tool card — same red slab as the
    // projects list.
    swipeDeleteAction: {
      backgroundColor: "#FF3B30",
      width: 92,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      marginBottom: 12,
    },
    swipeDeleteText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
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
  });
