import React from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import {
  successPopupIconBackground,
  successPopupIconColor,
} from "../../../theme/settings";

export function SuccessPopupIcon({ size = 28, style }) {
  return (
    <View style={[styles.iconWrap, style]}>
      <Icon name="check" size={size} color={successPopupIconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: successPopupIconBackground,
  },
});
