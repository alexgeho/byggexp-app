import React from "react";
import * as Feather from "react-native-feather";
import Svg, { Circle, Path, Rect } from "react-native-svg";

// SVG Feather icons with a thin, iOS-like stroke (default 1.5 vs the font
// Feather's baked-in 2). Accepts the same kebab-case names as
// react-native-vector-icons/Feather (e.g. "chevron-right", "file-text").
const toPascal = (name) =>
  String(name)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

// Glyphs Feather lacks, drawn on the same 24-grid with round caps so they sit
// next to Feather icons unnoticed. Pure SVG — no icon font to bundle.
const CUSTOM = {
  // Org.nummer — an ID card.
  "id-card": (
    <>
      <Rect x="2" y="5" width="20" height="14" rx="2" />
      <Circle cx="8" cy="11" r="2" />
      <Path d="M5 16c.6-1.5 1.7-2 3-2s2.4.5 3 2M14 10h5M14 14h3" />
    </>
  ),
  // Momsreg.nr — a receipt.
  receipt: (
    <>
      <Path d="M5 2h14v20l-2.33-1.5L14.33 22 12 20.5 9.67 22l-2.34-1.5L5 22z" />
      <Path d="M9 7h6M9 11h6M9 15h4" />
    </>
  ),
  // Bankgiro/Plusgiro — a bank.
  bank: (
    <>
      <Path d="M3 9l9-6 9 6M4 21h16M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 9h18" />
    </>
  ),
};

export function AppIcon({
  name,
  size = 24,
  color = "#007AFF",
  strokeWidth = 1.5,
  ...rest
}) {
  if (CUSTOM[name]) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {CUSTOM[name]}
      </Svg>
    );
  }
  const Cmp = Feather[toPascal(name)] || Feather.Circle;
  return (
    <Cmp
      width={size}
      height={size}
      stroke={color}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}

export default AppIcon;
