import { Platform, StyleSheet } from "react-native";

import { radius } from "../../../theme/tokens";

// `onDark` = the Home background is a solid colour/gradient (blue, green,
// orange, black…), not a light theme. There the checklist becomes a frosted
// "glass" card with white text (Figma "Kom igång" redesign); on light homes it
// keeps the opaque white/dark surface so it stays legible.
export function createStyles(theme, onDark = false) {
  const c = theme.content;
  // White-on-glass palette for the coloured-home variant.
  const g = {
    text: "#FFFFFF",
    textDim: "rgba(255,255,255,0.78)",
    line: "rgba(255,255,255,0.65)",
    done: "rgba(255,255,255,0.55)",
  };
  return StyleSheet.create({
    // ~90% opaque surface (10% transparent) so the card blends slightly into the
    // Home glass aesthetic while still reading clearly — a solid fill popped too
    // hard, the old frosted surfaceMuted was light-on-light.
    card: onDark
      ? {
          backgroundColor: "rgba(255,255,255,0.14)",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.28)",
          padding: 20,
          gap: 14,
          marginBottom: 16,
        }
      : {
          // Android draws its elevation shadow from the view's outline and
          // paints it behind the fill — with a translucent fill the shadow
          // shows THROUGH the card as a grey band with a hard edge. So on
          // Android the card is opaque and leans on a hairline instead of a
          // shadow; iOS keeps the soft drop shadow it renders correctly.
          backgroundColor: Platform.select({
            android: c.scheme === "dark" ? "#2C2C2E" : "#FFFFFF",
            default:
              c.scheme === "dark"
                ? "rgba(44,44,46,0.90)"
                : "rgba(255,255,255,0.90)",
          }),
          borderRadius: 20,
          // Same 20 as every other card, so its text shares the screen's one
          // text line.
          padding: 20,
          gap: 12,
          marginBottom: 16,
          ...Platform.select({
            android: {
              borderWidth: 1,
              borderColor: c.border,
            },
            default: {
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
            },
          }),
        },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: onDark ? g.text : c.textPrimary,
      fontSize: 18,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    subtitle: {
      color: onDark ? g.text : c.textMuted,
      fontSize: onDark ? 15 : 13,
      fontFamily: onDark
        ? theme.text.fontFamily.medium
        : theme.text.fontFamily.regular,
    },
    // On the routing (needsFocus) card every text is the SAME size (16) — only
    // the colour/weight differ. Applied on top of title/subtitle to override
    // their default sizes there without touching the other states.
    focusText: {
      fontSize: 16,
      lineHeight: 22,
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: c.inputSurface,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
    },
    list: {
      gap: onDark ? 6 : 4,
    },
    row: {
      flexDirection: "row",
      alignItems: onDark ? "flex-start" : "center",
      gap: 12,
      paddingVertical: onDark ? 8 : 10,
      paddingHorizontal: 10,
      marginHorizontal: -10,
      borderRadius: 14,
    },
    // The single "do this next" step gets a soft tinted background so the eye
    // lands on one clear action.
    rowActive: {
      backgroundColor: c.accentSoft,
    },
    iconCircle: {
      width: onDark ? 26 : 30,
      height: onDark ? 26 : 30,
      borderRadius: 999,
      borderWidth: onDark ? 2 : 1.5,
      alignItems: "center",
      justifyContent: "center",
      marginTop: onDark ? 1 : 0,
    },
    // onDark todo circle: thin white ring, no fill / no per-step icon (Figma).
    circleTodoDark: {
      borderColor: g.line,
    },
    // onDark done circle: solid white with the blue check inside.
    circleDoneDark: {
      backgroundColor: "#FFFFFF",
      borderColor: "#FFFFFF",
    },
    rowBody: {
      flex: 1,
      gap: onDark ? 2 : 1,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: theme.text.fontFamily.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    rowTitle: {
      color: onDark ? g.text : c.textPrimary,
      fontSize: onDark ? 16 : 15,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    rowTitleDone: {
      color: onDark ? g.done : c.textMuted,
      textDecorationLine: "line-through",
      fontFamily: theme.text.fontFamily.medium,
    },
    rowDesc: {
      color: onDark ? g.textDim : c.textMuted,
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: theme.text.fontFamily.regular,
    },
    doneTag: {
      color: c.successStrong,
      fontSize: 13,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    // One line over the hand-off button when a track is finished.
    handoffText: {
      color: onDark ? g.text : c.textPrimary,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
      marginTop: 2,
    },
    footerCta: {
      // Full width so the flex:1 label wraps to two lines inside the button
      // (growing its height) instead of overflowing on one line.
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      // Left-aligned so the icon sits a fixed distance from the button's left
      // edge (same as the focus buttons), regardless of label length.
      justifyContent: "flex-start",
      gap: 10,
      marginTop: 4,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: onDark ? "rgba(255,255,255,0.45)" : c.accentSoft,
      backgroundColor: onDark ? "rgba(255,255,255,0.14)" : c.accentSoft,
    },
    footerCtaText: {
      flex: 1,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    // Admin focus routing
    focusChoices: {
      gap: 10,
      alignItems: "stretch",
    },
    focusBtn: {
      flexDirection: "row",
      alignItems: "center",
      // Left-aligned + fixed left padding so the icon is the same distance from
      // the left edge on every button, whether the label is one line or two.
      justifyContent: "flex-start",
      gap: 10,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: onDark ? "rgba(255,255,255,0.45)" : c.accentSoft,
      backgroundColor: onDark ? "rgba(255,255,255,0.14)" : c.accentSoft,
    },
    focusBtnText: {
      flex: 1,
      fontSize: 16,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    focusSkip: {
      textAlign: "center",
      color: onDark ? g.text : c.textMuted,
      fontSize: 16,
      fontFamily: theme.text.fontFamily.medium,
      paddingVertical: 4,
    },
    changeFocus: {
      textAlign: "center",
      color: onDark ? g.text : c.textMuted,
      fontSize: 13,
      fontFamily: theme.text.fontFamily.medium,
      marginTop: 2,
    },
    // Report-time chooser sheet
    sheetBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 34,
      gap: 6,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: c.border,
      marginBottom: 10,
    },
    sheetTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontFamily: theme.text.fontFamily.semiBold,
      marginBottom: 6,
      marginLeft: 4,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 6,
    },
    // The bottom chooser/guide sheet always sits on a light `surface`, so its
    // rows keep the normal theme text colours — NOT the white glass palette the
    // checklist rows use when the Home background is coloured (onDark).
    sheetRowTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    sheetRowDesc: {
      color: c.textMuted,
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: theme.text.fontFamily.regular,
    },
    // Manual-hours how-to guide (inside the chooser sheet)
    guideNumber: {
      width: 30,
      height: 30,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    guideNumberText: {
      color: c.onAccent,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    guideNote: {
      color: c.textMuted,
      fontSize: 13.5,
      lineHeight: 19,
      fontFamily: theme.text.fontFamily.medium,
      marginTop: 4,
      marginBottom: 10,
      marginLeft: 4,
    },
    guideCta: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
      borderRadius: radius.full,
    },
    guideCtaText: {
      color: c.onAccent,
      fontSize: 16,
      fontFamily: theme.text.fontFamily.semiBold,
    },
  });
}
