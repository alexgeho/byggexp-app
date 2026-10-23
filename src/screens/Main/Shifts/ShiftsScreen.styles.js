import { Platform, StyleSheet } from "react-native";
import { radius, size } from "../../../theme/tokens";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
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
    placeholder: {
      ...standardScreenHeaderPlaceholder,
    },
    backButton: {
      padding: 16,
      backgroundColor: c.surfaceMuted,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
    },
    backIcon: {
      width: 20,
      height: 20,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "600",
      textAlign: "center",
    },
    contentScroll: {
      flex: 1,
      width: "100%",
    },
    contentScrollContent: {
      paddingBottom: 140,
    },

    /* Summary-first hero card (light, compact) */
    hero: {
      backgroundColor: c.surface,
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: onDark(c, c.border, "#EAEDF1"),
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    heroMain: { flex: 1 },
    heroSide: { alignItems: "flex-end", paddingLeft: 12, paddingBottom: 3 },
    heroLabel: {
      color: c.textMuted,
      fontSize: 12.5,
      fontFamily: "DMSans-Medium",
    },
    heroValue: {
      color: c.textPrimary,
      fontSize: 30,
      letterSpacing: -0.5,
      marginTop: 2,
    },
    heroSub: {
      color: c.textMuted,
      fontSize: 12.5,
      fontFamily: "DMSans-Medium",
      marginTop: 1,
    },
    heroStatsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      gap: 16,
    },
    heroStat: { flexDirection: "column" },
    heroStatValue: {
      color: c.textPrimary,
      fontSize: 14,
      fontFamily: "DMSans-SemiBold",
    },
    heroStatLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontFamily: "DMSans-Medium",
      marginTop: 1,
    },
    heroStatDivider: {
      width: 1,
      height: 24,
      backgroundColor: onDark(c, c.border, "#EAEDF1"),
    },

    /* Hours-by source toggle (Planned / GPS / Manual) */
    hoursByLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 2,
    },
    /* Attention, top to bottom of importance (docs/DESIGN-SYSTEM.md §6):
       1 the chosen day's hours and its one blue button, 2 the week strip,
       3 month / week / totals, 4 settings — source toggle, period, filters,
       Summera. Level 4 is small, grey and see-through so it never pulls the
       eye away from the day. */
    sourceToggle: {
      flexDirection: "row",
      backgroundColor: onDark(c, c.surfaceMuted, "rgba(118, 118, 128, 0.08)"),
      borderRadius: 10,
      padding: 3,
      marginBottom: 8,
      gap: 3,
    },
    sourceBtn: {
      flex: 1,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      // Room either side, so a label that shrinks to fit never touches the
      // edge of its segment.
      paddingHorizontal: 6,
    },
    sourceBtnOn: {
      backgroundColor: onDark(c, c.surface, "rgba(255, 255, 255, 0.9)"),
    },
    sourceBtnText: { fontSize: 13, fontWeight: "500", color: c.textSecondary },

    exportSelector: {
      width: "100%",
      marginBottom: 8,
    },
    /* "Summera" in the header — a level-4 setting: outlined, not filled, so
       the day's blue button stays the only solid blue on the screen. */
    headerSelectButton: {
      height: 44,
      minWidth: 72,
      paddingHorizontal: 16,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: size.border,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    headerSelectButtonActive: {
      borderColor: "#0785F4",
      backgroundColor: onDark(c, c.accentSoft, "#E8F1FB"),
    },
    headerSelectText: {
      fontSize: 15,
      fontWeight: "600",
      color: onDark(c, c.textPrimary, "#0785F4"),
    },
    headerSelectTextActive: {
      color: "#0785F4",
    },
    /* Hint shown above the calendar while in select mode */
    selectModeHint: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: 8,
    },
    /* Project + Employee side by side to use the horizontal space */
    filtersRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    filterHalf: { flex: 1 },
    /* Period and people filters: level 4 — outline only, grey text. */
    dropdownButton: {
      width: "100%",
      height: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 14,
      backgroundColor: "transparent",
      borderWidth: size.border,
      borderColor: c.border,
      borderRadius: radius.control,
    },
    dropdownText: {
      flex: 1,
      color: c.textSecondary,
      fontSize: 15,
      fontWeight: "400",
    },
    dropdownPlaceholderText: {
      color: c.textMuted,
      fontWeight: "400",
    },
    dropdownIcon: {
      width: 14,
      height: 14,
      tintColor: c.textMuted,
    },
    /* Week view: every control in one card — month, week, days, day */
    weekCard: {
      backgroundColor: c.surface,
      borderRadius: radius.card,
      padding: 12,
      gap: 12,
      marginBottom: 12,
    },
    weekMonthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    weekMonthButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 28,
      paddingHorizontal: 4,
    },
    // The month anchors the screen: darkest and heaviest of the navigation.
    weekMonthText: {
      color: c.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },
    todayChip: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: radius.control,
      backgroundColor: onDark(c, c.surfaceMuted, "rgba(7, 133, 244, 0.12)"),
      alignItems: "center",
      justifyContent: "center",
    },
    todayChipText: {
      color: onDark(c, c.textPrimary, "#0785F4"),
      fontSize: 15,
      fontWeight: "600",
    },
    monthGrid: {
      gap: 8,
    },
    monthGridYearRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    monthGridYearButton: {
      width: size.headerButton,
      height: size.headerButton,
      alignItems: "center",
      justifyContent: "center",
    },
    monthGridYear: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "600",
    },
    monthGridCells: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 8,
    },
    monthGridCell: {
      width: "23.5%",
      height: size.headerButton,
      borderRadius: 12,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
    },
    monthGridCellOn: {
      backgroundColor: "#0785F4",
    },
    monthGridCellText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    monthGridCellTextOn: {
      color: "#FFFFFF",
    },
    weekNavRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    // Week / day arrows are navigation (level 3): no box of their own, just a
    // grey chevron with a thumb-sized target.
    weekNavButton: {
      width: size.headerButton,
      height: size.headerButton,
      borderRadius: 12,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    navChevron: {
      color: c.textSecondary,
    },
    weekNavButtonDisabled: {
      opacity: 0.35,
    },
    weekNavIcon: {
      color: onDark(c, c.textPrimary, "#0177DE"),
    },
    weekNavTitleBox: {
      flex: 1,
      alignItems: "center",
    },
    weekNavTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    weekNavSub: {
      color: c.textSecondary,
      fontSize: 13,
    },
    weekStrip: {
      flexDirection: "row",
      gap: 4,
    },
    weekDay: {
      flex: 1,
      minHeight: 72,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: "transparent",
      backgroundColor: c.background,
    },
    weekDayCompact: {
      minHeight: 52,
      paddingVertical: 4,
      gap: 0,
    },
    weekDayNumberCompact: {
      fontSize: 17,
    },
    monthWeekdayHeader: {
      flex: 1,
      textAlign: "center",
      color: c.textSecondary,
      fontSize: 12,
    },
    monthStrip: {
      marginTop: -6,
    },
    /* Vecka | Månad | Period — what span the card shows */
    viewModeToggle: {
      flexDirection: "row",
      alignSelf: "center",
      backgroundColor: c.background,
      borderRadius: radius.control,
      padding: 3,
      gap: 3,
    },
    viewModeBtn: {
      height: 34,
      paddingHorizontal: 18,
      borderRadius: radius.control,
      alignItems: "center",
      justifyContent: "center",
    },
    viewModeBtnOn: {
      backgroundColor: onDark(c, c.surfaceMuted, "#FFFFFF"),
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    viewModeText: {
      color: c.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    viewModeTextOn: {
      color: c.textPrimary,
      fontWeight: "600",
    },
    periodPickButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 44,
    },
    periodTotalValue: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: "700",
    },
    monthTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    weekDayToday: {
      borderColor: "#0785F4",
    },
    weekDayOn: {
      backgroundColor: "#0785F4",
      borderColor: "#0785F4",
    },
    weekDayOut: {
      opacity: 0.4,
    },
    weekDayName: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: "500",
    },
    weekDayNumber: {
      color: c.textPrimary,
      fontSize: 21,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    weekDayHours: {
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 16,
    },
    weekDayHoursEmpty: {
      color: c.textMuted,
      fontWeight: "400",
    },
    weekDayTextOn: {
      color: "#FFFFFF",
    },
    dayBar: {
      borderTopWidth: size.border,
      borderTopColor: c.border,
      paddingTop: 12,
    },
    dayBarTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "600",
    },

    /* Normal (blue) + övertid (orange, paler while it waits) as one bar */
    hoursBar: {
      flexDirection: "row",
      width: 28,
      height: 4,
      marginTop: 2,
      gap: 1,
      borderRadius: 2,
      overflow: "hidden",
      backgroundColor: c.border,
    },
    hoursBarWide: {
      width: "100%",
      height: 10,
      marginTop: 0,
      gap: 2,
      borderRadius: 5,
    },
    hoursBarOnAccent: {
      backgroundColor: "rgba(255, 255, 255, 0.35)",
    },
    hoursBarNormal: {
      backgroundColor: "#0785F4",
    },
    hoursBarNormalOnAccent: {
      backgroundColor: "#FFFFFF",
    },
    hoursBarOvertime: {
      backgroundColor: "#F59E0B",
    },
    hoursBarPending: {
      backgroundColor: "rgba(245, 158, 11, 0.45)",
    },

    /* Övertid inside a shift card */
    overtimeBox: {
      gap: 4,
      marginTop: 10,
    },
    overtimeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      minHeight: 32,
    },
    overtimeLabel: {
      color: c.textPrimary,
      fontSize: 15,
    },
    overtimeValueGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    overtimeValue: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    overtimeValueOrange: {
      color: onDark(c, c.warning, "#B8760A"),
    },
    overtimeChip: {
      fontSize: 12,
      fontWeight: "700",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.control,
      overflow: "hidden",
    },
    overtimeChipPending: {
      color: onDark(c, c.warning, "#9A6216"),
      backgroundColor: onDark(c, c.warningSoft, "#FCEFD9"),
    },
    overtimeChipOk: {
      color: onDark(c, c.success, "#1E8A55"),
      backgroundColor: onDark(c, c.successSoft, "#E3F6EC"),
    },
    overtimeActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
    },
    overtimeDeny: {
      flex: 1,
      height: size.control,
      borderRadius: radius.control,
      borderWidth: size.border,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    overtimeDenyText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    overtimeApprove: {
      flex: 1,
      height: size.control,
      borderRadius: radius.control,
      backgroundColor: onDark(c, c.success, "#1E8A55"),
      alignItems: "center",
      justifyContent: "center",
    },
    overtimeApproveText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
    selectionSummaryOvertime: {
      color: onDark(c, c.warning, "#B8760A"),
      fontSize: 13,
      fontWeight: "600",
    },

    /* The chosen day's manual hours, under the week card */
    dayEntryCard: {
      backgroundColor: c.surface,
      borderRadius: radius.card,
      padding: 16,
      gap: 12,
    },
    dayEntryLabel: {
      color: c.textSecondary,
      fontSize: 15,
    },
    dayEntryInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 56,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.background,
    },
    dayEntryInput: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 28,
      fontWeight: "600",
      paddingVertical: 0,
      includeFontPadding: false,
    },
    dayEntryUnit: {
      color: c.textSecondary,
      fontSize: 20,
    },
    dayEntryOvertimeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 48,
    },
    dayEntryStepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dayEntryStep: {
      width: size.headerButton,
      height: size.headerButton,
      borderRadius: radius.control,
      borderWidth: size.border,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    dayEntryStepValue: {
      minWidth: 44,
      textAlign: "center",
      color: onDark(c, c.warning, "#B8760A"),
      fontSize: 20,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    dayEntryHint: {
      color: c.textSecondary,
      fontSize: 13,
    },
    /* Arbetstimmar: the same row as Övertid / OB, a small cell instead of − / + */
    dayEntryHoursCell: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      width: 148,
      height: size.headerButton,
      paddingHorizontal: 14,
      borderRadius: radius.control,
      borderWidth: size.border,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    dayEntryHoursInput: {
      flex: 1,
      textAlign: "right",
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: "600",
      paddingVertical: 0,
      includeFontPadding: false,
      fontVariant: ["tabular-nums"],
    },
    dayEntryStepValueOb: {
      color: onDark(c, "#A78BFA", "#7C5CD6"),
    },
    dayEntryStepValuePlain: {
      color: c.textPrimary,
    },
    dayEntrySection: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 4,
    },
    dayEntryChoice: {
      gap: 8,
    },
    dayEntryChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    dayEntryChip: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: radius.control,
      borderWidth: size.border,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    dayEntryChipActive: {
      backgroundColor: "#0785F4",
      borderColor: "#0785F4",
    },
    dayEntryChipText: {
      color: c.textPrimary,
      fontSize: 14,
    },
    dayEntryChipTextActive: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    dayEntryLink: {
      color: onDark(c, c.textPrimary, "#0177DE"),
      fontSize: 15,
      fontWeight: "500",
    },
    dayEntryAbsenceValue: {
      color: onDark(c, "#A78BFA", "#7C5CD6"),
      fontSize: 15,
      fontWeight: "600",
    },
    dayEntryValueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dayEntryValue: {
      color: onDark(c, c.warning, "#B8760A"),
      fontSize: 20,
      fontWeight: "600",
    },
    dayEntryEmpty: {
      color: c.textSecondary,
      fontSize: 15,
      textAlign: "center",
    },
    dayEntryPrimary: {
      height: size.control,
      borderRadius: radius.control,
      backgroundColor: "#0785F4",
      alignItems: "center",
      justifyContent: "center",
    },
    dayEntryPrimaryText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
    dayEntrySecondary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: size.control,
      borderRadius: radius.control,
      borderWidth: size.border,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    dayEntrySecondaryText: {
      color: onDark(c, c.textPrimary, "#0177DE"),
      fontSize: 15,
      fontWeight: "600",
    },
    headerSaveButton: {
      width: 48,
      height: 48,
      borderRadius: 9999,
      backgroundColor: "#0785F4",
      alignItems: "center",
      justifyContent: "center",
    },
    manualHint: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
      marginBottom: 2,
    },
    manualHintIcon: {
      marginTop: 1,
    },
    manualHintText: {
      fontFamily: "DMSans-Medium",
      color: onDark(c, c.warning, "#B8760A"),
      fontSize: 13,
    },
    pendingDot: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#F59E0B",
    },
    /* Checkbox pinned to the top-right corner of each day while in select mode */
    calendarCheck: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: "#C3CCD6",
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    calendarCheckOn: {
      borderColor: "#0785F4",
      backgroundColor: "#0785F4",
    },
    shiftDetailsContainer: {
      width: "100%",
      marginBottom: 12,
    },
    shiftDetailsContent: {
      gap: 12,
    },
    selectionSummaryCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingVertical: 16,
      marginBottom: 12,
    },
    selectionSummaryStat: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    selectionSummaryValue: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    selectionSummaryLabel: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: "400",
    },
    selectionSummaryDivider: {
      width: 1,
      height: 32,
      backgroundColor: c.inputSurface,
    },
    clearSelectionButton: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    shiftCard: {
      backgroundColor: c.surfaceMuted,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    shiftTimeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    shiftTimeText: {
      color: c.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "400",
      flex: 1,
    },
    // The day's hours are level 1 — the number the screen is about, so the
    // largest and darkest text on it.
    shiftDurationText: {
      color: c.textPrimary,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "700",
      textAlign: "right",
      fontVariant: ["tabular-nums"],
    },
    shiftProjectName: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400",
      marginTop: 4,
    },
    shiftExpandedContent: {
      marginTop: 8,
      gap: 8,
    },
    shiftDetailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    shiftDetailLabel: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "400",
    },
    shiftDetailValue: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 13,
      lineHeight: 22,
      fontWeight: "400",
      textAlign: "right",
      flex: 1,
    },
    shiftPhotosValue: {
      flex: 1,
      alignItems: "flex-end",
    },
    shiftPhotosScroll: {
      maxWidth: "100%",
    },
    shiftPhotosScrollContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    shiftImage: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginLeft: 8,
    },
    statsContainer: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 24,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statLabel: {
      color: c.textMuted,
      fontSize: 14,
    },
    statValue: {
      color: c.textMuted,
      fontSize: 16,
      fontWeight: "500",
    },
    exportFabButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    exportFabText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyMonthText: {
      color: c.textMuted,
      textAlign: "center",
      marginTop: 12,
    },
    emptyDetailsText: {
      color: c.textMuted,
      fontSize: 14,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "#00000040",
      justifyContent: "center",
      padding: 24,
    },
    modalContent: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    bottomSheetBackground: {
      backgroundColor: c.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    handleIndicator: {
      alignSelf: "center",
      backgroundColor: onDark(c, c.divider, "#CCCCCC"),
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    bottomSheetContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
    },
    exportSheetBody: {
      gap: 12,
      marginBottom: 12,
    },
    exportSheetTitle: {
      color: c.textPrimary,
      fontSize: 22,
      textAlign: "center",
    },
    exportPeriodLabel: {
      color: c.textPrimary,
      fontSize: 16,
    },
    periodTabs: {
      flexDirection: "row",
      gap: 8,
      alignSelf: "center",
    },
    periodTab: {
      height: 44,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },
    periodTabActive: {
      backgroundColor: "#0785F4",
      borderColor: "#0785F4",
    },
    periodTabText: {
      fontSize: 15,
      color: c.textPrimary,
    },
    periodTabTextActive: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    periodCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    dateContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    // Month + year wheels, From above To, each pair across the full width so
    // a month name never gets cut off.
    monthRangeStack: {
      gap: 8,
    },
    monthYearRow: {
      flexDirection: "row",
      gap: 8,
    },
    monthYearMonth: {
      flex: 2,
      width: undefined,
    },
    monthYearYear: {
      flex: 1,
      width: undefined,
    },
    monthDateField: {
      flex: 1,
      alignItems: "center",
    },
    monthDateLabel: {
      fontSize: 14,
      color: c.textPrimary,
      marginBottom: 4,
      textAlign: "center",
      width: "100%",
    },
    monthWheelContainer: {
      width: "100%",
      backgroundColor: "transparent",
      overflow: "hidden",
    },
    monthWheel: {
      height: Platform.OS === "ios" ? 120 : 48,
      width: "100%",
      backgroundColor: "transparent",
    },
    monthWheelItem: {
      color: c.textPrimary,
      fontSize: 16,
    },
    dateValueCard: {
      width: "100%",
      backgroundColor: onDark(c, c.inputSurface, "rgba(245, 245, 245, 1)"),
      borderRadius: 20,
      paddingHorizontal: 12,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    // The From/To field the inline wheel is currently editing.
    dateValueCardActive: {
      borderColor: "#0091FF",
    },
    dateValueText: {
      fontSize: 15,
      color: c.textPrimary,
      textAlign: "center",
    },
    dateValuePlaceholder: {
      color: c.textMuted,
    },
    exportSheetCard: {
      backgroundColor: c.surfaceMuted,
      borderRadius: 20,
      padding: 0,
      borderWidth: 1,
      borderColor: c.border,
    },
    exportButtonsContainer: {
      flexDirection: "row",
      backgroundColor: c.surfaceMuted,
      borderRadius: 20,
      padding: 0,
      borderWidth: 1,
      borderColor: c.border,
    },
    exportButton: {
      flex: 1,
      backgroundColor: c.surfaceMuted,
      borderRadius: 20,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    exportButtonActive: {
      borderWidth: 2,
      borderColor: "rgba(7, 133, 244, 1)",
    },
    exportButtonText: {
      fontSize: 16,
      color: c.textPrimary,
    },
    exportButtonTextActive: {
      fontWeight: "600",
    },
    exportMainButton: {
      width: "100%",
      height: size.control,
      backgroundColor: "#0091FF",
      borderRadius: radius.control,
      alignItems: "center",
      justifyContent: "center",
    },
    datePickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      padding: 24,
    },
    datePickerCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    employeePickerCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      width: "100%",
      maxHeight: "70%",
    },
    employeeList: {
      marginTop: 4,
    },
    employeeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    employeeName: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 16,
    },
    employeeCheck: {
      color: "#0089f6",
      fontSize: 18,
      fontWeight: "700",
      marginLeft: 12,
    },
    shiftWorkerName: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 6,
    },
    datePickerTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
    },
    // Inline (non-modal) date picker shown inside the Period sheet on the
    // Custom tab, so its wheel gets touches (a stacked Modal would not).
    inlineDatePicker: {
      alignItems: "center",
      marginTop: 8,
    },
    datePickerButton: {
      alignSelf: "flex-end",
      marginTop: 12,
      backgroundColor: "#0091FF",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    datePickerButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    // A value is a value: ink, like every other number on the card. Colour on
    // this screen says what you can DO (blue) or what is WRONG (red), never
    // where a number came from — the label already says that.
    manualHoursValue: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 13,
      lineHeight: 22,
      textAlign: "right",
      flex: 1,
    },
    // The one accent: a row you can act on.
    rowActionValue: {
      color: "#0785F4",
      fontSize: 13,
      lineHeight: 22,
      textAlign: "right",
      flex: 1,
      fontWeight: "600",
    },
    // Where the headline number came from, said quietly beside it.
    durationSource: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 12,
      fontWeight: "400",
    },
    approvedValue: {
      color: "#2FA84F",
      fontSize: 13,
      lineHeight: 22,
      textAlign: "right",
      flex: 1,
      fontWeight: "600",
    },
    manualHoursHint: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 14,
    },
    manualHoursInputs: {
      flexDirection: "row",
      gap: 12,
    },
    manualHoursField: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    manualHoursInput: {
      flex: 1,
      height: 52,
      backgroundColor: c.inputSurface,
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 20,
      fontWeight: "700",
      color: c.textPrimary,
      textAlign: "center",
    },
    manualHoursUnit: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 15,
      fontWeight: "600",
    },
    manualHoursClearButton: {
      alignSelf: "center",
      marginTop: 14,
      paddingVertical: 6,
    },
    // Manual-hours sheet: slides up from the bottom and lifts with the number
    // pad, so nothing it owns ends up underneath the keyboard.
    manualSheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    manualSheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: onDark(c, c.divider, "rgba(5, 45, 80, 0.28)"),
    },
    manualSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 28,
    },
    manualSheetGrab: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.divider,
      marginBottom: 14,
    },
    manualSheetTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    manualSheetHint: {
      color: c.textMuted,
      fontSize: 15,
      marginTop: 4,
      marginBottom: 16,
    },
    manualHoursRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    manualHoursBigInput: {
      flex: 1,
      height: 64,
      borderRadius: 18,
      backgroundColor: c.inputSurface,
      paddingHorizontal: 20,
      color: c.textPrimary,
      fontSize: 28,
      fontWeight: "600",
    },
    manualHoursBigUnit: {
      color: c.textMuted,
      fontSize: 20,
      fontWeight: "600",
      width: 36,
    },
    manualSheetSave: {
      height: 56,
      borderRadius: 18,
      backgroundColor: "#0091FF",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    manualSheetFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      paddingHorizontal: 4,
    },
    manualHoursClearText: {
      color: "#E5484D",
      fontSize: 15,
      fontWeight: "600",
    },
    manualHoursCancelButton: {
      alignSelf: "center",
      marginTop: 6,
      paddingVertical: 6,
    },
    manualHoursCancelText: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 15,
      fontWeight: "600",
    },
    manualAddButton: {
      height: 46,
      borderRadius: 14,
      backgroundColor: "#F59E0B",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    manualAddButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    manualProjectPicker: {
      marginBottom: 16,
    },
    manualProjectLabel: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 8,
    },
    manualProjectList: {
      maxHeight: 150,
    },
    manualProjectEmpty: {
      color: onDark(c, c.textMuted, "rgba(122, 148, 168, 1)"),
      fontSize: 14,
      paddingVertical: 8,
    },
    manualProjectOption: {
      height: 44,
      borderRadius: 12,
      backgroundColor: c.inputSurface,
      justifyContent: "center",
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    manualProjectOptionActive: {
      backgroundColor: "#F59E0B1A",
      borderWidth: 1,
      borderColor: "#F59E0B",
    },
    manualProjectOptionText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    manualProjectOptionTextActive: {
      color: onDark(c, c.warning, "#B8760A"),
    },
    exportMainButtonDisabled: {
      opacity: 0.7,
    },
    exportMainButtonText: {
      fontSize: 18,
      color: "#FFFFFF",
      fontWeight: "600",
    },
    monthOption: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    monthOptionText: {
      color: c.textPrimary,
      fontSize: 16,
    },
    monthOptionTextSelected: {
      color: "#0088FF",
      fontWeight: "700",
    },
  });
