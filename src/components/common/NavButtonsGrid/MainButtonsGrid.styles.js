import { StyleSheet } from "react-native";

import { hexToRgba } from "../../../theme/colorUtils";

export function createStyles(theme) {
  const buttonBackground =
    theme.colors.homeButtonBackground || theme.colors.card;
  const buttonBorder = theme.colors.homeButtonBorder || theme.colors.border;
  const baseLabelColor =
    theme.colors.homeButtonText || theme.colors.textBtn || theme.colors.text;
  // On the light themes the label takes the ink of the text inside the blocks
  // below the grid ("Inga arbetspass hittades ännu.") — the label colour at
  // 70%, which keeps the grid from shouting. White labels over a gradient or
  // a near-black page stay at full strength: dimming them there only makes
  // them hard to read.
  const isWhiteInk =
    String(baseLabelColor).trim().toUpperCase() === "#FFFFFF" ||
    String(baseLabelColor).trim().toUpperCase() === "#FFF";
  const labelColor = isWhiteInk
    ? baseLabelColor
    : hexToRgba(baseLabelColor, 0.7);

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

    // Same type as the section headings under the grid ("Dagsrapport",
    // "Uppgifter"): 15px, regular weight. The card is already a big tap target
    // — it doesn't need bold on top, and matching the headings keeps one voice
    // down the screen.
    buttonText: {
      color: labelColor,
      fontFamily: theme.text.fontFamily.medium,
      fontSize: 15,
      fontWeight: theme.homeButton.textWeight,
    },
  });
}
