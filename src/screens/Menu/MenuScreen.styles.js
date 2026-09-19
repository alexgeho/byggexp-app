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
      backgroundColor: c.background, // follows theme (light #F2F2F7 / dark #141414)
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
      // iOS navigational group header (Mail "iCloud"/"Byggexp"): bold, follows theme.
      color: c.textPrimary, // label (light #000 / dark #FFF)
      fontSize: 20,
      fontWeight: "700",
      fontFamily: theme.text.fontFamily.bold,
    },
    sectionChevron: {
      width: 20,
      height: 20,
      tintColor: c.accent, // systemBlue chevron (theme accent)
    },
    settingsSection: {
      marginBottom: 24,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    groupCard: {
      width: "100%",
      backgroundColor: c.card, // list card, follows theme (light #FFF / dark #2C2C2E)
      borderRadius: 10, // iOS inset-grouped corner radius
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
    // Unset job title (worker): dashed, muted "add yours" invite.
    roleBadgePlaceholder: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.colors.primary + "66",
    },
    roleTextPlaceholder: {
      color: c.textMuted,
      fontWeight: "500",
    },
    // Job-title editor modal
    titleModalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    titleModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    titleModalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 20,
    },
    titleModalTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      fontFamily: theme.text.fontFamily.bold,
    },
    titleModalSubtitle: {
      color: c.textMuted,
      fontSize: 14,
      marginTop: 6,
      marginBottom: 16,
      lineHeight: 20,
    },
    titleModalInput: {
      backgroundColor: c.inputSurface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: c.textPrimary,
    },
    titleModalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
      gap: 12,
    },
    titleModalButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      minWidth: 96,
      alignItems: "center",
      justifyContent: "center",
    },
    titleModalCancel: {
      backgroundColor: c.surfaceMuted,
    },
    titleModalCancelText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    titleModalSave: {
      backgroundColor: theme.colors.primary,
    },
    titleModalSaveText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "700",
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
