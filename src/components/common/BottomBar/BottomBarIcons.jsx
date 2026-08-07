import React from "react";
import { Image } from "react-native";

const homeOutlineIcon = require("../../../assets/navigation/home-outline.png");
const homeFilledIcon = require("../../../assets/navigation/home-filled.png");
const menuOutlineIcon = require("../../../assets/navigation/menu-outline.png");
const menuFilledIcon = require("../../../assets/navigation/menu-filled.png");

// Blue glow token from the Figma design system (glow: '#3A81DB'). The pill
// icons carry a soft blue halo — brighter on the active tab. boxShadow is used
// so the glow renders on both iOS and Android (RN 0.81+).
const GLOW_COLOR = "58, 129, 219";
const glowStyle = (filled) => ({
  boxShadow: `0px 0px ${filled ? 10 : 6}px rgba(${GLOW_COLOR}, ${
    filled ? 0.9 : 0.55
  })`,
});

export function FooterHomeIcon({ size = 24, filled = false }) {
  return (
    <Image
      source={filled ? homeFilledIcon : homeOutlineIcon}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
        ...glowStyle(filled),
      }}
    />
  );
}

export function FooterMenuIcon({ size = 24, filled = false }) {
  return (
    <Image
      source={filled ? menuFilledIcon : menuOutlineIcon}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
        ...glowStyle(filled),
      }}
    />
  );
}
