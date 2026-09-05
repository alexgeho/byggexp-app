import { StyleSheet } from "react-native";

import { successPopupIconColor } from "../../../theme/settings";

export function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    // ~90% opaque surface (10% transparent) so the card blends slightly into the
    // Home glass aesthetic while still reading clearly — a solid fill popped too
    // hard, the old frosted surfaceMuted was light-on-light.
    card: {
      backgroundColor:
        c.scheme === "dark" ? "rgba(44,44,46,0.90)" : "rgba(255,255,255,0.90)",
      borderRadius: 20,
      padding: 16,
      gap: 12,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    subtitle: {
      color: c.textMuted,
      fontSize: 13,
      fontFamily: theme.text.fontFamily.regular,
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: c.inputSurface,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
    },
    list: {
      gap: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginHorizontal: -10,
      borderRadius: 14,
    },
    // The single "do this next" step gets a soft tinted background so the eye
    // lands on one clear action.
    rowActive: {
      backgroundColor: c.accentSoft,
    },
    iconCircle: {
      width: 30,
      height: 30,
      borderRadius: 999,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: {
      flex: 1,
      gap: 1,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: theme.text.fontFamily.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    rowTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    rowTitleDone: {
      color: c.textMuted,
      textDecorationLine: "line-through",
      fontFamily: theme.text.fontFamily.medium,
    },
    rowDesc: {
      color: c.textMuted,
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: theme.text.fontFamily.regular,
    },
    doneTag: {
      color: successPopupIconColor,
      fontSize: 13,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    footerCta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 4,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.accentSoft,
      backgroundColor: c.accentSoft,
    },
    footerCtaText: {
      fontSize: 15,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    // Admin focus routing
    focusChoices: {
      gap: 10,
      alignItems: "stretch",
    },
    focusBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.accentSoft,
      backgroundColor: c.accentSoft,
    },
    focusBtnText: {
      fontSize: 15,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    focusSkip: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: 14,
      fontFamily: theme.text.fontFamily.medium,
      paddingVertical: 4,
    },
    changeFocus: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: 13,
      fontFamily: theme.text.fontFamily.medium,
      marginTop: 2,
    },
    // Report-time chooser sheet
    sheetBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 34,
      gap: 6,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: c.border,
      marginBottom: 10,
    },
    sheetTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontFamily: theme.text.fontFamily.semiBold,
      marginBottom: 6,
      marginLeft: 4,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 6,
    },
  });
}
