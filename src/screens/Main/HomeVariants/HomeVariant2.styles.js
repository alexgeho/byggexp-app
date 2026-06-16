import { StyleSheet } from "react-native";

export function createStyles({
  compact = false,
  veryCompact = false,
  hasSections = false,
  theme,
  isLightBlue = false,
}) {
  const topPadding = veryCompact
    ? 34
    : compact
      ? 44
      : 60;
  const horizontalPadding = compact ? 16 : 20;
  const sectionGap = veryCompact
    ? 14
    : compact
      ? 18
      : 24;
  const gridGap = veryCompact ? 10 : 16;
  const cardHeight = veryCompact
    ? 88
    : compact
      ? 98
      : 116;
  const cardPadding = veryCompact
    ? 14
    : compact
      ? 16
      : 20;
  const iconSize = veryCompact ? 22 : compact ? 24 : 28;
  const textSize = veryCompact ? 14 : compact ? 15 : 16;
  const timerBottomCompensation = veryCompact ? 8 : compact ? 12 : 16;
  const textColor = theme?.colors?.text || "#FFFFFF";
  const homeButtonTextColor = theme?.colors?.homeButtonText;
  const homeButtonBackground =
    theme?.colors?.homeButtonBackground;
  const homeButtonBorder =
    theme?.colors?.homeButtonBorder;

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
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: gridGap,
      columnGap: gridGap,
    },
    quickActionCard: {
      width: "47%",
      minHeight: cardHeight,
      backgroundColor: homeButtonBackground || (isLightBlue
        ? "#FFFFFF"
        : "rgba(255,255,255,0.3)"),
      borderWidth: 1,
      borderColor: homeButtonBorder || (isLightBlue
        ? "rgba(1,13,24,0.08)"
        : "rgba(255,255,255,0.2)"),
      padding: cardPadding,
      borderRadius: 20,
      justifyContent: "space-between",
    },
    quickActionCardFullWidth: {
      width: "100%",
    },
    quickActionIconWrapper: {
      position: "relative",
      alignSelf: "flex-start",
    },
    quickActionIcon: {
      width: iconSize,
      height: iconSize,
      resizeMode: "contain",
      tintColor: homeButtonTextColor || (isLightBlue ? textColor : "#fff"),
    },
    quickActionText: {
      color: homeButtonTextColor || (isLightBlue ? textColor : "#fff"),
      fontSize: textSize,
      lineHeight: compact ? textSize + 2 : 20,
      fontWeight: "600",
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
