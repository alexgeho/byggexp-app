import React from "react";

import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigationState } from "@react-navigation/native";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./BottomBar.styles";
import {
  FooterHomeIcon,
  FooterMenuIcon,
} from "./BottomBarIcons";

const ACTIVE_ICON_COLOR = "#052D50";
const MENU_ROUTES = new Set([
  "Menu",
  "MyAccount",
  "NotificationsSettings",
  "Documents",
  "AboutApp",
  "HelpSupport",
  "LegalPolicies",
  "CustomizeHomeScreen",
]);

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
  const currentRouteName = useNavigationState(
    (state) => state.routes[state.index]?.name,
  );

  const styles = createStyles(theme);
  const isMenuActive = MENU_ROUTES.has(currentRouteName);
  const isHomeActive = !isMenuActive;

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
        <Pressable
          style={styles.navButton}
          onPress={onLeftPress}
        >
          {({ hovered, pressed }) => {
            const isActive = isHomeActive || hovered || pressed;
            const iconColor = isActive
              ? ACTIVE_ICON_COLOR
              : theme.colors.icon;

            return (
              <>
                <FooterHomeIcon
                  size={styles.navIcon.width}
                  color={iconColor}
                  filled={isActive}
                />

                {showText && (
                  <Text
                    style={[
                      styles.navText,
                      {
                        color: isActive
                          ? ACTIVE_ICON_COLOR
                          : theme.colors.bottomNav,
                      },
                    ]}
                  >
                    Home
                  </Text>
                )}
              </>
            );
          }}
        </Pressable>

        <Pressable
          style={styles.navButton}
          onPress={onRightPress}
        >
          {({ hovered, pressed }) => {
            const isActive = isMenuActive || hovered || pressed;
            const iconColor = isActive
              ? ACTIVE_ICON_COLOR
              : theme.colors.icon;

            return (
              <>
                <FooterMenuIcon
                  size={styles.navIcon.width}
                  color={iconColor}
                />

                {showText && (
                  <Text
                    style={[
                      styles.navText,
                      {
                        color: isActive
                          ? ACTIVE_ICON_COLOR
                          : theme.colors.bottomNav,
                      },
                    ]}
                  >
                    Menu
                  </Text>
                )}
              </>
            );
          }}
        </Pressable>
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