import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// Bottom sheets open softly: the Modal fades the dimmed backdrop in
// (animationType="fade") while the sheet itself glides up from below with an
// ease-out, instead of the whole screen — backdrop included — sliding in.
// Returns the style for the sheet's Animated.View.
export default function useSheetEnter(visible, distance = 360) {
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }
    translateY.setValue(distance);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, distance, translateY]);

  return { transform: [{ translateY }] };
}
