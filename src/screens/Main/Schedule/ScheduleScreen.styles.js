import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

export const ROW_HEIGHT = 64;
export const WEEK_HEADER_HEIGHT = 32;
export const DAY_HEADER_HEIGHT = 48;
export const HEADER_HEIGHT = WEEK_HEADER_HEIGHT + DAY_HEADER_HEIGHT;
export const SIDEBAR_WIDTH = 150;

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
    toolbar: {
      marginTop: 12,
    },
    segmented: {
      flexDirection: "row",
      alignSelf: "flex-start",
      gap: 8,
    },
    segment: {
      paddingHorizontal: 26,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: "rgba(5, 45, 80, 0.12)",
    },
    segmentActive: {
      backgroundColor: "#1877F2",
      borderColor: "#1877F2",
    },
    segmentText: {
      fontSize: 16,
      color: c.textPrimary,
    },
    segmentTextActive: {
      color: "#FFFFFF",
      fontFamily: "DMSans-SemiBold",
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    filterChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: c.inputSurface,
    },
    filterChipText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "500",
      fontFamily: "DMSans-Medium",
    },
    filterChipPlaceholder: {
      color: "rgba(5, 45, 80, 0.5)",
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
    emptyText: {
      color: c.textMuted,
      fontSize: 15,
      textAlign: "center",
    },
    headerRow: {
      flexDirection: "row",
      height: HEADER_HEIGHT,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F2F4",
    },
    corner: {
      width: SIDEBAR_WIDTH,
      height: HEADER_HEIGHT,
      justifyContent: "flex-end",
      paddingLeft: 12,
      paddingBottom: 8,
      borderRightWidth: 1,
      borderRightColor: "#F0F2F4",
    },
    cornerText: {
      color: c.textPrimary,
      fontSize: 13,
      fontFamily: "DMSans-SemiBold",
    },
    weekHeaderRow: {
      flexDirection: "row",
      height: WEEK_HEADER_HEIGHT,
      alignItems: "center",
    },
    weekHeaderCell: {
      justifyContent: "center",
      paddingLeft: 8,
    },
    weekHeaderText: {
      color: c.textPrimary,
      fontSize: 13,
      fontFamily: "DMSans-SemiBold",
    },
    dayHeaderRow: {
      flexDirection: "row",
      height: DAY_HEADER_HEIGHT,
      alignItems: "center",
    },
    dayHeaderCell: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    dayLabel: {
      color: c.textMuted,
      fontSize: 13,
      fontFamily: "DMSans-Medium",
    },
    dayTodayPill: {
      backgroundColor: "#1877F2",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    dayTodayLabel: {
      color: "#FFFFFF",
    },
    bodyRow: {
      flex: 1,
      flexDirection: "row",
    },
    sidebar: {
      width: SIDEBAR_WIDTH,
      borderRightWidth: 1,
      borderRightColor: "#F0F2F4",
    },
    sidebarCell: {
      height: ROW_HEIGHT,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    sidebarName: {
      color: c.textPrimary,
      fontSize: 14,
      fontFamily: "DMSans-SemiBold",
    },
    sidebarSubtitle: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 1,
    },
    timelineRow: {
      height: ROW_HEIGHT,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(5, 45, 80, 0.05)",
    },
    bar: {
      position: "absolute",
      top: 8,
      height: ROW_HEIGHT - 16,
      paddingHorizontal: 12,
      justifyContent: "center",
      overflow: "hidden",
    },
    barTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    barTitle: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: "DMSans-SemiBold",
    },
    barTitleMuted: {
      flex: 1,
      color: "#5B5333",
      fontSize: 13,
      fontFamily: "DMSans-SemiBold",
    },
    barOverdue: {
      borderWidth: 2,
      borderColor: "#FC1D2C",
    },
    barMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 3,
    },
    barMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      flexShrink: 1,
    },
    barMetaItemFixed: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    barMeta: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 11,
      flexShrink: 1,
    },
    gridLine: {
      position: "absolute",
      top: 0,
      width: 1,
      backgroundColor: "rgba(5, 45, 80, 0.05)",
    },
    todayLine: {
      position: "absolute",
      top: 0,
      width: 2,
      backgroundColor: "#1877F2",
    },
    zoomFloating: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 128,
      alignItems: "center",
    },
    zoomGroup: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E6E7EE",
      borderRadius: 16,
      padding: 4,
      gap: 4,
    },
    zoomButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    zoomValueBox: {
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(5, 45, 80, 0.1)",
      paddingHorizontal: 18,
      paddingVertical: 9,
    },
    zoomValueText: {
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: "DMSans-Medium",
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
    modalHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    clearText: {
      color: "#0091FF",
      fontSize: 15,
      fontFamily: "DMSans-Medium",
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: "rgba(5, 45, 80, 0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: "#0091FF",
      borderColor: "#0091FF",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 52,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(5, 45, 80, 0.06)",
    },
    optionName: {
      color: c.textPrimary,
      fontSize: 16,
    },
    rescheduleTaskName: {
      color: c.textMuted,
      fontSize: 14,
      marginBottom: 16,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(5, 45, 80, 0.06)",
    },
    dateRowLabel: {
      color: c.textPrimary,
      fontSize: 15,
    },
    dateRowValue: {
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: "DMSans-Medium",
    },
    dateRowValueActive: {
      color: "#1877F2",
    },
    pickerDone: {
      alignSelf: "flex-end",
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    pickerDoneText: {
      color: "#1877F2",
      fontSize: 15,
      fontFamily: "DMSans-Medium",
    },
    saveButton: {
      marginTop: 20,
      height: 56,
      borderRadius: 999,
      backgroundColor: "#1877F2",
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontFamily: "DMSans-SemiBold",
    },
  });
