import React from "react";

import {
  View,
  Text,
} from "react-native";

import { styles } from "./Timer.styles";

export function Timer({
  hours,
  minutes,
  seconds,
}) {
  return (
    <View style={styles.timer}>
      <Text style={styles.timerText}>
        {hours} {minutes}{" "}

        <Text
          style={
            styles.timerTextSeconds
          }
        >
          {seconds}
        </Text>
      </Text>
    </View>
  );
}