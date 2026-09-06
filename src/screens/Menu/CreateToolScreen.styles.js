import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

// Extracted from CreateToolScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
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
    contentScroll: {
      flex: 1,
      width: "100%",
    },
    contentScrollContent: {
      paddingBottom: 140,
      gap: 20,
    },
    groupCard: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: 0,
    },
    groupedField: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    groupRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    groupRowLast: {
      borderBottomWidth: 0,
    },
    rowSep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 16,
    },
    rowSepIcon: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 58,
    },
    fieldRowContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    fieldIconBadge: {
      width: 30,
      height: 30,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    fieldInputWrap: {
      flex: 1,
      gap: 2,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: "#6C6C70",
    },
    fieldInput: {
      fontSize: 16,
      color: c.textPrimary,
      paddingVertical: 0,
    },
    fieldInputMultiline: {
      minHeight: 96,
      paddingTop: 4,
    },
    selectRow: {
      minHeight: 56,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectValue: {
      fontSize: 16,
      color: c.textPrimary,
    },
    selectPlaceholder: {
      color: "rgba(5, 45, 80, 0.35)",
    },
    photoPreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    formError: {
      color: "#c62828",
      fontSize: 14,
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    accessDeniedContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    accessDeniedText: {
      fontSize: 18,
      fontWeight: "600",
      color: "#151515",
    },
    pickerModalContainer: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 12,
      paddingTop: 12,
    },
    pickerModalHeader: {
      ...standardScreenHeader,
      marginBottom: 12,
    },
    pickerModalTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 17,
      color: c.textPrimary,
    },
    pickerListContent: {
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 0,
      overflow: "hidden",
    },
    pickerOptionRow: {
      minHeight: 56,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pickerOptionLabel: {
      fontSize: 16,
      color: c.textPrimary,
      flex: 1,
      paddingRight: 12,
    },
    pickerEmptyState: {
      minHeight: 56,
      paddingHorizontal: 16,
      justifyContent: "center",
    },
    pickerEmptyStateText: {
      fontSize: 16,
      color: "rgba(5, 45, 80, 0.55)",
    },
  });
