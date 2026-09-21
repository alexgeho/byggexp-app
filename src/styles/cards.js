import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import { lightContent } from "../theme/tokens";

// The shared entity card: projects, employees, tasks, tools, chats, documents.
// It used to be one fixed light stylesheet, so on the dark theme every status
// badge kept its pale light tint and the meta line stayed slate — a light card
// painted onto a near-black page.
//
// The light values below are written out literally, exactly as they were, so
// the light themes render pixel-for-pixel what they rendered before; only the
// dark theme takes the token side of each pair.
const pair = (dark, darkFg, darkBg, lightFg, lightBg) => ({
  color: dark ? darkFg : lightFg,
  backgroundColor: dark ? darkBg : lightBg,
});

export const createCardStyles = (c = lightContent) => {
  const dark = c.scheme === "dark";
  return StyleSheet.create({
    card: {
      backgroundColor: dark ? c.card : "#FFFFFF",
      width: "100%",
      padding: 20,
      borderRadius: 16,
      gap: 8,
      borderWidth: 1,
      // Every entity card shares this one style: on light the border is white,
      // so the card reads as a clean white surface; on dark it is the hairline
      // that separates the card from the page (Figma: white @ 20%).
      borderColor: dark ? c.border : "#FFFFFF",
    },

    cardSelected: {
      borderColor: dark ? c.accent : "#0785F4",
    },

    cardHeader: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },

    cardTitle: {
      color: dark ? c.textPrimary : "#052D50",
      flex: 1,
      flexShrink: 1,
      fontSize: 17,
      fontWeight: "500",
    },

    cardPrimaryText: {
      color: dark ? c.accent : "#0785F4",
    },

    cardSecondaryText: {
      color: dark ? c.textMuted : "#698196",
    },

    cardBadge: {
      height: 28,
      paddingHorizontal: 12,
      paddingVertical: 3,
      borderRadius: 12,
      flexShrink: 0,
      alignSelf: "flex-start",
      fontWeight: "500",
      fontSize: 13,
      lineHeight: 22,
      textAlign: "center",
      textAlignVertical: "center",
      overflow: "hidden",
    },

    cardBadgeOpen: pair(dark, c.accent, c.accentSoft, "#0785F4", "#0785F41A"),
    cardBadgeOverdue: pair(
      dark,
      c.danger,
      c.dangerSoft,
      "#FF3B30",
      "#FF3B301F",
    ),
    cardBadgeCompleted: pair(
      dark,
      c.success,
      c.successSoft,
      "#248A3D",
      "#34C75924",
    ),
    cardBadgeWarning: pair(
      dark,
      c.warning,
      c.warningSoft,
      "#C77700",
      "#FF95001F",
    ),
    cardBadgeAvailable: pair(
      dark,
      c.success,
      c.successSoft,
      "#248A3D",
      "#34C75924",
    ),
    cardBadgeBroken: pair(dark, c.danger, c.dangerSoft, "#FF3B30", "#FF3B301F"),
    cardBadgeInRepair: pair(
      dark,
      c.warning,
      c.warningSoft,
      "#C77700",
      "#FF95001F",
    ),
    cardBadgeOccupied: pair(
      dark,
      c.accent,
      c.accentSoft,
      "#0785F4",
      "#0785F41A",
    ),
    cardBadgeNeutral: pair(
      dark,
      c.textSecondary,
      c.statusOffDutySoft,
      "#698196",
      "#69819624",
    ),
    cardBadgeAtWork: pair(
      dark,
      c.statusAtWork,
      c.statusAtWorkSoft,
      "#338600",
      "rgba(51, 134, 0, 0.1)",
    ),
    cardBadgeAbsent: pair(
      dark,
      c.statusNotAtWork,
      c.statusNotAtWorkSoft,
      "#FF0000",
      "rgba(255, 0, 0, 0.1)",
    ),
  });
};

// The themed card styles. Every screen that draws an entity card asks for these
// instead of importing a fixed stylesheet.
export const useCardStyles = () => {
  const { theme } = useTheme();
  return useMemo(() => createCardStyles(theme.content), [theme.content]);
};

// Light fallback, kept so a non-component module can still reach the shapes.
export const cardStyles = createCardStyles(lightContent);
