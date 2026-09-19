import React, { useMemo, useRef, useState } from "react";
import { View, PanResponder, StyleSheet } from "react-native";

// Custom radius slider. Built on PanResponder so it claims the touch on
// touch-down (onStartShouldSetPanResponder + termination-request:false), which
// stops the enclosing vertical ScrollView from stealing the horizontal drag on
// Android — the exact problem @react-native-community/slider has here. The thumb
// is a plain View, so its size and its even (all-around) shadow are fully under
// our control.
export function RadiusSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onSlidingStart,
  onSlidingComplete,
  minTrackColor = "#3183ff",
  maxTrackColor = "rgba(5,45,80,0.22)",
  thumbSize = 44,
  trackHeight = 6,
}) {
  const [trackW, setTrackW] = useState(0);
  const trackWRef = useRef(0);
  trackWRef.current = trackW;

  const clampToStep = (v) => {
    const stepped = Math.round((v - min) / step) * step + min;
    return Math.max(min, Math.min(max, stepped));
  };

  const valueFromX = (x) => {
    const w = trackWRef.current;
    if (w <= 0) return value;
    const ratio = Math.max(0, Math.min(1, x / w));
    return clampToStep(min + ratio * (max - min));
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        // Never let a parent (ScrollView) take the gesture back mid-drag.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          onSlidingStart?.();
          onChange?.(valueFromX(e.nativeEvent.locationX));
        },
        onPanResponderMove: (e) => {
          onChange?.(valueFromX(e.nativeEvent.locationX));
        },
        onPanResponderRelease: () => onSlidingComplete?.(),
        onPanResponderTerminate: () => onSlidingComplete?.(),
      }),
    // Handlers read the latest value via refs/closures created each render; the
    // ref keeps trackW current, and value/callbacks are stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step],
  );

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const fillW = trackW * ratio;
  const thumbLeft = fillW - thumbSize / 2;

  return (
    <View style={[styles.hitArea, { height: thumbSize }]} {...pan.panHandlers}>
      <View
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        style={[
          styles.track,
          {
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: maxTrackColor,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: Math.max(0, fillW),
              borderRadius: trackHeight / 2,
              backgroundColor: minTrackColor,
            },
          ]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            left: Math.max(
              -thumbSize / 2,
              Math.min(trackW - thumbSize / 2, thumbLeft),
            ),
            top: (thumbSize - thumbSize) / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    width: "100%",
    justifyContent: "center",
  },
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  thumb: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    // Even shadow all around the knob (offset 0,0).
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default RadiusSlider;
