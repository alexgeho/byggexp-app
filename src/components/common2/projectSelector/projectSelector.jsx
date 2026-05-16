import React from "react";
import { View, Text, Image } from "react-native";
import { styles } from "./projectSelector.styles";

export function ProjectSelector() {
  return (
    <View style={styles.projectSelector}>
      <Text style={styles.projectSelectorText}>
        Gruvrisvägen 70, 791 61 Falun
      </Text>
      <Image source={require("../../../assets/HomeScreen2/arrow-down.png")} />
    </View>
  );
}
