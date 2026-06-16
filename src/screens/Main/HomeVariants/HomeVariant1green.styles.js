import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      paddingTop: 32,
      justifyContent: "space-between",
      backgroundColor: theme.colors.background,
    },
    selectProjectContainer: {
      paddingTop: 46,
      paddingHorizontal: 46,
      
    },
    contentScrollView: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: "space-evenly",
      paddingHorizontal: 20,
      paddingBottom: 150,
      zIndex: 1000,
      position: "relative",
      gap: 10,
    },
    sectionsContainer: {
      gap: 16,
      marginTop: 8,
    },
    projectSelector: {
      backgroundColor: theme.colors.selectorBackground,
      borderColor: theme.colors.selectorBorder,
    },
    projectSelectorText: {
      color: theme.colors.selectorText || theme.colors.text,
    },
    projectSelectorIcon: {
      tintColor: theme.colors.selectorArrow,
    },
  });
}
