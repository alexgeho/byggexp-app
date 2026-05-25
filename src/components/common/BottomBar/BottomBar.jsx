import React from "react";

import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./BottomBar.styles";

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
            source={require("../../../assets/footer-home.png")}
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
            source={require("../../../assets/footer-menu.png")}
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
            <Icon
              name="plus"
              size={20}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}