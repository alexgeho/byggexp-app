import { StyleSheet } from "react-native";

// Shared styling for the grouped "info field row" — extracted 1:1 from the
// Redigera anställd (edit employee) form, the design source of truth. Every
// user-facing card of icon+label+value rows should use these so the look never
// diverges between screens (edit vs profile vs …).
export function createStyles(c) {
  return StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 10,
      overflow: "hidden",
    },
    // padding for the static/input row body
    rowPad: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    // tappable row (chevron). Same vertical padding as the input row (rowPad)
    // so select/readonly rows are the exact same height as text-field rows —
    // the bottom card must not look shorter than the top one.
    tapRow: {
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconBadge: {
      width: 30,
      height: 30,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
      gap: 2,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: "#6C6C70",
    },
    input: {
      fontSize: 16,
      color: c.textPrimary,
      paddingVertical: 0,
    },
    inputMultiline: {
      minHeight: 96,
      paddingTop: 4,
    },
    value: {
      fontSize: 16,
      color: c.textPrimary,
    },
    placeholder: {
      color: "rgba(5, 45, 80, 0.35)",
    },
    // hairline divider, inset past the icon (30 badge + 12 gap + 16 pad = 58)
    sepIcon: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 58,
    },
    // hairline divider inset to the label when there is no icon
    sepPlain: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 16,
    },
  });
}
