import React, { useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

// A scroll-snap wheel that keeps the exact look of the running timer — the same
// big Landasans digits — but they spin. The centred value is full opacity and
// the neighbours peek above/below (faded) so it clearly reads as scrollable.
// The wheel overflows its fixed one-row slot, so showing the peek never shifts
// the layout below (the round buttons stay put).

// The wheel goes round: after 59 comes 00 again (Alexander: "не крутить
// обратно, чтобы поставить ноль"). The values are laid out CYCLES times and
// the wheel starts in the middle lap; whenever it comes to rest it jumps,
// without animation, back to the same value in the middle lap, so there is
// always a full lap of room in either direction.
const CYCLES = 3;
const MIDDLE_LAP = Math.floor(CYCLES / 2);

function WheelColumn({
  values,
  selected,
  onSelect,
  textColor,
  fontSize,
  itemHeight,
  peek,
  letterSpacing,
}) {
  const lapLength = values.length;
  const rows = React.useMemo(
    () =>
      Array.from(
        { length: lapLength * CYCLES },
        (_, i) => values[i % lapLength],
      ),
    [values, lapLength],
  );
  const middleIndexOf = (value) =>
    MIDDLE_LAP * lapLength + Math.max(0, values.indexOf(value));

  const scrollRef = useRef(null);
  const scrollY = useRef(
    new Animated.Value(middleIndexOf(selected) * itemHeight),
  ).current;

  const commitFromOffset = (event, recentre = true) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(rows.length - 1, Math.round(y / itemHeight)),
    );
    const value = rows[index];
    // Back to the middle lap, same value — invisible, the digits are identical.
    const recentred = middleIndexOf(value);
    if (recentre && recentred !== index) {
      scrollRef.current?.scrollTo({
        y: recentred * itemHeight,
        animated: false,
      });
    }
    if (value !== selected) {
      onSelect(value);
    }
  };

  return (
    <View style={{ height: itemHeight + peek * 2, overflow: "hidden" }}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        contentOffset={{
          x: 0,
          y: middleIndexOf(selected) * itemHeight,
        }}
        contentContainerStyle={{ paddingVertical: peek }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={commitFromOffset}
        // A slow release may never start a momentum phase: take the value, but
        // leave the recentring to the momentum end so it can't cut a snap short.
        onScrollEndDrag={(event) => commitFromOffset(event, false)}
      >
        {rows.map((value, index) => {
          // Fade neighbours out to fully transparent by ±1.5 rows so the
          // peeking digits dissolve smoothly toward the edges (no hard cut).
          const opacity = scrollY.interpolate({
            inputRange: [
              (index - 1.5) * itemHeight,
              (index - 0.75) * itemHeight,
              index * itemHeight,
              (index + 0.75) * itemHeight,
              (index + 1.5) * itemHeight,
            ],
            outputRange: [0, 0.5, 1, 0.5, 0],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={index}
              style={[styles.itemRow, { height: itemHeight, opacity }]}
            >
              <Text
                style={[
                  styles.digit,
                  {
                    color: textColor,
                    fontSize,
                    lineHeight: itemHeight,
                    letterSpacing,
                  },
                ]}
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
  fontSize = 140,
  itemHeight = 132,
  peek = 26,
  letterSpacing = -2.5,
}) {
  return (
    <View style={styles.row} pointerEvents="box-none">
      <WheelColumn
        values={HOURS}
        selected={hours}
        onSelect={(h) => onChange(h, minutes)}
        textColor={textColor}
        fontSize={fontSize}
        itemHeight={itemHeight}
        peek={peek}
        letterSpacing={letterSpacing}
      />
      <WheelColumn
        values={MINUTES}
        selected={minutes}
        onSelect={(m) => onChange(hours, m)}
        textColor={textColor}
        fontSize={fontSize}
        itemHeight={itemHeight}
        peek={peek}
        letterSpacing={letterSpacing}
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
    justifyContent: "center",
    alignItems: "center",
  },
  digit: {
    fontFamily: "Landasans-Medium",
    letterSpacing: -2.5,
    includeFontPadding: false,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});

export default HoursWheelPicker;
