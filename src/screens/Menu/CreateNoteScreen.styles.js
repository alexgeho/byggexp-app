import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

export const createStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
      flex: 1,
    },
    saveButton: {
      height: 44,
      minWidth: 72,
      paddingHorizontal: 14,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0785F4",
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    body: {
      flex: 1,
      width: "100%",
      gap: 14,
      paddingTop: 8,
    },
    titleInput: {
      fontSize: 22,
      fontWeight: "700",
      color: c.textPrimary,
      paddingVertical: 4,
    },
    bodyInput: {
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
      color: c.textPrimary,
      textAlignVertical: "top",
      paddingBottom: 24,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      marginBottom: 24,
    },
    deleteText: {
      color: "#FF3B30",
      fontSize: 15,
      fontWeight: "600",
    },
    errorText: {
      color: "#FF3B30",
      fontSize: 13,
    },
  });
