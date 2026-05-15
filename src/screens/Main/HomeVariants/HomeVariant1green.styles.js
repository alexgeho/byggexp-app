import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      overflow: "hidden",
      paddingTop: 32,
      justifyContent: "space-between",
    },
    selectProjectContainer: {
      paddingTop: 46,
      paddingHorizontal: 46,
      zIndex: 1000,
      position: "relative",
      
    },
    contentContainer: {
      flex: 1,
      justifyContent: "space-evenly",
      paddingHorizontal: 20,
      marginBottom: 20,
      zIndex: 1000,
      position: "relative",
      gap: 10,
   
    },
    timerRow: {
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    timerNumber: {
      fontSize: 48,
    },
    timerSubNumber: {
      fontSize: 48,
    },
    dotsRow: {
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: 15,
      elevation: 3,
    },
    dot: {
      width: "6%",
      height: 42,
      borderWidth: 1,
      borderRadius: 50,
    },
    playButtonContainer: {
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    playButton: {
      width: 150,
      height: 150,
      borderRadius: 100,
      borderWidth: 1,

      shadowOffset: {
        width: 0,
        height: 0,
      },
      alignItems: "center",
      justifyContent: "center",
    },
    playButtonPaused: {
      opacity: 0.7,
    },
    playIcon: {
      width: 52,
      height: 52,
    },
    navButtonContainer: {
      flexWrap: "wrap",
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      
    },
    bottomNavContainer: {
      flexDirection: "row",
      gap: 72,
      justifyContent: "center",
      paddingBottom: 32,
    },
    bottomNavItem: {
      flexDirection: "column",
      gap: 8,
      alignItems: "center",
    },
    bottomIcon: {
      width: 28,
      height: 28,
    },
    bottomText: {
      fontSize: 12,
    },
  });
}
