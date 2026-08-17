import { StyleSheet } from "react-native";

/* Finance forms — pixel-matched to Figma "new invoice" / "new offer".
   Palette and metrics come straight from the Figma nodes. */
export const PAGE = "#F2F1F6";
export const CARD = "#FFFFFF";
export const INK = "#030303";
export const PRIMARY = "#0785F4";
export const MUTED = "#667E93";
export const INPUT_BG = "#EEEEEE";
export const PLACEHOLDER = "#9AA6B2";

// Kept for existing imports (date-picker accent etc.)
export const LINE = "#FFFFFF";
export const FIELD_BG = "#FFFFFF";

const F_MED = "DMSans-Medium"; // Figma weight 500
const F_SEMI = "DMSans-SemiBold"; // Figma weight 600

export const createStyles = (c) => {
  const PAGE = c.background;
  const CARD = c.surface;
  const INK = c.textPrimary;
  const MUTED = c.textMuted;
  const INPUT_BG = c.inputSurface;
  const LINE = c.divider;
  const FIELD_BG = c.surface;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: PAGE },

    /* Top bar: circle back + centered title + circle right button (44 / r22) */
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
    title: { fontSize: 17, fontFamily: F_SEMI, color: INK },

    scroll: { paddingHorizontal: 16, paddingBottom: 130, gap: 20 },

    /* Label + field block (Figma: 8px gap between label and field) */
    field: { gap: 8 },
    label: { fontSize: 15, fontFamily: F_MED, color: INK },

    /* Pill field (h44, r71, white) */
    input: {
      backgroundColor: CARD,
      borderRadius: 71,
      paddingHorizontal: 16,
      height: 44,
      fontSize: 15,
      fontFamily: F_MED,
      color: INK,
    },
    inputRow: {
      backgroundColor: CARD,
      borderRadius: 71,
      paddingHorizontal: 16,
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    inputRowText: { fontSize: 15, fontFamily: F_MED, color: INK, flex: 1 },
    inputRowPlaceholder: { color: PLACEHOLDER },

    /* "Select customer" + plus button on the same row */
    customerRow: { flexDirection: "row", gap: 10 },
    customerField: { flex: 1 },
    customerAdd: {
      width: 44,
      height: 44,
      borderRadius: 71,
      backgroundColor: CARD,
      alignItems: "center",
      justifyContent: "center",
    },

    /* Textarea card (Description / Clarifications): r20 white, pad t17 l20 r20 */
    textareaCard: {
      backgroundColor: CARD,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 17,
    },
    textarea: {
      fontSize: 15,
      fontFamily: F_MED,
      color: INK,
      minHeight: 94,
      padding: 0,
      textAlignVertical: "top",
    },
    textareaShort: { minHeight: 47 },

    /* Line-items card (r20 white, pad15) — one card per row */
    row: {
      backgroundColor: CARD,
      borderRadius: 20,
      padding: 15,
      gap: 15,
    },
    rowBlock: { gap: 8 },
    rowLabelLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowDescField: {
      backgroundColor: INPUT_BG,
      borderRadius: 71,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
      fontSize: 15,
      fontFamily: F_MED,
      color: INK,
      textAlignVertical: "center",
    },
    rowDelete: { padding: 2 },
    rowGrid: { flexDirection: "row", gap: 15 },
    cell: { flex: 1, gap: 8 },
    cellLabel: { fontSize: 13, fontFamily: F_MED, color: INK },
    cellInput: {
      backgroundColor: INPUT_BG,
      borderRadius: 71,
      paddingHorizontal: 16,
      height: 44,
      fontSize: 15,
      fontFamily: F_MED,
      color: INK,
      textAlign: "right",
    },
    cellInputLeft: { textAlign: "right" },
    rowAmount: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowAmountLabel: { fontSize: 13, fontFamily: F_MED, color: INK },
    rowAmountValue: { fontSize: 17, fontFamily: F_SEMI, color: INK },

    /* Add row — pill, white, blue border + blue label */
    addRow: {
      height: 44,
      borderRadius: 71,
      borderWidth: 1,
      borderColor: PRIMARY,
      backgroundColor: CARD,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    addRowText: { color: PRIMARY, fontFamily: F_MED, fontSize: 15 },

    /* ROT card */
    toggleRow: {
      backgroundColor: CARD,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    toggleTitle: { fontSize: 15, fontFamily: F_SEMI, color: INK },
    toggleSub: { fontSize: 13, fontFamily: F_MED, color: MUTED, marginTop: 2 },
    toggleTrack: {
      width: 51,
      height: 31,
      borderRadius: 100,
      padding: 2,
      justifyContent: "center",
    },
    toggleKnob: {
      width: 27,
      height: 27,
      borderRadius: 100,
      backgroundColor: "#FFFFFF",
      shadowColor: "#000000",
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },

    /* Totals card (r20 white) */
    totals: {
      backgroundColor: CARD,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 17,
      gap: 8,
    },
    totalLine: { flexDirection: "row", justifyContent: "space-between" },
    totalLabel: { fontSize: 15, fontFamily: F_MED, color: INK },
    totalValue: { fontSize: 15, fontFamily: F_SEMI, color: INK },
    totalValueNeg: { color: "#04B251" },
    grandLine: {
      marginTop: 7,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    grandLabel: { fontSize: 17, fontFamily: F_SEMI, color: INK },
    grandValue: { fontSize: 17, fontFamily: F_SEMI, color: INK },

    /* Bottom action bar (white "Down" frame with two pills) */
    actions: {
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 30,
      backgroundColor: CARD,
    },
    btn: {
      flex: 1,
      height: 52,
      borderRadius: 71,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    btnPrimary: { backgroundColor: PRIMARY },
    // Figma shows a white pill on the white bar; a hairline keeps it visible.
    btnGhost: { backgroundColor: CARD, borderWidth: 1, borderColor: "#ECECEC" },
    btnText: { fontSize: 15, fontFamily: F_MED },
    btnTextPrimary: { color: "#FFFFFF" },
    btnTextGhost: { color: INK },
    btnDisabled: { opacity: 0.5 },

    /* two-column row (client picker) */
    two: { flexDirection: "row", gap: 11 },
    half: { flex: 1 },

    /* company / private toggle (client picker) */
    typeToggle: {
      flexDirection: "row",
      backgroundColor: INPUT_BG,
      borderRadius: 71,
      padding: 4,
      marginBottom: 12,
    },
    typeBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 71,
      alignItems: "center",
    },
    typeBtnOn: { backgroundColor: CARD },
    typeText: { fontSize: 14, fontFamily: F_MED, color: MUTED },
    typeTextOn: { color: INK },

    /* client picker modal */
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
      maxHeight: "82%",
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
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: INPUT_BG,
      borderRadius: 71,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 11,
      fontSize: 15,
      fontFamily: F_MED,
      color: INK,
    },
    clientRow: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f3f6",
    },
    clientName: { fontSize: 15, fontFamily: F_SEMI, color: INK },
    clientMeta: { fontSize: 13, fontFamily: F_MED, color: MUTED, marginTop: 2 },
    newClientBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
    },
    newClientText: { color: PRIMARY, fontFamily: F_SEMI, fontSize: 15 },
  });
};
