import React from "react";

import { View, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";

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
  // Hours mode: the pencil opens the full-screen hours editor. While editing
  // the round button is hidden (the wheel + Done button are on the overlay).
  isEditingHours = false,
  onEnterEditHours,
}) {
  const { t } = useTranslation();
  const playLabel = isRunning
    ? t("a11y.pauseShift", { defaultValue: "Pause shift" })
    : t("a11y.startShift", { defaultValue: "Start shift" });
  const actionButtonSize = veryCompact ? 96 : compact ? 108 : 124;
  const iconActionSize = veryCompact ? 32 : compact ? 36 : 40;
  const secondaryButtonSize = veryCompact ? 96 : compact ? 108 : 124;
  const buttonsGap = veryCompact ? 20 : compact ? 26 : 35;

  return (
    <View style={[styles.mainActionButtons, { gap: buttonsGap }]}>
      {/* Play/Pause is hidden while entering hours — only the save button
          remains, centred by the row. */}
      {isEditingHours ? null : (
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
          accessibilityRole="button"
          accessibilityLabel={playLabel}
          accessibilityState={{ disabled: loading }}
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
      )}

      {secondaryMode === "hours" ? (
        // While editing, the wheel + "Done" button live in the full-screen
        // overlay, so the round button is hidden.
        isEditingHours ? null : (
          <TouchableOpacity
            style={[
              styles.actionButtonCamera,
              { width: secondaryButtonSize, height: secondaryButtonSize },
              cameraButtonColor && { backgroundColor: cameraButtonColor },
              styles.actionButtonCameraThemed,
            ]}
            activeOpacity={0.8}
            onPress={onEnterEditHours}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.logHours", {
              defaultValue: "Log hours",
            })}
          >
            <Icon
              name="edit-2"
              size={iconActionSize}
              color={cameraIconColor || "#FFFFFF"}
            />
          </TouchableOpacity>
        )
      ) : secondaryMode === "play" ? (
        <TouchableOpacity
          style={[
            styles.actionButtonCamera,
            { width: secondaryButtonSize, height: secondaryButtonSize },
            cameraButtonColor && { backgroundColor: cameraButtonColor },
            styles.actionButtonCameraThemed,
          ]}
          onPress={onPlayPress}
          accessibilityRole="button"
          accessibilityLabel={playLabel}
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
          accessibilityRole="button"
          accessibilityLabel={t("a11y.camera", { defaultValue: "Camera" })}
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
