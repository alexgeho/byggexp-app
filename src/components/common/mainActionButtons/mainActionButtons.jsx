import React from "react";

import { View, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";

import Svg, { Path, Rect } from "react-native-svg";

import { styles } from "./mainActionButtons.styles";

// Play / Pause drawn as vectors, not PNGs: an image is decoded after the
// button is already on screen (the pause one is 1000×1000), so the white
// circle stood empty for a moment. A vector is there in the same frame.
function PlayPauseGlyph({ running, size, color }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      opacity={0.85}
      testID={running ? "action-pause-glyph" : "action-play-glyph"}
    >
      {running ? (
        <>
          <Rect x="5" y="4" width="5" height="16" rx="1.6" fill={color} />
          <Rect x="14" y="4" width="5" height="16" rx="1.6" fill={color} />
        </>
      ) : (
        <Path
          d="M8.5 6 L18.5 12 L8.5 18 Z"
          fill={color}
          stroke={color}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

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
  // Optional coloured halo behind the play button (Figma dark home).
  actionButtonGlow,
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
            actionButtonGlow && {
              // Figma: drop-shadow 0 0 50px rgba(58,129,219,0.65).
              shadowColor: actionButtonGlow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.65,
              shadowRadius: 25,
              elevation: 16,
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
            <PlayPauseGlyph
              running={isRunning}
              size={iconActionSize}
              color={actionIconColor || "#2F80ED"}
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
