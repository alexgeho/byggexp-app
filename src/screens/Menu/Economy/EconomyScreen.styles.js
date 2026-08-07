import { StyleSheet } from "react-native";

/* Finance list — pixel-matched to Figma "offers" / "invoices". */
const PAGE = "#F2F1F6";
const CARD = "#FFFFFF";
const INK = "#030303";
const PRIMARY = "#0785F4";
const MUTED = "#667E93";

const F_MED = "DMSans-Medium";
const F_SEMI = "DMSans-SemiBold";

export const styles = StyleSheet.create({
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
    backgroundColor: "rgba(5,45,80,0.05)",
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

  /* Status filter pills */
  // Single horizontally-scrollable row of filter pills.
  pillsWrap: { position: "relative", marginBottom: 20 },
  pillsRow: { flexGrow: 0 },
  pillsFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 36,
  },
  pillsContent: {
    paddingLeft: 16,
    paddingRight: 24,
    gap: 10,
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
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  cardInfo: { gap: 14, flexShrink: 1, paddingRight: 12 },
  cardNo: { fontSize: 13, fontFamily: F_MED, color: MUTED },
  cardCustomer: { fontSize: 17, fontFamily: F_MED, color: INK },
  cardMeta: { fontSize: 13, fontFamily: F_MED, color: MUTED },
  cardRight: { alignItems: "flex-end", justifyContent: "space-between" },
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
});
