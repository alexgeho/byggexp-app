import React from "react";

import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./PlayButton.styles";

export default function PlayButton({
  isRunning,
  isPaused,
  loading,
  onPress,
}) {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View style={styles.playButtonContainer}>
      <TouchableOpacity
        style={[
          styles.playButton,
          isPaused &&
            styles.playButtonPaused,
        ]}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            color="#ffffff"
          />
        ) : (
          <Image
            style={styles.playIcon}
            source={
              isRunning
                ? require("../../../assets/main/Pause.png")
                : require("../../../assets/main/Play.png")
            }
          />
        )}
      </TouchableOpacity>
    </View>
  );
}