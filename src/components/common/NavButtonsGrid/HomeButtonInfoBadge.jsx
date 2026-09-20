import React from "react";
import { Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import { createStyles } from "./HomeButtonInfoBadge.styles";

export default function HomeButtonInfoBadge({ label, variant, textColor }) {
  const { theme } = useTheme();
  const styles = createStyles(
    variant,
    theme.colors.infoBadgeAlpha,
    // A badge sits inside a card, so it speaks in the card's ink. The
    // colourful theme's cards carry their own colour and pass white.
    textColor || theme.colors.homeButtonText || theme.colors.text,
  );

  return (
    <View style={styles.badge}>
      <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
    </View>
  );
}
