import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import { createStyles } from "./BottomBar.styles";

export function BottomBar() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
  <View style={styles.container}>
    <View style={styles.menuWrapper}></View>
  </View>
  )
}
