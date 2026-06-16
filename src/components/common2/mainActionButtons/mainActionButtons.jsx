import React from "react";

import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

import { styles } from "./mainActionButtons.styles";

export function MainActionButtons({
  isRunning,
  isPaused,
  loading,
  onPlayPress,
  onCameraPress,
  compact = false,
  veryCompact = false,
  actionButtonColor,
  actionIconColor,
  cameraButtonColor,
  cameraIconColor,
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
          actionButtonColor && {
            backgroundColor: actionButtonColor,
          },
          isPaused &&
            styles.actionButtonPaused,
        ]}
        onPress={onPlayPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            color={actionIconColor || "#2F80ED"}
          />
        ) : (
          <Image
            style={[
              styles.iconAction,
              {
                width: iconActionSize,
                height: iconActionSize,
              },
              actionIconColor && {
                tintColor: actionIconColor,
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
          cameraButtonColor && {
            backgroundColor: cameraButtonColor,
          },
          cameraButtonColor &&
            styles.actionButtonCameraThemed,
        ]}
        onPress={onCameraPress}
      >
        {cameraIconColor ? (
          <Icon
            name="camera"
            size={iconActionSize}
            color={cameraIconColor}
          />
        ) : (
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
        )}
      </TouchableOpacity>
    </View>
  );
}