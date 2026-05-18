import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { styles } from "./projectSelector.styles";

function handleProjectPress() {
  navigation.navigate("Projects");
}

export function ProjectSelector2({ value, onPress, style }) {
  return (
    <TouchableOpacity
      style={styles.projectSelector}
      onPress={handleProjectPress()}
    >
      <Text style={styles.projectSelectorText}>
        {value?.name || "Select or create project"}
      </Text>
      <Image source={require("../../../assets/HomeScreen2/arrow-down.png")} />
    </TouchableOpacity>
  );
}
