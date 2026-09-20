import React from "react";
import { Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import { createStyles } from "./HomeButtonInfoBadge.styles";

export default function HomeButtonInfoBadge({ label, variant }) {
  const { theme } = useTheme();
  const styles = createStyles(variant, theme.colors.infoBadgeAlpha);

  return (
    <View style={styles.badge}>
      <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
    </View>
  );
}
