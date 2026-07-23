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
      justifyContent: theme.homeButton.gridJustify,
      gap: theme.homeButton.gridGap,
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
      width: theme.homeButton.width,
      height: theme.homeButton.height,
      borderRadius: theme.homeButton.radius,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: buttonBorder,
      backgroundColor: buttonBackground,
    },

    buttonInner: {
      flex: 1,
      flexDirection: "column",
      padding: theme.homeButton.padding,
      gap: theme.homeButton.contentGap,
      alignItems: theme.homeButton.alignItems,
      justifyContent: "center",
    },

    iconWrapper: {
      position: "relative",
      alignSelf: theme.homeButton.iconAlignSelf,
    },

    infoBadgesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignSelf: "flex-start",
      gap: 6,
    },

    buttonIcon: {
      width: theme.homeButton.iconSize,
      height: theme.homeButton.iconSize,
      resizeMode: "contain",
      tintColor: theme.colors.homeButtonText || theme.colors.icon,
    },

    buttonText: {
      color: theme.colors.homeButtonText || theme.colors.textBtn || theme.colors.text,
      fontFamily: theme.text.fontFamily.regular,
      fontSize: theme.text.sizes.medium,
      fontWeight: theme.homeButton.textWeight,
    },
  });
}
