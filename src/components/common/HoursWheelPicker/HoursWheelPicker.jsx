import React, { useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

// A scroll-snap wheel that keeps the exact look of the running timer — the same
// big Landasans digits — but they spin. The centred value is full opacity, the
// peeking neighbours fade out. Used in place of the clock while logging hours.
const ITEM_HEIGHT = 148;
const CONTAINER_HEIGHT = Math.round(ITEM_HEIGHT * 1.55); // center + peeking rows
const PAD = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

function WheelColumn({ values, selected, onSelect, textColor, fontSize }) {
  const scrollY = useRef(
    new Animated.Value(Math.max(0, values.indexOf(selected)) * ITEM_HEIGHT),
  ).current;

  const handleMomentumEnd = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, index));
    if (values[clamped] !== selected) {
      onSelect(values[clamped]);
    }
  };

  return (
    <View style={{ height: CONTAINER_HEIGHT, overflow: "hidden" }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{
          x: 0,
          y: Math.max(0, values.indexOf(selected)) * ITEM_HEIGHT,
        }}
        contentContainerStyle={{ paddingVertical: PAD }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {values.map((value, index) => {
          const opacity = scrollY.interpolate({
            inputRange: [
              (index - 2) * ITEM_HEIGHT,
              (index - 1) * ITEM_HEIGHT,
              index * ITEM_HEIGHT,
              (index + 1) * ITEM_HEIGHT,
              (index + 2) * ITEM_HEIGHT,
            ],
            outputRange: [0.12, 0.35, 1, 0.35, 0.12],
            extrapolate: "clamp",
          });
          return (
            <Animated.View key={value} style={[styles.itemRow, { opacity }]}>
              <Text
                style={[styles.digit, { color: textColor, fontSize }]}
                numberOfLines={1}
              >
                {String(value).padStart(2, "0")}
              </Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59

export function HoursWheelPicker({
  hours,
  minutes,
  onChange,
  textColor = "#FFFFFF",
  fontSize = 96,
}) {
  return (
    <View style={styles.row}>
      <WheelColumn
        values={HOURS}
        selected={hours}
        onSelect={(h) => onChange(h, minutes)}
        textColor={textColor}
        fontSize={fontSize}
      />
      <WheelColumn
        values={MINUTES}
        selected={minutes}
        onSelect={(m) => onChange(hours, m)}
        textColor={textColor}
        fontSize={fontSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  itemRow: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  digit: {
    fontFamily: "Landasans-Medium",
    lineHeight: ITEM_HEIGHT,
    letterSpacing: -2.5,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
  },
});

export default HoursWheelPicker;
