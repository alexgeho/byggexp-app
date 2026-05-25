import React from "react";

import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./BottomBar.styles";
import {
  FooterHomeIcon,
  FooterMenuIcon,
} from "./BottomBarIcons";

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
          <FooterHomeIcon
            size={styles.navIcon.width}
            color={theme.colors.icon}
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
          <FooterMenuIcon
            size={styles.navIcon.width}
            color={theme.colors.icon}
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