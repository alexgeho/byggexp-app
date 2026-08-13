import React, { useRef, useState } from "react";

import {
  View,
  TextInput,
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
  // Secondary round action: "camera" | "hours" | "play".
  secondaryMode = "camera",
  todayHoursValue = "",
  onSaveTodayHours,
}) {
  const actionButtonSize = veryCompact ? 96 : compact ? 108 : 124;
  const iconActionSize = veryCompact ? 32 : compact ? 36 : 40;
  const secondaryButtonSize = veryCompact ? 96 : compact ? 108 : 124;
  const buttonsGap = veryCompact ? 20 : compact ? 26 : 35;

  // Hours secondary button: show a big centred pencil until tapped; tapping it
  // focuses the input (keyboard up) and reveals the centred number.
  const hoursInputRef = useRef(null);
  const [hoursText, setHoursText] = useState(todayHoursValue || "");
  const [hoursFocused, setHoursFocused] = useState(false);
  const showHoursPencil = !hoursText && !hoursFocused;

  return (
    <View style={[styles.mainActionButtons, { gap: buttonsGap }]}>
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
          isPaused && styles.actionButtonPaused,
        ]}
        onPress={onPlayPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={actionIconColor || "#2F80ED"} />
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

      {secondaryMode === "hours" ? (
        <View
          style={[
            styles.actionButtonCamera,
            { width: secondaryButtonSize, height: secondaryButtonSize },
            cameraButtonColor && { backgroundColor: cameraButtonColor },
            styles.actionButtonCameraThemed,
          ]}
        >
          <TextInput
            ref={hoursInputRef}
            style={[
              styles.hoursCircleInput,
              cameraIconColor && { color: cameraIconColor },
            ]}
            value={hoursText}
            onChangeText={setHoursText}
            keyboardType="numeric"
            returnKeyType="done"
            onFocus={function onFocus() {
              setHoursFocused(true);
            }}
            onBlur={function onBlur() {
              setHoursFocused(false);
              if (onSaveTodayHours) {
                onSaveTodayHours(hoursText);
              }
            }}
          />
          {showHoursPencil ? (
            <TouchableOpacity
              style={styles.hoursPencilOverlay}
              activeOpacity={0.8}
              onPress={function focusHours() {
                if (hoursInputRef.current) {
                  hoursInputRef.current.focus();
                }
              }}
            >
              <Icon
                name="edit-2"
                size={iconActionSize}
                color={cameraIconColor || "#FFFFFF"}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : secondaryMode === "play" ? (
        <TouchableOpacity
          style={[
            styles.actionButtonCamera,
            { width: secondaryButtonSize, height: secondaryButtonSize },
            cameraButtonColor && { backgroundColor: cameraButtonColor },
            styles.actionButtonCameraThemed,
          ]}
          onPress={onPlayPress}
        >
          <Icon
            name={isRunning ? "pause" : "play"}
            size={iconActionSize}
            color={cameraIconColor || "#FFFFFF"}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.actionButtonCamera,
            { width: secondaryButtonSize, height: secondaryButtonSize },
            cameraButtonColor && { backgroundColor: cameraButtonColor },
            (cameraButtonColor || cameraIconColor) &&
              styles.actionButtonCameraThemed,
          ]}
          onPress={onCameraPress}
        >
          {cameraIconColor ? (
            <Icon name="camera" size={iconActionSize} color={cameraIconColor} />
          ) : (
            <Image
              source={require("../../../assets/HomeScreen2/CircleCamera.png")}
              style={[
                styles.icon,
                { width: secondaryButtonSize, height: secondaryButtonSize },
              ]}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
