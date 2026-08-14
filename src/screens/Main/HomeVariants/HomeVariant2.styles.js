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
    // The clock always defines this slot's height (it stays in layout even
    // while editing); the wheel is drawn as an absolute overlay on top.
    timerSlot: {
      position: "relative",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    // Hide the clock (opacity) while editing but keep it in the layout so the
    // buttons below never move.
    timerHidden: {
      opacity: 0,
    },
    // Full-screen manual-hours editor: blurred backdrop + wheel + Done button.
    editOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 20,
    },
    editBlur: {
      ...StyleSheet.absoluteFillObject,
    },
    editContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    // Fixed gap between the wheel and the Done button; the whole group is
    // centred vertically so top and bottom spacing are equal.
    doneGap: {
      height: 40,
    },
    // Same look as the home-screen secondary round button (frosted circle).
    doneRound: {
      width: 124,
      height: 124,
      borderRadius: 999,
      backgroundColor: isLightBlue ? "#FFFFFF" : "rgba(255,255,255,0.20)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
      alignItems: "center",
      justifyContent: "center",
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
