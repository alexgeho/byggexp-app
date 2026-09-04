import { StyleSheet } from "react-native";

export function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    // Solid surface (not the frosted surfaceMuted) so the card reads clearly on
    // the Home blue gradient — the previous translucent fill was light-on-light.
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.success,
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
  });
}
