import React from "react";

import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { BlurView } from "expo-blur";
import { useNavigationState } from "@react-navigation/native";

import { useTheme } from "../../../theme/ThemeContext";

import { createStyles } from "./BottomBar.styles";
import { FooterHomeIcon, FooterMenuIcon } from "./BottomBarIcons";

const ACTIVE_ICON_COLOR = "#052D50";
const MENU_ROUTES = new Set([
  "Menu",
  "MyAccount",
  "NotificationsSettings",
  "Documents",
  "AboutApp",
  "HelpSupport",
  "ReportBug",
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
  glass = false,
}) {
  const { theme } = useTheme();
  const currentRouteName = useNavigationState(
    (state) => state.routes[state.index]?.name,
  );

  const styles = createStyles(theme);
  const isMenuActive = MENU_ROUTES.has(currentRouteName);
  const isHomeActive = !isMenuActive;

  const handleActionPress = onActionPress ?? onAddPress;

  const actionContent = renderActionContent ?? renderAddContent;

  // The pill is always a frosted-glass bar with a background blur — on the home
  // screen it sits over the blue gradient (subtle white glass), on inner
  // screens over the light background (crisp white border). Only the explicit
  // transparent variant (showBackground=false) stays a plain View.
  const isTransparent = !glass && !showBackground;
  let WrapperTag = BlurView;
  let wrapperProps;

  if (isTransparent) {
    WrapperTag = View;
    wrapperProps = {
      style: [styles.menuWrapper, styles.menuWrapperTransparent],
    };
  } else if (glass) {
    wrapperProps = {
      intensity: 45,
      tint: "light",
      style: [styles.menuWrapper, styles.menuWrapperGlass],
    };
  } else {
    // Inner screens: keep the 2px white border + white fill from menuWrapper,
    // now with a real background blur behind it.
    wrapperProps = {
      intensity: 40,
      tint: "light",
      style: styles.menuWrapper,
    };
  }

  return (
    <View style={styles.container}>
      <WrapperTag {...wrapperProps}>
        <Pressable style={styles.navButton} onPress={onLeftPress}>
          {({ hovered, pressed }) => {
            const isActive = isHomeActive || hovered || pressed;

            return (
              <>
                <FooterHomeIcon size={styles.navIcon.width} filled={isActive} />

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

        <Pressable style={styles.navButton} onPress={onRightPress}>
          {({ hovered, pressed }) => {
            const isActive = isMenuActive || hovered || pressed;

            return (
              <>
                <FooterMenuIcon size={styles.navIcon.width} filled={isActive} />

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
      </WrapperTag>

      {showAddButton && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
          disabled={addDisabled}
        >
          {actionContent ? (
            actionContent()
          ) : (
            <Icon name="plus" size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
