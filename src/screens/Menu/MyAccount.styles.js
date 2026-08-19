import { StyleSheet } from "react-native";

// Extracted from MyAccount.jsx — themed style factory (c = theme.content).
// Container + header now come from the shared <Screen> scaffold.
export const createStyles = (c) =>
  StyleSheet.create({
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: c.background,
    },
    statusText: {
      marginTop: 12,
      color: c.textMuted,
    },
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      paddingBottom: 120,
      gap: 12,
    },
    avatarContainer: {
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarWrapper: {
      width: 130,
      height: 130,
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 9999,
    },
    editAvatarButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 34,
      height: 34,
      backgroundColor: c.surface,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    editAvatarIcon: {
      width: 11,
      height: 11,
    },
    roleBadgeLarge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 12,
      gap: 8,
    },
    roleBadgeIcon: {
      width: 16,
      height: 16,
    },
    roleBadgeText: {
      fontSize: 14,
      fontWeight: "600",
    },
    inputContainer: {
      width: "100%",
      padding: 12,
      paddingLeft: 24,
      paddingRight: 24,
      backgroundColor: c.surface,
      borderRadius: 12,
    },
    inputLabelRow: {
      flexDirection: "row",
    },
    inputLabel: {
      color: c.textMuted,
    },
    requiredAsterisk: {
      color: "#ff0000ff",
    },
    textInput: {
      marginTop: 6,
      color: c.textPrimary,
      fontSize: 16,
      paddingVertical: 4,
    },
    readOnlyInput: {
      color: c.textMuted,
    },
    rowContainer: {
      width: "100%",
      flexDirection: "row",
      gap: 12,
    },
    areaCodeContainer: {
      width: "35%",
      padding: 12,
      paddingLeft: 24,
      paddingRight: 24,
      backgroundColor: c.surface,
      borderRadius: 12,
    },
    phoneContainer: {
      flex: 1,
      padding: 12,
      paddingLeft: 24,
      paddingRight: 24,
      backgroundColor: c.surface,
      borderRadius: 12,
    },
    documentsContainer: {
      width: "100%",
      padding: 12,
      backgroundColor: c.surface,
      borderRadius: 12,
      gap: 8,
      position: "relative",
    },
    documentsLabel: {
      color: c.textMuted,
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 10,
    },
    addIcon: {
      width: 20,
      height: 20,
    },
    documentsGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    documentCard: {
      width: "23%",
      height: 84,
      backgroundColor: "#EFEFF0",
      borderRadius: 12,
      overflow: "hidden",
    },
    documentImage: {
      width: "100%",
      height: "100%",
    },
    documentFileContent: {
      flex: 1,
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: 8,
    },
    documentName: {
      color: c.textPrimary,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "500",
    },
    documentTypeBadge: {
      color: c.textPrimary,
      fontSize: 10,
      fontWeight: "700",
    },
    emptyDocumentsText: {
      color: c.textMuted,
      marginTop: 4,
    },
    documentsHint: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    saveButtonText: {
      color: "#ffffff",
      fontSize: 15,
      fontFamily: "DMSans-SemiBold",
    },
    dangerZone: {
      marginTop: 28,
      marginBottom: 8,
    },
    deleteAccountButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#F0C4C4",
      backgroundColor: "#FDECEC",
    },
    deleteAccountText: {
      color: "#D64545",
      fontSize: 15,
      fontFamily: "DMSans-SemiBold",
    },
    deleteAccountHint: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: "center",
      marginTop: 8,
    },
  });
