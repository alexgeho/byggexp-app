import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { layout } from "../../../theme/spacing";
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
    monthLabel: {
      flex: 1,
      marginHorizontal: 12,
      textAlign: "center",
      color: c.textPrimary,
      fontSize: 17,
      fontFamily: "DMSans-SemiBold",
    },
    // As wide as the back button, so the title is centred on the screen.
    headerSide: {
      width: 44,
    },
    viewRow: {
      paddingVertical: 10,
    },
    // The header already keeps its gap under itself; the people sit right
    // after it, and the card keeps the same gap after the people.
    peopleRow: {},
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
    timelineCard: {
      flex: 1,
      marginTop: layout.headerToContent,
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
