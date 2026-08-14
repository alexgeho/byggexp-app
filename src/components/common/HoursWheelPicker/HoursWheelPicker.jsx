import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";

// Scrollable hours/minutes wheel shown in place of the running timer while the
// worker logs the day's hours manually (mirrors the iOS Timers picker). On iOS
// this renders as a native wheel; Android shows a spinner and web a select.
const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59

export function HoursWheelPicker({
  hours,
  minutes,
  onChange,
  textColor = "#FFFFFF",
  labelColor = "rgba(255,255,255,0.7)",
}) {
  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <Picker
          selectedValue={hours}
          onValueChange={(value) => onChange(value, minutes)}
          style={styles.picker}
          itemStyle={[styles.item, { color: textColor }]}
          dropdownIconColor={textColor}
          mode="dropdown"
        >
          {HOURS.map((h) => (
            <Picker.Item
              key={h}
              label={String(h)}
              value={h}
              color={Platform.OS === "android" ? "#052d50" : textColor}
            />
          ))}
        </Picker>
        <Text style={[styles.unit, { color: labelColor }]}>h</Text>
      </View>

      <View style={styles.column}>
        <Picker
          selectedValue={minutes}
          onValueChange={(value) => onChange(hours, value)}
          style={styles.picker}
          itemStyle={[styles.item, { color: textColor }]}
          dropdownIconColor={textColor}
          mode="dropdown"
        >
          {MINUTES.map((m) => (
            <Picker.Item
              key={m}
              label={String(m).padStart(2, "0")}
              value={m}
              color={Platform.OS === "android" ? "#052d50" : textColor}
            />
          ))}
        </Picker>
        <Text style={[styles.unit, { color: labelColor }]}>min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  column: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  picker: {
    width: Platform.OS === "ios" ? 96 : 110,
    height: Platform.OS === "ios" ? 180 : 56,
  },
  item: {
    fontSize: 40,
    fontWeight: "700",
  },
  unit: {
    fontSize: 18,
    fontWeight: "500",
  },
});

export default HoursWheelPicker;
