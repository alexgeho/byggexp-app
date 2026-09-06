import React from "react";
import * as Feather from "react-native-feather";

// SVG Feather icons with a thin, iOS-like stroke (default 1.5 vs the font
// Feather's baked-in 2). Accepts the same kebab-case names as
// react-native-vector-icons/Feather (e.g. "chevron-right", "file-text").
const toPascal = (name) =>
  String(name)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

export function AppIcon({
  name,
  size = 24,
  color = "#007AFF",
  strokeWidth = 1.5,
  ...rest
}) {
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
