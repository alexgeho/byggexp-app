import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import { createStyles } from "./BottomBar.styles";

export function BottomBar({
  onLeftPress,
  onRightPress,
  onActionPress,
  renderActionContent,
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.menuWrapper}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={onLeftPress}
        >
          <Image
            source={require("../assets/bottomBar/HomeGray.png")}
            style={styles.navIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={onRightPress}
        >
          <Image
            source={require("../assets/bottomBar/MenuGray.png")}
            style={styles.navIcon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onActionPress}
      >
        {renderActionContent ? (
          renderActionContent()
        ) : (
          <Image
            style={styles.addIcon}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}