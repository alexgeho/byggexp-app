import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";

// Extracted from LanguageScreen.jsx.
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
    },
    placeholder: {
      ...standardScreenHeaderPlaceholder,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 150,
      gap: 14,
    },
    groupCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      overflow: "hidden",
    },
    languageRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      paddingHorizontal: 18,
      paddingVertical: 18,
    },
    languageRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    languageLabel: {
      color: c.textPrimary,
      fontSize: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
    },
    checkmark: {
      color: "#FFFFFF",
      fontSize: 14,
    },
  });
