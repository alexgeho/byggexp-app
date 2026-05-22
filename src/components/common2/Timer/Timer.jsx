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
  containerStyle,
  textStyle,
  secondsStyle,
}) {
  return (
    <View style={[styles.timer, containerStyle]}>
      <Text
        style={[styles.timerText, textStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {hours} {minutes}{" "}

        <Text
          style={[
            styles.timerTextSeconds,
            secondsStyle,
          ]}
        >
          {seconds}
        </Text>
      </Text>
    </View>
  );
}