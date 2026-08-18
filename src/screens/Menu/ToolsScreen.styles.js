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
      backgroundColor: "rgba(5, 45, 80, 0.06)",
      alignItems: "center",
      justifyContent: "center",
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
      color: "rgba(5, 45, 80, 0.55)",
      textAlign: "center",
    },
  });
