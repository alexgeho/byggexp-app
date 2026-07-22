import { StyleSheet } from "react-native";

export function createStyles(theme) {
  const buttonBackground =
    theme.colors.homeButtonBackground || theme.colors.card;
  const buttonBorder =
    theme.colors.homeButtonBorder || theme.colors.border;

  return StyleSheet.create({
    container: {
      flexWrap: "wrap",
      width: "100%",
      flexDirection: "row",
      alignItems: "stretch",
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
      minHeight: theme.colors.homeButtonMinHeight || 150,
      borderRadius: theme.colors.homeButtonRadius || 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: buttonBorder,
      backgroundColor: buttonBackground,
    },

    buttonInner: {
      flex: 1,
      flexDirection: "column",
      padding: theme.colors.homeButtonPadding || 16,
      gap: theme.colors.homeButtonContentGap || 8,
      alignItems: theme.colors.homeButtonAlignItems || "stretch",
      justifyContent: "center",
    },

    iconWrapper: {
      position: "relative",
      alignSelf: theme.colors.homeButtonIconAlignSelf || "flex-start",
    },

    infoBadgesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignSelf: "flex-start",
      gap: 6,
    },

    buttonIcon: {
      width: theme.colors.homeButtonIconSize || 26,
      height: theme.colors.homeButtonIconSize || 26,
      resizeMode: "contain",
      tintColor: theme.colors.icon,
    },

    buttonText: {
      color: theme.colors.textBtn || theme.colors.text,
      fontFamily: theme.text.fontFamily.regular,
      fontSize: theme.text.sizes.medium,
      fontWeight: theme.colors.homeButtonTextWeight,
    },
  });
}
