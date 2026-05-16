import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { styles } from "./mainActionButtons.styles";

export function MainActionButtons() {
  return (
    <View style={styles.mainActionButtons}>
      <TouchableOpacity style={styles.actionButton}>
        <Image
          source={require("../../../assets/HomeScreen2/iconAction.png")}
          style={styles.iconAction}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButtonCamera}>
        <Image
          source={require("../../../assets/HomeScreen2/CircleCamera.png")}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
}
