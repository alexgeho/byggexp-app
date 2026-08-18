import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";

// Extracted from HelpSupportScreen.jsx.
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
      width: "100%",
    },
    scrollContent: {
      gap: 12,
      paddingBottom: 120,
    },
    heroCard: {
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      padding: 20,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
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
    supportCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      padding: 20,
      gap: 14,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: 24,
      height: 24,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      color: c.textPrimary,
      fontSize: 18,
      marginBottom: 6,
    },
    cardValue: {
      fontSize: 16,
      marginBottom: 6,
    },
    cardDescription: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
  });
