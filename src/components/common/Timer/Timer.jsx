import React, { useState } from "react";

import { View, Text } from "react-native";

import { styles } from "./Timer.styles";

const DESIGN_FONT_SIZE = 140;
// Gap between the HH / MM / SS groups, as a fraction of the font size. Both
// gaps use this exact value, so the three groups are always evenly spaced.
const GROUP_GAP_RATIO = 0.3;

export function Timer({
  hours,
  minutes,
  seconds,
  containerStyle,
  textStyle,
  secondsStyle,
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  // Width of the widest 2-digit group ("00") measured at the design size.
  const [groupWidth, setGroupWidth] = useState(0);

  // Each group sits in a fixed-width cell (as wide as "00"), so the layout is
  // identical no matter which digits show — the clock never resizes or shifts
  // as it ticks. The font size is derived once from the container width so the
  // whole row fits; it depends only on fixed measurements, not on the current
  // time, so it stays constant every second. (The old adjustsFontSizeToFit
  // re-fit each tick and jumped because the custom font's digits differ in
  // width and it doesn't honour tabular-nums.)
  const groupRatio = groupWidth > 0 ? groupWidth / DESIGN_FONT_SIZE : 1.2;
  const widthUnits = 3 * groupRatio + 2 * GROUP_GAP_RATIO;
  const fontSize =
    containerWidth > 0
      ? Math.min(DESIGN_FONT_SIZE, containerWidth / widthUnits)
      : DESIGN_FONT_SIZE;
  const cellWidth = fontSize * groupRatio;
  const gapWidth = fontSize * GROUP_GAP_RATIO;

  const cell = { fontSize, width: cellWidth, textAlign: "center" };

  return (
    <View
      style={[styles.timer, containerStyle]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {/* Invisible probe: measures the widest group at the design size once. */}
      <Text
        style={[styles.timerText, textStyle, styles.measure]}
        numberOfLines={1}
        onLayout={(event) => setGroupWidth(event.nativeEvent.layout.width)}
      >
        00
      </Text>

      <View style={styles.row}>
        <Text style={[styles.timerText, textStyle, cell]} numberOfLines={1}>
          {hours}
        </Text>
        <View style={{ width: gapWidth }} />
        <Text style={[styles.timerText, textStyle, cell]} numberOfLines={1}>
          {minutes}
        </Text>
        <View style={{ width: gapWidth }} />
        <Text
          style={[
            styles.timerText,
            textStyle,
            styles.timerTextSeconds,
            secondsStyle,
            cell,
          ]}
          numberOfLines={1}
        >
          {seconds}
        </Text>
      </View>
    </View>
  );
}
