import { StyleSheet } from "react-native";

export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    trigger: {
      width: "100%",
      height: 48,
      backgroundColor: c.inputSurface,
      borderRadius: 20,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    triggerText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "500",
    },
    triggerPlaceholder: {
      color: c.textMuted,
    },
  });
