import React, { useState } from "react";

import { View, Text, StyleSheet } from "react-native";

import { styles } from "./Timer.styles";

// Gap between the HH / MM / SS groups, as a fraction of the font size. Both
// gaps use this exact value, so the three groups are always evenly spaced.
// Figma separates the groups with a colon: the empty space either side of it
// is ~0.09em, so the colon-less gap that reads the same is ~0.18em (matching
// the design's spacing without the colon glyph).
const GROUP_GAP_RATIO = 0.18;

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function Timer({
  hours,
  minutes,
  seconds,
  containerStyle,
  textStyle,
  secondsStyle,
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  // Rendered width of every digit at the max font size. A group cell is sized
  // to the widest digit so any two-digit value fits — the custom font's "0" is
  // NOT the widest glyph, so sizing cells to "00" clipped values like "58".
  const [digitWidths, setDigitWidths] = useState({});

  // The design font size (140 by default, or whatever the caller overrides via
  // textStyle — e.g. the compact home layout). Everything scales relative to it.
  const flat = StyleSheet.flatten([styles.timerText, textStyle]) || {};
  const maxFontSize = flat.fontSize || 140;

  const measured = DIGITS.every((d) => digitWidths[d] > 0);
  const maxDigitWidth = measured
    ? Math.max(...DIGITS.map((d) => digitWidths[d]))
    : 0;

  // Each group sits in a fixed-width cell wide enough for the two widest digits,
  // so the layout is identical no matter which digits show — the clock never
  // resizes or shifts as it ticks. The font size is derived once from the
  // container width so the whole row fits; it depends only on fixed
  // measurements, not on the current time, so it stays constant every second.
  const groupRatio =
    maxDigitWidth > 0 ? (2 * maxDigitWidth) / maxFontSize : 1.2;
  const widthUnits = 3 * groupRatio + 2 * GROUP_GAP_RATIO;
  const fontSize =
    containerWidth > 0
      ? Math.min(maxFontSize, containerWidth / widthUnits)
      : maxFontSize;
  const cellWidth = fontSize * groupRatio;
  const gapWidth = fontSize * GROUP_GAP_RATIO;

  // lineHeight === fontSize makes each digit's line box hug the glyph, so the
  // clock has no phantom vertical padding — its height is exactly the digits,
  // which keeps the vertical spacing to the buttons below predictable/even.
  const cell = {
    fontSize,
    lineHeight: fontSize,
    width: cellWidth,
    textAlign: "center",
  };

  return (
    <View
      style={[styles.timer, containerStyle]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {/* Invisible probes: measure each digit's width at the max size once. */}
      <View style={styles.measure} pointerEvents="none">
        {DIGITS.map((d) => (
          <Text
            key={d}
            style={[styles.timerText, textStyle]}
            numberOfLines={1}
            onLayout={(event) =>
              setDigitWidths((prev) =>
                prev[d] === event.nativeEvent.layout.width
                  ? prev
                  : { ...prev, [d]: event.nativeEvent.layout.width },
              )
            }
          >
            {d}
          </Text>
        ))}
      </View>

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
