import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { styles } from "./projectSelector.styles";

export function ProjectSelector2({
  value,
  onPress,
  style,
  textStyle,
  iconStyle,
}) {
  return (
    <TouchableOpacity
      style={[styles.projectSelector, style]}
      onPress={onPress}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.projectSelectorText, textStyle]}
      >
        {value?.name || "Select or create project"}
      </Text>
      <Image
        source={require("../../../assets/HomeScreen2/arrow-down.png")}
        style={iconStyle}
      />
    </TouchableOpacity>
  );
}
