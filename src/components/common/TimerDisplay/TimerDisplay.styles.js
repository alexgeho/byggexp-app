import { StyleSheet } from "react-native";

export function createStyles(theme) {
  const timerColor =
    theme.colors.timerText || theme.colors.text;
  const secondsColor =
    theme.colors.timerSeconds || timerColor;
  const timerFontFamily =
    theme.colors.timerFontFamily ||
    theme.text.fontFamily.regular;
  const timerFontSize =
    theme.colors.timerFontSize || 42;
  const timerFontWeight =
    theme.colors.timerFontWeight;

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    time: {
      color: timerColor,
      fontFamily: timerFontFamily,
      fontSize: timerFontSize,
      fontWeight: timerFontWeight,
      textAlign: "center",
    },

    separator: {
      color: timerColor,
      fontFamily: timerFontFamily,
      fontSize: timerFontSize,
      fontWeight: timerFontWeight,
      textAlign: "center",
    },

    seconds: {
      color: secondsColor,
      fontFamily: timerFontFamily,
      fontSize: timerFontSize,
      fontWeight: timerFontWeight,
      textAlign: "center",
    },
  });
}