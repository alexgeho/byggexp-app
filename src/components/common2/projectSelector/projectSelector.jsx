import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { styles } from "./projectSelector.styles";

export function ProjectSelector2({ value, onPress, style }) {
  return (
    <TouchableOpacity style={styles.projectSelector} onPress={onPress}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.projectSelectorText}
      >
        {value?.name || "Select or create project"}
      </Text>
      <Image source={require("../../../assets/HomeScreen2/arrow-down.png")} />
    </TouchableOpacity>
  );
}
