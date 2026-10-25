import React from "react";
import { Animated, Pressable } from "react-native";
import useSheetEnter from "../../../hooks/useSheetEnter";

// The sheet part of a bottom-sheet Modal. Pair with animationType="fade": the
// dimmed backdrop fades in while this glides up. A Modal mounts its children
// only while visible, so the glide runs on every open.
export function SheetView({ style, ...rest }) {
  const enter = useSheetEnter(true);
  return <Animated.View style={[style, enter]} {...rest} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// For sheets that are a Pressable (to swallow taps so they don't reach the
// backdrop behind).
export function SheetPressable({ style, ...rest }) {
  const enter = useSheetEnter(true);
  return <AnimatedPressable style={[style, enter]} {...rest} />;
}
