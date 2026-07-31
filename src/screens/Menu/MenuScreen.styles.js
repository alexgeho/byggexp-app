import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      ...standardScreenContainer,
    },
    header: {
      ...standardScreenHeader,
    },
    backButton: {
      padding: 16,
      backgroundColor: "#ffffff",
      borderRadius: 9999,
    },
    backIcon: {
      width: 20,
      height: 20,
    },
    headerTitle: {
      color: "#052D50",
      fontSize: 17,
      textAlign: "center",
    },
    placeholder: {
      ...standardScreenHeaderPlaceholder,
    },
    sectionTitle: {
      color: "#698196",
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 8,
      paddingHorizontal: 8,
    },
    menuSection: {
      marginBottom: 16,
    },
    settingsSection: {
      marginBottom: 24,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    groupCard: {
      width: "100%",
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f9f9f9",
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    menuIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    menuIcon: {
      width: 16,
      height: 16,
      tintColor: "#ffffff",
    },
    menuTitle: {
      flex: 1,
      marginLeft: 12,
      color: "#052D50",
      fontSize: 16,
    },
    arrowIcon: {
      width: 16,
      height: 16,
      tintColor: "#698196",
    },
    userInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ffffff",
      borderRadius: 89,
      padding: 12,
      marginBottom: 16,
    },
    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 18,
      color: "#052D50",
    },
    roleBadge: {
      backgroundColor: theme.colors.primary + "1A",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 89,
      flexShrink: 0,
      marginLeft: 8,
      maxWidth: "46%",
    },
    roleText: {
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    logoutButtonText: {
      color: "#ffffff",
      fontSize: 12,
      textAlign: "center",
      paddingHorizontal: 4,
      fontFamily: theme.text.fontFamily.semiBold,
    },
  });
}
