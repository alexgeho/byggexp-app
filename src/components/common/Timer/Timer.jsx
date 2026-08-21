import React, { useState } from "react";

import { View, Text } from "react-native";

import { styles } from "./Timer.styles";

const DESIGN_FONT_SIZE = 140;
// Widest possible value: all zeros (the custom font's "0" is wider than its
// other digits). If this fits, every other value fits too.
const REFERENCE = "00 00 00";

export function Timer({
  hours,
  minutes,
  seconds,
  containerStyle,
  textStyle,
  secondsStyle,
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [referenceWidth, setReferenceWidth] = useState(0);

  // Scale the design font size down just enough to fit the widest value, using
  // one-time measurements. The result depends only on the fixed reference and
  // the container width, so it never changes as the clock ticks. (The old
  // adjustsFontSizeToFit re-measured every second and — because the digits
  // aren't equal width — resized and re-centred the clock each tick, which
  // made it visibly jump, especially on narrow screens.)
  const fontSize =
    containerWidth > 0 && referenceWidth > 0
      ? Math.min(
          DESIGN_FONT_SIZE,
          (DESIGN_FONT_SIZE * containerWidth) / referenceWidth,
        )
      : DESIGN_FONT_SIZE;

  return (
    <View
      style={[styles.timer, containerStyle]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {/* Invisible probe: measures the widest value at the design size once. */}
      <Text
        style={[styles.timerText, textStyle, styles.measure]}
        numberOfLines={1}
        onLayout={(event) => setReferenceWidth(event.nativeEvent.layout.width)}
      >
        {REFERENCE}
      </Text>

      <Text
        style={[styles.timerText, textStyle, { fontSize }]}
        numberOfLines={1}
      >
        {hours} {minutes}{" "}
        <Text style={[styles.timerTextSeconds, secondsStyle]}>{seconds}</Text>
      </Text>
    </View>
  );
}
