import React, { useMemo } from "react";
import { TouchableOpacity, Image } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { isLightColor } from "../../../theme/colorUtils";
import { createStyles } from "./BackButton.styles";

// Glass palettes for the round back button. Light = the original frosted-white
// look; dark = a subtle dark glass so it reads on the dark theme background.
const LIGHT_GLASS = {
  bg: "rgba(255,255,255,0.6)",
  border: "#E7ECF0",
  ring: "rgba(255,255,255,0.35)",
  hardGlow: "rgba(255,255,255,0.03)",
  icon: "#20384D",
  base: ["rgba(255,255,255,0.78)", "rgba(255,255,255,0.16)"],
  highlight: [
    "rgba(255,255,255,0.92)",
    "rgba(255,255,255,0.18)",
    "rgba(255,255,255,0)",
  ],
};

const DARK_GLASS = {
  bg: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.16)",
  ring: "rgba(255,255,255,0.12)",
  hardGlow: "rgba(255,255,255,0.02)",
  icon: "#FFFFFF",
  base: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.03)"],
  highlight: [
    "rgba(255,255,255,0.16)",
    "rgba(255,255,255,0.05)",
    "rgba(255,255,255,0)",
  ],
};

export function BackButton({
  onPress,
  iconSource,
  style,
  iconStyle,
  accessibilityLabel,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  // The round button wears the same surface as the nav bar and the cards, so
  // a screen reads as one set of objects: the card fill, the card hairline,
  // the card's icon colour.
  const glass = useMemo(() => {
    const base = theme.content.scheme === "dark" ? DARK_GLASS : LIGHT_GLASS;
    const surface = theme.colors.homeButtonBackground || theme.colors.card;
    const border =
      theme.colors.homeButtonBorder &&
      theme.colors.homeButtonBorder !== "transparent"
        ? theme.colors.homeButtonBorder
        : theme.colors.border;
    // The home surface is white-on-glass with a white glyph — right over the
    // home gradient, invisible on an inner page, where the same surface
    // flattens to near-white. There the button keeps its own light glass.
    const washedOut =
      theme.content.scheme !== "dark" &&
      isLightColor(surface, theme.colors.background) &&
      isLightColor(theme.colors.homeButtonText || base.icon);
    if (washedOut) {
      // Exactly the button that was here before: frosted white, its own soft
      // hairline, navy glyph. No new ring around it.
      return base;
    }
    return {
      ...base,
      bg: surface,
      border,
      icon: theme.colors.homeButtonText || base.icon,
    };
  }, [theme]);
  const styles = useMemo(() => createStyles(glass), [glass]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.backButton, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || t("a11y.back")}
    >
      {/* No glass layers any more: the button is the same flat card surface
          the nav bar and the cards use, with the same hairline. Stacked
          gradients on top made it a third material on the screen. */}
      <Image style={[styles.backIcon, iconStyle]} source={iconSource} />
    </TouchableOpacity>
  );
}
