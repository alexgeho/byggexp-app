import React from "react";

import { View } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./TimerProgress.styles";

export default function TimerProgress({
  progress,
}) {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: 8 }).map(
        function renderDot(_, index) {
          const isActive =
            index < progress;

          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />
          );
        },
      )}
    </View>
  );
}