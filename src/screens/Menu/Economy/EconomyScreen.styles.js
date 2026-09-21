import { StyleSheet } from "react-native";

import { layout } from "../../../theme/spacing";

/* Finance list — pixel-matched to Figma "offers" / "invoices". */
const F_MED = "DMSans-Medium";
const F_SEMI = "DMSans-SemiBold";

export const createStyles = (c) => {
  const PAGE = c.background;
  const CARD = c.surface;
  const INK = c.textPrimary;
  const PRIMARY = c.accent;
  const MUTED = c.textMuted;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: PAGE },

    /* Top bar: circle back + centered title + circle right button */
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 44,
      marginHorizontal: 16,
      marginBottom: 20,
    },
    headerBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: CARD,
      alignItems: "center",
      justifyContent: "center",
    },
    headerSpacer: { width: 44, height: 44 },
    title: { fontSize: 17, fontFamily: F_SEMI, color: INK },

    /* Segmented Offers / Invoices — navy @5% track, white active pill (Figma) */
    segmented: {
      flexDirection: "row",
      backgroundColor: c.inputSurface,
      borderRadius: 10,
      padding: 4,
      height: 44,
      marginHorizontal: 16,
      marginBottom: 20,
    },
    segBtn: {
      flex: 1,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    segBtnOn: { backgroundColor: CARD },
    segText: { fontSize: 15, fontFamily: F_MED, color: INK },
    segTextOn: { color: INK },

    /* Quick links to the offer/invoice registers (clients, articles, company) */
    /* Status filter pills */
    // Single horizontally-scrollable row of filter pills.
    clientTypeFilter: {
      width: "100%",
      marginBottom: layout.betweenCards,
    },
    // Same 12 as between two cards: the row above it, the row below it and
    // the list all breathe alike.
    // No margin of its own: EntityListScreen already keeps one gap above
    // (under the chips) and one below (before the list).
    pillsWrap: { position: "relative" },
    pillsRow: { flexGrow: 0 },
    pillsFade: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 36,
    },
    pillsContent: {
      // Starts on the screen's gutter, like the chips above it.
      paddingLeft: 0,
      paddingRight: 24,
      gap: layout.betweenCards,
      alignItems: "center",
    },
    pill: {
      height: 44,
      paddingHorizontal: 18,
      borderRadius: 71,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: CARD,
    },
    pillOn: { backgroundColor: PRIMARY },
    pillText: { fontSize: 15, fontFamily: F_MED, color: INK },
    pillTextOn: { color: "#FFFFFF" },

    listContent: { paddingHorizontal: 16, paddingBottom: 160, gap: 10 },
    center: { paddingTop: 90, alignItems: "center", gap: 12 },
    emptyText: {
      fontSize: 15,
      fontFamily: F_MED,
      color: MUTED,
      textAlign: "center",
      paddingHorizontal: 30,
    },

    /* Card */
    // Red slab behind a swiped document card — same as every other list.
    swipeDeleteAction: {
      backgroundColor: "#FF3B30",
      width: 92,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      marginBottom: 12,
    },
    swipeDeleteText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },
    card: {
      backgroundColor: CARD,
      borderRadius: 20,
      padding: 20,
      // The ⋮ column is reserved on the right, so the badge and the amount
      // end where it begins instead of crowding it.
      paddingRight: 20 + 36,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "stretch",
    },
    cardInfo: { flex: 1, gap: 10 },
    // One line of the card: label on the left, value pushed to the right.
    cardLine: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
    },
    cardNo: { fontSize: 13, fontFamily: F_MED, color: MUTED },
    cardCustomer: {
      fontSize: 16,
      fontFamily: F_MED,
      color: INK,
      flexShrink: 1,
      textAlign: "right",
    },
    cardMeta: { fontSize: 13, fontFamily: F_MED, color: MUTED },
    cardRight: {
      alignItems: "flex-end",
      // The amount sits at the top of the right column, where the badge was.
      justifyContent: "flex-start",
    },
    // The status now speaks through the amount's colour instead of a badge:
    // grey while it is a draft, blue once sent, green paid, red overdue.
    amount_draft: { color: MUTED },
    amount_sent: { color: "#0C77FD" },
    amount_ok: { color: "#04B251" },
    amount_bad: { color: "#E5484D" },
    cardAmount: { fontSize: 17, fontFamily: F_MED, color: INK },

    badge: {
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 10,
      alignSelf: "flex-end",
    },
    badgeText: {
      fontSize: 13,
      fontFamily: F_MED,
      textTransform: "uppercase",
    },
    badge_draft: { backgroundColor: "#EDF0F5" },
    badgeText_draft: { color: MUTED },
    badge_sent: { backgroundColor: "#EBF4FE" },
    badgeText_sent: { color: "#0C77FD" },
    badge_ok: { backgroundColor: "#E5F7EA" },
    badgeText_ok: { color: "#04B251" },
    badge_bad: { backgroundColor: "#FDECEC" },
    badgeText_bad: { color: "#E5484D" },

    // 48×48 target in the corner — the size Material asks for, and the place
    // it asks for. The right column is padded so nothing sits under it.
    cardMore: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: 44,
      alignItems: "center",
      justifyContent: "center",
    },

    /* Active status pill: the status colour, solid */
    pillOn_draft: { backgroundColor: "#9AA6B2" },
    pillOn_sent: { backgroundColor: "#0C77FD" },
    pillOn_ok: { backgroundColor: "#04B251" },
    pillOn_bad: { backgroundColor: "#E5484D" },

    /* Rows in the document's action sheet */
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 15,
    },
    actionRowText: { fontSize: 16, fontFamily: F_MED, color: INK },

    /* Customer filter — first pill in the status-filter row */
    customerPill: {
      flexDirection: "row",
      gap: 8,
      maxWidth: 220,
    },
    customerPillText: {
      flexShrink: 1,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(5,25,50,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: CARD,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 30,
      maxHeight: "70%",
    },
    grab: {
      width: 42,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#d5dee7",
      alignSelf: "center",
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 17,
      fontFamily: F_SEMI,
      color: INK,
      marginBottom: 8,
    },
    customerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f3f6",
      gap: 10,
    },
    customerRowText: {
      fontSize: 15,
      fontFamily: F_MED,
      color: INK,
      flex: 1,
    },

    /* Register sheet rows (Clients / Articles / Company details) */
    registerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f3f6",
    },
    registerRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    registerRowText: {
      fontSize: 16,
      fontFamily: F_MED,
      color: INK,
      flex: 1,
    },
  });
};
