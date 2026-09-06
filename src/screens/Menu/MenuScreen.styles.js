import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";

export function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    backButton: {
      padding: 16,
      backgroundColor: c.surface,
      borderRadius: 9999,
    },
    backIcon: {
      width: 20,
      height: 20,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
    },
    placeholder: {
      ...standardScreenHeaderPlaceholder,
    },
    sectionTitle: {
      // Matches Figma: DM Sans Medium 17, color #8296A7.
      color: c.textMuted,
      fontSize: 17,
      fontWeight: "500",
      fontFamily: theme.text.fontFamily.medium,
      marginBottom: 8,
      marginTop: 8,
      paddingHorizontal: 8,
    },
    menuSection: {
      marginBottom: 16,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    sectionHeaderTitle: {
      color: c.textMuted,
      fontSize: 17,
      fontWeight: "500",
      fontFamily: theme.text.fontFamily.medium,
    },
    sectionChevron: {
      width: 18,
      height: 18,
      tintColor: c.textMuted,
    },
    settingsSection: {
      marginBottom: 24,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    groupCard: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 24,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surfaceMuted,
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
      color: c.textPrimary,
      fontSize: 16,
    },
    arrowIcon: {
      width: 16,
      height: 16,
      tintColor: c.textMuted,
    },
    userInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
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
      color: c.textPrimary,
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
