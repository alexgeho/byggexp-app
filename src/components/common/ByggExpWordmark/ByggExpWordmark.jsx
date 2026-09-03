import React from "react";

import { Text } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";

// Crisp text wordmark to replace the old low-res logo-byggexp.png (2 KB raster
// that pixelated when upscaled). Figma brand mark: "BYGGEXP", Montserrat
// SemiBold, colour #0785F4. Rendered here in the app's bundled bold font so it
// stays sharp at any size and ships over OTA (no new font/asset needed).
export const BYGGEXP_BLUE = "#0785F4";

export function ByggExpWordmark({ size = 34, color = BYGGEXP_BLUE, style }) {
  const { theme } = useTheme();

  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontFamily: theme.text.fontFamily.bold,
          fontSize: size,
          letterSpacing: -0.5,
          color,
        },
        style,
      ]}
    >
      BYGGEXP
    </Text>
  );
}
