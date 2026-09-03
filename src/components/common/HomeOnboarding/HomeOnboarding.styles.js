import { StyleSheet } from "react-native";

export function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    card: {
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      padding: 16,
      gap: 12,
      marginBottom: 16,
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
      fontSize: 17,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
    },
    check: {
      width: 26,
      height: 26,
      borderRadius: 999,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
    },
    rowLabelDone: {
      color: c.textMuted,
      textDecorationLine: "line-through",
    },
  });
}
