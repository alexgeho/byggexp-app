import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import { createStyles } from "./BottomBar.styles";

const DEFAULT_ACTION_ICON = require("../assets/Plus.png");

export function BottomBar({
  onLeftPress,
  onRightPress,
  onActionPress,
  renderActionContent,
  onAddPress,
  showAddButton = true,
  renderAddContent,
  addDisabled = false,
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const handleActionPress = onActionPress ?? onAddPress;
  const actionContent = renderActionContent ?? renderAddContent;

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

      {showAddButton && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
          disabled={addDisabled}
        >
          {actionContent ? (
            actionContent()
          ) : (
            <Image
              source={DEFAULT_ACTION_ICON}
              style={styles.addIcon}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}