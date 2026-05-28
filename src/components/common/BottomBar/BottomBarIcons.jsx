import React from "react";
import { Image } from "react-native";

const homeOutlineIcon = require("../../../assets/navigation/home-outline.png");
const homeFilledIcon = require("../../../assets/navigation/home-filled.png");
const menuOutlineIcon = require("../../../assets/navigation/menu-outline.png");
const menuFilledIcon = require("../../../assets/navigation/menu-filled.png");

export function FooterHomeIcon({
  size = 24,
  filled = false,
}) {
  return (
    <Image
      source={filled ? homeFilledIcon : homeOutlineIcon}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
      }}
    />
  );
}

export function FooterMenuIcon({
  size = 24,
  filled = false,
}) {
  return (
    <Image
      source={filled ? menuFilledIcon : menuOutlineIcon}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
      }}
    />
  );
}
