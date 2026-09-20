import { StyleSheet } from "react-native";

export function createStyles(theme) {
  const buttonBackground =
    theme.colors.homeButtonBackground || theme.colors.card;
  const buttonBorder = theme.colors.homeButtonBorder || theme.colors.border;
  // Label and icon carry the theme's ink at full strength — the same colour
  // as the section headings under the grid ("Dagsrapport", "Uppgifter"), so
  // the whole screen speaks in one voice.
  const labelColor =
    theme.colors.homeButtonText || theme.colors.textBtn || theme.colors.text;

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
      minHeight: theme.homeButton.height,
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
      // Icon and label are one unit — same ink, same weight of presence.
      tintColor: labelColor,
    },

    // Label type comes from the theme: the pale-blue and grey homes read like
    // the section headings under the grid (15px, regular), the rest keep the
    // bolder 16px label.
    buttonText: {
      color: labelColor,
      fontFamily:
        theme.text.fontFamily[theme.homeButton.labelFamily || "regular"],
      fontSize: theme.homeButton.labelSize || theme.text.sizes.medium,
      fontWeight: theme.homeButton.textWeight,
    },
  });
}
