import { StyleSheet } from "react-native";

export function createStyles({
  compact = false,
  veryCompact = false,
  hasSections = false,
  theme,
  isLightBlue = false,
}) {
  // Native clears the status bar / notch with a fixed pad; web overrides this
  // inline with the real safe-area inset (see HomeVariant2 LinearGradient).
  const topPadding = veryCompact ? 34 : compact ? 44 : 60;
  const horizontalPadding = compact ? 16 : 20;
  const sectionGap = veryCompact ? 14 : compact ? 18 : 24;
  const timerBottomCompensation = veryCompact ? 8 : compact ? 12 : 16;
  const textColor = theme?.colors?.text || "#FFFFFF";

  return StyleSheet.create({
    container: {
      paddingTop: topPadding,
      paddingHorizontal: horizontalPadding,
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 30,
    },
    scrollView: {
      flex: 1,
    },
    main: {
      flexGrow: 1,
      marginTop: compact ? 18 : 30,
      paddingBottom: hasSections ? 30 : 12,
    },
    mainEvenlyDistributed: {
      marginTop: 0,
      paddingBottom: compact ? 12 : 16,
    },
    selectorTop: {
      marginBottom: compact ? 16 : 20,
    },
    mainContent: {
      flexGrow: 1,
      minHeight: 0,
    },
    mainContentEvenlySpaced: {
      flex: 1,
    },
    mainContentGroup: {
      gap: sectionGap,
    },
    mainContentGroupExpanded: {
      flex: 1,
    },
    // Lower blocks are inactive while entering hours on the wheel — dim them.
    inactiveDimmed: {
      opacity: 0.35,
    },
    coreControlsGroup: {
      alignItems: "stretch",
    },
    coreControlsGroupEvenlySpaced: {
      flex: 1,
      justifyContent: "space-between",
    },
    timerToActionsSpacer: {
      height: Math.max(sectionGap - timerBottomCompensation, 0),
    },
    actionsToQuickActionsSpacer: {
      height: sectionGap,
    },
    selectorCompact: {
      paddingHorizontal: veryCompact ? 16 : 18,
      paddingVertical: veryCompact ? 14 : 16,
    },
    selectorTextCompact: {
      fontSize: veryCompact ? 15 : 16,
      lineHeight: veryCompact ? 19 : 21,
    },
    selectorIconCompact: {
      transform: [{ scale: veryCompact ? 0.9 : 0.95 }],
    },
    selectorLightBlue: {
      backgroundColor: "#FFFFFF",
      borderColor: "rgba(1,13,24,0.08)",
    },
    selectorTextLightBlue: {
      color: textColor,
    },
    selectorIconLightBlue: {
      tintColor: textColor,
    },
    selectorColorful: {
      backgroundColor: "rgba(5, 45, 80, 0.05)",
      borderColor: "transparent",
      borderWidth: 0,
      borderRadius: 100,
      minHeight: 52,
    },
    selectorTextColorful: {
      color: "#052D50",
      opacity: 0.5,
    },
    selectorIconColorful: {
      tintColor: "#052D50",
    },
    timerContainer: {
      width: "100%",
    },
    // Fixed-height slot shared by the clock and the hours wheel so switching
    // between them never shifts the layout below. overflow is visible so the
    // wheel's peeking neighbour digits can extend past the one-row slot.
    timerSlot: {
      justifyContent: "center",
      alignItems: "center",
      overflow: "visible",
    },
    timerTextLightBlue: {
      color: textColor,
    },
    timerTextCompact: {
      fontSize: veryCompact ? 100 : 118,
      lineHeight: veryCompact ? 96 : 112,
      letterSpacing: veryCompact ? -1.4 : -2,
      textAlign: "center",
    },
    timerTextRegular: {
      textAlign: "center",
    },
    timerSecondsLightBlue: {
      opacity: 0.5,
    },
    timerSecondsCompact: {
      opacity: isLightBlue ? 0.5 : 0.35,
    },
    footerIconLightBlue: {
      tintColor: textColor,
    },
  });
}
