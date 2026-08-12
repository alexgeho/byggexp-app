import { Platform, StyleSheet } from "react-native";

export function createStyles({
  compact = false,
  veryCompact = false,
  hasSections = false,
  theme,
  isLightBlue = false,
}) {
  // Native needs a large top padding to clear the status bar / notch. On web
  // the browser already reserves the status-bar area, so the same value leaves
  // a big empty gap above the project selector — use a small padding there.
  const topPadding =
    Platform.OS === "web" ? 12 : veryCompact ? 34 : compact ? 44 : 60;
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
