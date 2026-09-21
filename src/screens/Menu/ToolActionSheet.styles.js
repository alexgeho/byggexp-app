import { StyleSheet } from "react-native";

import { onDark } from "../../theme/colorUtils";

// Extracted from ToolActionSheet.jsx. The sheet used to be a fixed white card
// with navy text, which slammed up over the dark tools/scanner screen; it takes
// the theme now.
export const createStyles = (c) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(5,45,80,0.35)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: onDark(c, c.surface, "#fff"),
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 28,
      maxHeight: "85%",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: onDark(c, c.divider, "#CBD5E1"),
      marginBottom: 14,
    },
    name: {
      fontSize: 20,
      fontWeight: "700",
      color: onDark(c, c.textPrimary, "#052D50"),
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
    },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    badge_available: { backgroundColor: "rgba(22,163,94,0.14)" },
    badge_occupied: { backgroundColor: "rgba(7,133,244,0.14)" },
    badge_broken: { backgroundColor: "rgba(220,38,38,0.14)" },
    badge_in_repair: { backgroundColor: "rgba(234,166,35,0.16)" },
    badgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: onDark(c, c.textPrimary, "#052D50"),
    },
    holder: {
      color: onDark(c, c.textSecondary, "#5F7588"),
      fontSize: 14,
      fontWeight: "600",
    },
    location: {
      color: onDark(c, c.textSecondary, "#5F7588"),
      fontSize: 14,
      marginTop: 8,
    },
    qr: {
      color: onDark(c, c.textMuted, "#94A3B8"),
      fontSize: 13,
      fontFamily: "Courier",
      marginTop: 4,
    },
    actions: { flexDirection: "row", gap: 12, marginTop: 18 },
    primaryBtn: {
      flex: 2,
      height: 52,
      borderRadius: 16,
      backgroundColor: "#0785F4",
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    secondaryBtn: {
      flex: 1,
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: onDark(c, c.border, "#D8E0E8"),
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryText: { color: "#0785F4", fontSize: 15, fontWeight: "600" },
    historyBox: { marginTop: 14, maxHeight: 200 },
    historyEmpty: { color: onDark(c, c.textMuted, "#94A3B8"), fontSize: 14 },
    historyItem: {
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: onDark(c, c.divider, "#e9e9e9"),
    },
    historyType: {
      color: onDark(c, c.textPrimary, "#052D50"),
      fontSize: 14,
      fontWeight: "600",
    },
    historyDate: {
      color: onDark(c, c.textMuted, "#94A3B8"),
      fontSize: 12,
      marginTop: 2,
    },
    closeBtn: {
      marginTop: 18,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: onDark(c, c.surfaceMuted, "#F1F5F9"),
    },
    closeText: {
      color: onDark(c, c.textPrimary, "#5F7588"),
      fontSize: 15,
      fontWeight: "600",
    },
  });
