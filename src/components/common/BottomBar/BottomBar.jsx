import React from "react";

import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./BottomBar.styles";

const DEFAULT_ACTION_ICON = require("../../../assets/plus.png");

export function BottomBar({
  onLeftPress,
  onRightPress,
  onActionPress,
  renderActionContent,
  onAddPress,
  showAddButton = true,
  renderAddContent,
  addDisabled = false,
  showBackground = true,
  showText = false,
}) {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  const handleActionPress =
    onActionPress ?? onAddPress;

  const actionContent =
    renderActionContent ?? renderAddContent;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.menuWrapper,
          !showBackground &&
            styles.menuWrapperTransparent,
        ]}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={onLeftPress}
        >
          <Image
            source={require("../../../assets/bottomBar/homeGray.png")}
            style={styles.navIcon}
          />

          {showText && (
            <Text
              style={[
                styles.navText,
                {
                  color: theme.colors.bottomNav,
                },
              ]}
            >
              Home
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={onRightPress}
        >
          <Image
            source={require("../../../assets/bottomBar/menuGray.png")}
            style={styles.navIcon}
          />

          {showText && (
            <Text
              style={[
                styles.navText,
                {
                  color: theme.colors.bottomNav,
                },
              ]}
            >
              Menu
            </Text>
          )}
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