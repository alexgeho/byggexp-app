import { StyleSheet } from "react-native";
import { onDark } from "../../../theme/colorUtils";
import { radius } from "../../../theme/tokens";

// Shared styling for the grouped "info field row" — extracted 1:1 from the
// Redigera anställd (edit employee) form, the design source of truth. Every
// user-facing card of icon+label+value rows should use these so the look never
// diverges between screens (edit vs profile vs …).
export function createStyles(c) {
  return StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: radius.card,
      overflow: "hidden",
    },
    // padding for the static/input row body
    rowPad: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    // Floating-label input: same minimum height as a tap row, content centred,
    // so empty and filled rows line up with select rows.
    // 62 = 12 pad + 16 label + 2 gap + 20 value + 12 pad: an empty row is as
    // tall as a filled one, so the label moving up never makes the row jump.
    floatingRow: {
      minHeight: 62,
      justifyContent: "center",
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
    bodyCustom: {
      gap: 8,
    },
    label: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "600",
      color: onDark(c, c.textSecondary, "#6C6C70"),
    },
    input: {
      fontSize: 16,
      color: c.textPrimary,
      paddingVertical: 0,
    },
    // Single-line only: RN iOS hides a multiline placeholder with lineHeight.
    inputLine: {
      lineHeight: 20,
    },
    inputMultiline: {
      minHeight: 96,
      paddingTop: 4,
    },
    value: {
      fontSize: 16,
      lineHeight: 20,
      color: c.textPrimary,
    },
    hint: {
      fontSize: 14,
      lineHeight: 18,
      color: onDark(c, c.placeholder, "rgba(5, 45, 80, 0.35)"),
    },
    switch: {
      marginLeft: 12,
    },
    placeholderFloating: {
      color: c.placeholder,
    },
    placeholder: {
      color: onDark(c, c.placeholder, "rgba(5, 45, 80, 0.35)"),
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
