import React from "react";

import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";

import { styles } from "./mainActionButtons.styles";

export function MainActionButtons({
  isRunning,
  isPaused,
  loading,
  onPlayPress,
  onCameraPress,
  compact = false,
  veryCompact = false,
}) {
  const actionButtonSize = veryCompact
    ? 96
    : compact
      ? 108
      : 124;
  const iconActionSize = veryCompact
    ? 32
    : compact
      ? 36
      : 40;
  const secondaryButtonSize = veryCompact
    ? 96
    : compact
      ? 108
      : 124;
  const buttonsGap = veryCompact
    ? 20
    : compact
      ? 26
      : 35;

  return (
    <View
      style={[
        styles.mainActionButtons,
        { gap: buttonsGap },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            width: actionButtonSize,
            height: actionButtonSize,
          },
          isPaused &&
            styles.actionButtonPaused,
        ]}
        onPress={onPlayPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            color="#2F80ED"
          />
        ) : (
          <Image
            style={[
              styles.iconAction,
              {
                width: iconActionSize,
                height: iconActionSize,
              },
            ]}
            source={
              isRunning
                ? require("../../../assets/HomeScreen2/Pause.png")
                : require("../../../assets/HomeScreen2/Play.png")
            }
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButtonCamera,
          {
            width: secondaryButtonSize,
            height: secondaryButtonSize,
          },
        ]}
        onPress={onCameraPress}
      >
        <Image
          source={require("../../../assets/HomeScreen2/CircleCamera.png")}
          style={[
            styles.icon,
            {
              width: secondaryButtonSize,
              height: secondaryButtonSize,
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}