import React from "react";

import { SvgXml } from "react-native-svg";

import { buildLogoSvg } from "./logoSvg";

// Crisp vector BYGGEXP wordmark (the real Figma logo, a single path in a
// 94×12 viewBox) — replaces the old low-res logo-byggexp.png that pixelated when
// upscaled. `width` drives the size; height derives from the logo's aspect ratio.
// `color` recolours the mark so the same component works on light (blue) and
// dark/coloured (white) backgrounds. Sharp at any size; ships over OTA.
export const BYGGEXP_BLUE = "#0785F4";

const ASPECT = 12 / 94; // viewBox height / width

export function ByggExpWordmark({ width = 150, color = BYGGEXP_BLUE, style }) {
  return (
    <SvgXml
      xml={buildLogoSvg(color)}
      width={width}
      height={width * ASPECT}
      style={style}
    />
  );
}
