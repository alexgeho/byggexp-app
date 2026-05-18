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
        style={[
          styles.actionButton,
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
            style={styles.iconAction}
            source={
              isRunning
                ? require("../../../assets/HomeScreen2/Pause.png")
                : require("../../../assets/HomeScreen2/Play.png")
            }
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