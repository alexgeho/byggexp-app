import React, { useState } from "react";

import { View, Text, StyleSheet } from "react-native";

import { styles } from "./Timer.styles";

// Each digit sits in a fixed-width cell (a fraction of the font size) and each
// HH/MM/SS group is separated by a fixed gap. This makes the clock strictly
// monospaced regardless of the custom font's per-glyph advance, so the layout
// never shifts as the digits tick — the old single-Text + adjustsFontSizeToFit
// approach re-measured every second and jumped on narrow screens (e.g. 13 mini).
const DIGIT_RATIO = 0.62; // cell width ÷ font size
const GAP_RATIO = 0.4; // gap between groups ÷ font size
// 6 digit cells + 2 inter-group gaps, expressed in font-size units.
const WIDTH_UNITS = 6 * DIGIT_RATIO + 2 * GAP_RATIO;

export function Timer({
  hours,
  minutes,
  seconds,
  containerStyle,
  textStyle,
  secondsStyle,
}) {
  const [availableWidth, setAvailableWidth] = useState(0);

  const flat = StyleSheet.flatten([styles.timerText, textStyle]) || {};
  const maxFontSize = flat.fontSize || 140;
  const lineHeightRatio =
    flat.fontSize && flat.lineHeight ? flat.lineHeight / flat.fontSize : 0.94;

  // Shrink to fit the measured width, but never grow past the design size.
  const fitFontSize =
    availableWidth > 0 ? availableWidth / WIDTH_UNITS : maxFontSize;
  const fontSize = Math.min(maxFontSize, fitFontSize);
  const cellWidth = fontSize * DIGIT_RATIO;
  const gapWidth = fontSize * GAP_RATIO;

  const digitBase = [
    styles.timerText,
    textStyle,
    {
      fontSize,
      lineHeight: fontSize * lineHeightRatio,
      width: cellWidth,
      textAlign: "center",
      letterSpacing: 0,
    },
  ];

  const renderGroup = (value, extraStyle) =>
    String(value)
      .split("")
      .map((char, index) => (
        <Text
          key={index}
          allowFontScaling={false}
          style={[digitBase, extraStyle]}
        >
          {char}
        </Text>
      ));

  return (
    <View
      style={[styles.timer, containerStyle]}
      onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}
    >
      <View style={styles.row}>
        {renderGroup(hours)}
        <View style={{ width: gapWidth }} />
        {renderGroup(minutes)}
        <View style={{ width: gapWidth }} />
        {renderGroup(seconds, [styles.timerTextSeconds, secondsStyle])}
      </View>
    </View>
  );
}
