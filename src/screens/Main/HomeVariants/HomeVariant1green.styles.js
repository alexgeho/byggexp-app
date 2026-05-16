import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      paddingTop: 32,
      justifyContent: "space-between",
    },
    selectProjectContainer: {
      paddingTop: 46,
      paddingHorizontal: 46,
      
    },
    contentContainer: {
      flex: 1,
      justifyContent: "space-evenly",
      paddingHorizontal: 20,
      zIndex: 1000,
      position: "relative",
      gap: 10,
      marginBottom: 140,
    },
  });
}
