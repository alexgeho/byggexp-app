import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

// Themed style factory (c = theme.content) — mirrors ToolsScreen.styles.
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
    headerSpacer: {
      width: 44,
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
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 6,
    },
    cardDate: {
      fontSize: 12,
      color: c.textMuted,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: c.textPrimary,
    },
    cardBody: {
      fontSize: 14,
      color: c.textMuted,
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
