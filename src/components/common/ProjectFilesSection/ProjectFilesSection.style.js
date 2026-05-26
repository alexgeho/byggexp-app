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
      color: primaryTextColor,
      fontSize: 15,
      opacity: 0.72,
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
      opacity: 0.72,
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

    carouselViewport: {
      height: 130,
      width: "100%",
      position: "relative",
      justifyContent: "center",
      borderWidth: isLightMode ? 1 : 0,
      borderColor: isLightMode
        ? `${theme.colors.primary}33`
        : "transparent",
      backgroundColor: isLightMode
        ? `${theme.colors.primary}18`
        : "transparent",
      borderRadius: 20,
      overflow: "hidden",
    },

    carouselRow: {
      flexDirection: "row",
      height: 130,
      alignSelf: "center",
      alignItems: "stretch",
    },

    carouselRowRegular: {
      gap: 4,
    },

    peekTrack: {
      width: "100%",
      height: 130,
      position: "relative",
    },

    carouselSlot: {
      width: 148,
      height: 130,
      overflow: "hidden",
      flexShrink: 0,
    },

    carouselSlotPeek: {
      width: 148,
      position: "absolute",
      top: 0,
    },

    carouselSlotRegular: {
      width: 148,
    },

    peekLeftSlot: {
      left: "50%",
      marginLeft: -226,
    },

    peekCenterSlot: {
      left: "50%",
      marginLeft: -74,
    },

    peekRightSlot: {
      left: "50%",
      marginLeft: 78,
    },

    fileTouchable: {
      flex: 1,
    },

    imageFrame: {
      width: "100%",
      height: "100%",
      overflow: "hidden",
      backgroundColor: isLightMode
        ? "rgba(255,255,255,0.85)"
        : "rgba(255,255,255,0.12)",
    },

    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },

    imageFirst: {
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
    },

    imageLast: {
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
    },

    fileFallback: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.75)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      gap: 8,
    },

    fileFallbackText: {
      color: "#052D50",
      fontSize: 12,
      textAlign: "center",
      fontFamily: theme.text.fontFamily.medium,
    },

    navButton: {
      position: "absolute",
      top: "50%",
      marginTop: -16.5,
      width: 33,
      height: 33,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(5, 45, 80, 0.5)",
      backgroundColor: "rgba(255,255,255,0.6)",
      zIndex: 2,
    },

    navButtonLeft: {
      left: 15,
    },

    navButtonRight: {
      right: 15,
    },

    navButtonDisabled: {
      opacity: 0.45,
    },
  });
}