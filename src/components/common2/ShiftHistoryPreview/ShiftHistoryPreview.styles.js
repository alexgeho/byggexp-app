import { StyleSheet } from "react-native";

export function createStyles(
  theme,
  colorMode = "dark",
) {
  const isLightMode =
    colorMode === "light";
  const primaryTextColor = isLightMode
    ? theme.colors.text
    : "#FFFFFF";
  const secondaryTextColor = isLightMode
    ? `${theme.colors.text}B3`
    : "rgba(255,255,255,0.72)";
  const cardBackgroundColor = isLightMode
    ? "#FFFFFF"
    : "rgba(255,255,255,0.3)";
  const cardBorderColor = isLightMode
    ? `${theme.colors.primary}33`
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
    },
    title: {
      color: primaryTextColor,
      fontSize: 17,
      fontFamily: theme.text.fontFamily.medium,
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    linkText: {
      color: primaryTextColor,
      fontSize: 15,
      opacity: 0.9,
      fontFamily: theme.text.fontFamily.medium,
    },
    linkIcon: {
      opacity: 0.9,
      marginTop: 1,
    },
    card: {
      height: 162,
      overflow: "hidden",
      backgroundColor: cardBackgroundColor,
      borderWidth: 1,
      borderColor: cardBorderColor,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 16,
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
    list: {
      gap: 14,
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
      fontSize: 13,
      fontFamily: theme.text.fontFamily.regular,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    projectText: {
      flex: 1,
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
      fontFamily: theme.text.fontFamily.medium,
      textAlign: "right",
    },
    timeText: {
      color: primaryTextColor,
      opacity: 0.7,
      fontSize: 14,
      fontFamily: theme.text.fontFamily.regular,
      textAlign: "right",
    },
  });
}
