import React from "react";

import { View, Text } from "react-native";

import { useTimer } from "../../../hooks/useTimer";

import { styles } from "./Timer.styles";

export function Timer() {
  const { formattedTime } = useTimer();

  return (
    <View style={styles.timer}>
      <Text style={styles.timerText}>
        {formattedTime.hours} {formattedTime.minutes}{" "}
        <Text style={styles.timerTextSeconds}>
          {formattedTime.seconds}
        </Text>
      </Text>
    </View>
  );
}