import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

// Extracted from EmployeesScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
      gap: 12,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      color: c.textPrimary,
      textAlign: "center",
    },
    searchContainer: {
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
      // 10px card spacing comes from PersonListItem's marginBottom (Figma).
    },
    emptyState: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      color: c.textPrimary,
      fontWeight: "600",
    },
    emptySubtitle: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: "center",
    },
    accessDeniedContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 8,
    },
    accessDeniedText: {
      fontSize: 18,
      fontWeight: "600",
      color: c.textPrimary,
    },
    accessDeniedSubtext: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: "center",
    },
  });
