import React from "react";

import {
  View,
  Text,
} from "react-native";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./TimerDisplay.styles";

export default function TimerDisplay({
  hours,
  minutes,
  seconds,
}) {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.time}>
        {hours}
      </Text>

      <Text style={styles.separator}>
        :
      </Text>

      <Text style={styles.time}>
        {minutes}
      </Text>

      <Text style={styles.separator}>
        :
      </Text>

      <Text style={styles.seconds}>
        {seconds}
      </Text>
    </View>
  );
}