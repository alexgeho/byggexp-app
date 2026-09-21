import { StyleSheet } from "react-native";

import { onDark } from "../../../theme/colorUtils";

// Extracted from ExpenseReviewSheet.jsx. It was a fixed white sheet with navy
// text, so on the dark theme a scanned receipt opened a full light panel over
// the dark camera screen.
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
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 24,
      maxHeight: "90%",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: onDark(c, c.divider, "#CBD5E1"),
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: onDark(c, c.textPrimary, "#052D50"),
      marginBottom: 12,
    },
    preview: {
      width: "100%",
      height: 160,
      borderRadius: 14,
      backgroundColor: onDark(c, c.surfaceMuted, "#EEE"),
      marginBottom: 14,
    },
    label: {
      color: onDark(c, c.textSecondary, "#5F7588"),
      fontSize: 13,
      marginBottom: 6,
      marginTop: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: onDark(c, c.border, "#D8E0E8"),
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: onDark(c, c.textPrimary, "#052D50"),
    },
    row: { flexDirection: "row", gap: 12 },
    col: { flex: 1 },
    projectFixed: {
      backgroundColor: onDark(c, c.surfaceMuted, "#F1F5F9"),
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    projectFixedText: {
      color: onDark(c, c.textPrimary, "#052D50"),
      fontSize: 15,
      fontWeight: "600",
    },
    projectList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    projectChip: {
      borderWidth: 1,
      borderColor: onDark(c, c.border, "#D8E0E8"),
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    projectChipActive: { backgroundColor: "#0785F4", borderColor: "#0785F4" },
    projectChipText: {
      color: onDark(c, c.textPrimary, "#052D50"),
      fontSize: 14,
    },
    projectChipTextActive: { color: "#fff", fontWeight: "600" },
    hint: { color: onDark(c, c.textMuted, "#94A3B8"), fontSize: 13 },
    error: { color: onDark(c, c.danger, "#DC2626"), marginTop: 12 },
    actions: { flexDirection: "row", gap: 12, marginTop: 16 },
    cancelBtn: {
      flex: 1,
      height: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: onDark(c, c.border, "#D8E0E8"),
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      color: onDark(c, c.textSecondary, "#5F7588"),
      fontSize: 15,
      fontWeight: "600",
    },
    saveBtn: {
      flex: 2,
      height: 52,
      borderRadius: 16,
      backgroundColor: "#0785F4",
      alignItems: "center",
      justifyContent: "center",
    },
    saveText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });
