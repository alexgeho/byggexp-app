import React from "react";
import { View, Text } from "react-native";
import { styles } from "./Timer.styles";

export function Timer() {
  return (
    <View style={styles.timer}>
      <Text style={styles.timerText}>
        06 59 <Text style={styles.timerTextSeconds}>59</Text>
      </Text>
    </View>
  );
}
