import { StyleSheet } from "react-native";

// Extracted from NotificationsSettingsScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 150,
      gap: 14,
    },
    introCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      paddingHorizontal: 18,
      paddingVertical: 20,
    },
    introTitle: {
      color: c.textPrimary,
      fontSize: 18,
      marginBottom: 8,
    },
    introText: {
      color: "rgba(5, 45, 80, 0.7)",
      fontSize: 14,
      lineHeight: 22,
    },
    groupCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      overflow: "hidden",
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      paddingHorizontal: 18,
      paddingVertical: 18,
    },
    settingRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    settingTextWrap: {
      flex: 1,
      paddingRight: 6,
    },
    settingLabel: {
      color: c.textPrimary,
      fontSize: 16,
      marginBottom: 6,
    },
    settingDescription: {
      color: "rgba(5, 45, 80, 0.62)",
      fontSize: 13,
      lineHeight: 20,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 22,
    },
    loadingText: {
      color: "rgba(5, 45, 80, 0.72)",
      fontSize: 14,
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontFamily: "DMSans-SemiBold",
    },
  });
