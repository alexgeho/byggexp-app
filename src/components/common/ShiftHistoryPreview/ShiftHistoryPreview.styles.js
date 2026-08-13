import { StyleSheet } from "react-native";

export function createStyles(theme, colorMode = "dark") {
  const isLightMode = colorMode === "light";
  // Only the pure black theme wants a solid dark card; other coloured themes
  // (blue/green/orange/…) keep the translucent frosted card over their gradient.
  const isBlack = Boolean(theme.colors.cardGlow);
  const themedTextColor = theme.colors.homeButtonText;
  const primaryTextColor = isLightMode
    ? theme.colors.text
    : themedTextColor || "#FFFFFF";
  const headerTextColor = isLightMode ? theme.colors.text : "#FFFFFF";
  const secondaryTextColor = isLightMode
    ? `${theme.colors.text}B3`
    : themedTextColor || "rgba(255,255,255,0.72)";
  const cardBackgroundColor = isLightMode
    ? "#FFFFFF"
    : isBlack
      ? "#232323"
      : "rgba(255,255,255,0.3)";
  const cardBorderColor = isLightMode
    ? `${theme.colors.primary}33`
    : isBlack
      ? "transparent"
      : "rgba(255,255,255,0.2)";
  const dividerColor = isLightMode
    ? `${theme.colors.primary}1F`
    : "rgba(255,255,255,0.14)";

  return StyleSheet.create({
    section: {
      gap: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      paddingRight: 4,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    title: {
      color: headerTextColor,
      fontSize: 17,
      fontFamily: theme.text.fontFamily.medium,
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    linkText: {
      color: headerTextColor,
      fontSize: 17,
      fontFamily: theme.text.fontFamily.medium,
    },
    linkIcon: {
      opacity: 0.72,
      marginTop: 1,
    },
    closeButton: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 4,
    },
    card: {
      height: 162,
      overflow: "hidden",
      backgroundColor: cardBackgroundColor,
      borderWidth: 1,
      borderColor: cardBorderColor,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    loadingState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
    },
    emptyText: {
      color: secondaryTextColor,
      fontSize: 14,
      fontFamily: theme.text.fontFamily.regular,
    },
    scrollArea: {
      flex: 1,
    },
    list: {
      gap: 14,
      paddingRight: 4,
    },
    item: {
      gap: 8,
    },
    itemDivider: {
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: dividerColor,
    },
    dateText: {
      color: primaryTextColor,
      opacity: 0.5,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    summaryLeftColumn: {
      flex: 1,
    },
    projectText: {
      color: primaryTextColor,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
    },
    summaryRightColumn: {
      marginLeft: "auto",
      alignItems: "flex-end",
      gap: 4,
      flexShrink: 0,
      minWidth: 84,
    },
    durationText: {
      color: primaryTextColor,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.semiBold,
      textAlign: "right",
    },
    timeText: {
      color: primaryTextColor,
      opacity: 0.5,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
      textAlign: "right",
    },
    photosRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
    },
    photoSquare: {
      width: 38,
      height: 38,
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isLightMode
        ? `${theme.colors.primary}26`
        : "rgba(255,255,255,0.28)",
    },
    photoImage: {
      width: "100%",
      height: "100%",
    },
    addSquare: {
      width: 38,
      height: 38,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: isLightMode
        ? `${theme.colors.primary}66`
        : "rgba(255,255,255,0.5)",
      backgroundColor: isLightMode
        ? `${theme.colors.primary}0D`
        : "rgba(255,255,255,0.08)",
      alignItems: "center",
      justifyContent: "center",
    },
    hoursInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: isLightMode
        ? `${theme.colors.primary}08`
        : "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: isLightMode
        ? `${theme.colors.primary}26`
        : "rgba(255,255,255,0.18)",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      minWidth: 64,
      justifyContent: "center",
    },
    hoursInput: {
      color: primaryTextColor,
      fontSize: 20,
      fontFamily: theme.text.fontFamily.semiBold,
      textAlign: "center",
      padding: 0,
      minWidth: 22,
    },
    hoursSuffix: {
      color: secondaryTextColor,
      fontSize: 14,
      fontFamily: theme.text.fontFamily.medium,
    },
  });
}
