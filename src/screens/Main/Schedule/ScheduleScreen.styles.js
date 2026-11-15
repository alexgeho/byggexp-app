import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { onDark } from "../../../theme/colorUtils";

export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    monthSelector: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    monthLabel: {
      color: c.textPrimary,
      fontSize: 19,
      fontFamily: "DMSans-SemiBold",
    },
    todayButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: "#FFFFFF50",
      alignItems: "center",
      justifyContent: "center",
    },
    stepGroup: {
      flexDirection: "row",
      gap: 4,
    },
    stepButton: {
      width: 36,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    viewRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 12,
    },
    viewSegment: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: onDark(c, c.divider, "rgba(5, 45, 80, 0.12)"),
    },
    viewSegmentText: {
      fontSize: 14,
      color: c.textPrimary,
    },
    peopleRow: {
      marginTop: 12,
    },
    peopleContent: {
      gap: 8,
    },
    personChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 40,
      maxWidth: 180,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: c.surface,
    },
    personChipOff: {
      opacity: 0.55,
    },
    personDot: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    personName: {
      flexShrink: 1,
      color: c.textPrimary,
      fontSize: 14,
    },
    segmentActive: {
      backgroundColor: "#1877F2",
      borderColor: "#1877F2",
    },
    segmentTextActive: {
      color: "#FFFFFF",
      fontFamily: "DMSans-SemiBold",
    },
    timelineCard: {
      flex: 1,
      marginTop: 12,
      backgroundColor: c.surface,
      borderRadius: 16,
      overflow: "hidden",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      maxHeight: "70%",
    },
    modalTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontFamily: "DMSans-SemiBold",
      marginBottom: 12,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 52,
      borderBottomWidth: 1,
      borderBottomColor: onDark(c, c.divider, "rgba(5, 45, 80, 0.06)"),
    },
    optionName: {
      color: c.textPrimary,
      fontSize: 16,
    },
  });
