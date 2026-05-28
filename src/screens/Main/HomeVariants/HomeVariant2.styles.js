import { StyleSheet } from "react-native";

export function createStyles({
  compact = false,
  veryCompact = false,
  hasSections = false,
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
    mainContentStacked: {
      flexGrow: 0,
    },
    mainContentEvenlySpaced: {
      flexGrow: 1,
    },
    mainContentGroup: {
      gap: sectionGap,
    },
    mainContentGroupStacked: {
      justifyContent: "flex-start",
    },
    mainContentGroupEvenlySpaced: {
      flex: 1,
      justifyContent: "space-between",
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
      backgroundColor: "rgba(255,255,255,0.3)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
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
      tintColor: "#fff",
    },
    quickActionText: {
      color: "#fff",
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
    timerContainer: {
      width: "100%",
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
    timerSecondsCompact: {
      opacity: 0.35,
    },
  });
}
