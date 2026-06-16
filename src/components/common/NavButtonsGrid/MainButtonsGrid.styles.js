import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexWrap: "wrap",
      width: "100%",
      flexDirection: "row",
      justifyContent: theme.colors.homeButtonGridJustify || "center",
      gap: theme.colors.homeButtonGridGap || 15,
    },

    linesContainer: {
      position: "absolute",
      left: -35,
      bottom: 10,
      transform: [{ rotate: "45deg" }],
      gap: 6,
    },

    linesContainerHidden: {
      display: "none",
    },

    line: {
      width: 80,
      height: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },

    button: {
      width: theme.colors.homeButtonWidth || "42%",
      minHeight: theme.colors.homeButtonMinHeight,
      borderRadius: theme.colors.homeButtonRadius || 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },

    buttonInner: {
      flexDirection: "column",
      padding: theme.colors.homeButtonPadding || 16,
      gap: 18,
      alignItems: theme.colors.homeButtonAlignItems || "center",
      justifyContent: "space-between",
      minHeight: theme.colors.homeButtonMinHeight,
    },

    iconWrapper: {
      position: "relative",
      alignSelf: theme.colors.homeButtonIconAlignSelf,
    },

    buttonIcon: {
      width: theme.colors.homeButtonIconSize || 26,
      height: theme.colors.homeButtonIconSize || 26,
      tintColor: theme.colors.icon,
    },

    buttonText: {
      color: theme.colors.textBtn,
      fontFamily: theme.text.fontFamily.regular,
      fontSize: theme.text.sizes.medium,
      fontWeight: theme.colors.homeButtonTextWeight,
    },
  });
}