import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export function FooterHomeIcon({
  size = 30,
  color = "#20384D",
  filled = false,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.75 10.25L12 4.75L19.25 10.25V18C19.25 18.69 18.69 19.25 18 19.25H6C5.31 19.25 4.75 18.69 4.75 18V10.25Z"
        stroke={color}
        fill={filled ? color : "none"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 19.25V14.75C9.5 14.34 9.84 14 10.25 14H13.75C14.16 14 14.5 14.34 14.5 14.75V19.25"
        stroke={filled ? "#FFFFFF" : color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FooterMenuIcon({
  size = 30,
  color = "#20384D",
}) {
  const radius = 3;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r={radius} fill={color} />
      <Circle cx="16" cy="8" r={radius} fill={color} />
      <Circle cx="8" cy="16" r={radius} fill={color} />
      <Circle cx="16" cy="16" r={radius} fill={color} />
    </Svg>
  );
}
