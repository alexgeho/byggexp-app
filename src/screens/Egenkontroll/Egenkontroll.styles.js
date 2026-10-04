import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";

// Shared themed styles for the egenkontroll screens (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
    },
    header: { ...standardScreenHeader },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
      flex: 1,
    },
    headerSpacer: { width: 44 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    list: { flex: 1, width: "100%" },
    listContent: { paddingBottom: 160, gap: 12 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 6,
    },
    cardTitle: { fontSize: 16, fontWeight: "600", color: c.textPrimary },
    meta: { fontSize: 13, color: c.textMuted },
    body: { fontSize: 15, color: c.textPrimary },
    muted: { fontSize: 14, color: c.textMuted, textAlign: "center" },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: c.textPrimary,
      marginBottom: 8,
      textAlign: "center",
    },
    primaryButton: {
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryButtonText: { color: c.onAccent, fontSize: 16, fontWeight: "600" },
    secondaryButton: {
      backgroundColor: c.accentSoft,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      flex: 1,
    },
    secondaryButtonText: { color: c.accent, fontSize: 15, fontWeight: "600" },
    row: { flexDirection: "row", gap: 10, alignItems: "center" },
    input: {
      backgroundColor: c.inputSurface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: c.textPrimary,
    },
    chip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.inputSurface,
    },
    chipText: { fontSize: 13, fontWeight: "600", color: c.textSecondary },
    chipOk: { backgroundColor: c.successSoft },
    chipOkText: { color: c.success },
    chipRemark: { backgroundColor: c.dangerSoft },
    chipRemarkText: { color: c.danger },
    chipNa: { backgroundColor: c.inputSurface },
    aiNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.accentSoft,
      borderRadius: 10,
      padding: 8,
    },
    aiTag: { fontSize: 11, fontWeight: "800", color: c.accent },
    aiText: { flex: 1, fontSize: 13, color: c.textSecondary },
    link: { fontSize: 13, fontWeight: "600", color: c.accent },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: c.inputSurface,
    },
    statusPill: {
      alignSelf: "flex-start",
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 999,
    },
    statusText: { fontSize: 12, fontWeight: "700" },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 34,
      gap: 10,
      backgroundColor: c.background,
    },
  });

// Status pill colours — same tinted-pill pattern as the staff status badges.
export const statusColors = (c, status) =>
  status === "signed"
    ? { bg: c.successSoft, fg: c.success }
    : status === "completed"
      ? { bg: c.statusWaitingSoft, fg: c.statusWaiting }
      : { bg: c.warningSoft, fg: c.warning };
