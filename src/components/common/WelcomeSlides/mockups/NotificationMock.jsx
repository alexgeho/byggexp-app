import React from "react";
import { Image, StyleSheet } from "react-native";

import { ONB } from "./assets";

// Task auto-reminders (admin 3 / worker 2): the real lock-screen screenshot —
// clock + two stacked BYGG EXP push reminders for the same task. Used as an
// image (per client): Swedish content is fine here. Explicit width+height so RN
// Image can't over-scale (aspectRatio alone left it unconstrained on device).
export function NotificationMock() {
  return (
    <Image source={ONB.tasksLock} style={styles.image} resizeMode="cover" />
  );
}

const styles = StyleSheet.create({
  image: {
    width: 301,
    height: 394,
    alignSelf: "center",
    borderRadius: 20,
  },
});
