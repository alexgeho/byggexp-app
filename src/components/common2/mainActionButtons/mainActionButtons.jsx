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
}) {
  return (
    <View style={styles.mainActionButtons}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPlayPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#3B82F6" />
        ) : (
          <Image
            source={
              isRunning
                ? require("../../../assets/HomeScreen2/iconPause.png")
                : require("../../../assets/HomeScreen2/iconAction.png")
            }
            style={styles.iconAction}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButtonCamera}
        onPress={onCameraPress}
      >
        <Image
          source={require("../../../assets/HomeScreen2/CircleCamera.png")}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
}