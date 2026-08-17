import React from "react";

import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

  // The pill is a frosted-glass bar: a background blur + a translucent white
  // fill as absolutely-positioned layers, then the icons on top. On the home
  // screen it sits over the blue gradient (subtle white glass); on inner
  // screens over the light background (crisp white border). Only the explicit
  // transparent variant (showBackground=false) drops the blur/fill.
  //
  // The icons must NEVER be children of the BlurView: Android's
  // dimezisBlurView blurs its children, which paints a soft dark halo/"glow"
  // around each icon (worst on the solid filled icon). Keeping them as later
  // siblings, above the blur, renders them crisp with no halo.
  const isTransparent = !glass && !showBackground;
  const dark = theme.content.scheme === "dark";
  // Android has no BlurView (it crashed Fabric), so the fill must carry the
  // whole look — make it much more opaque there than the iOS blur+fill.
  const isAndroid = Platform.OS === "android";
  const lightFill = glass
    ? isAndroid
      ? "rgba(255,255,255,0.72)"
      : "rgba(255,255,255,0.20)"
    : isAndroid
      ? "rgba(255,255,255,0.8)"
      : "rgba(255,255,255,0.6)";
  const darkFill = glass
    ? "rgba(30,30,30,0.55)"
    : isAndroid
      ? "rgba(35,35,35,0.94)"
      : "rgba(35,35,35,0.72)";
  const fillColor = isTransparent ? "transparent" : dark ? darkFill : lightFill;
  // Icons/text: keep the original (untinted) navy look in light themes; in dark
  // tint the icons light so they read on the dark pill.
  const activeIconColor = dark ? "#FFFFFF" : ACTIVE_ICON_COLOR;
  const iconColorFor = (isActive) =>
    dark ? (isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)") : undefined;
  const wrapperStyle = [
    styles.menuWrapper,
    isTransparent && styles.menuWrapperTransparent,
    glass && styles.menuWrapperGlass,
    dark && !isTransparent && styles.menuWrapperDark,
  ];

  return (
    <View style={styles.container}>
      <View style={wrapperStyle}>
        {!isTransparent && Platform.OS !== "android" ? (
          <BlurView
            pointerEvents="none"
            intensity={glass ? 45 : 40}
            tint={dark ? "dark" : "light"}
            // Android needs the native blur method or it renders no blur at all.
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: fillColor }]}
        />
        <Pressable style={styles.navButton} onPress={onLeftPress}>
          {({ hovered, pressed }) => {
            const isActive = isHomeActive || hovered || pressed;

            return (
              <>
                <FooterHomeIcon
                  size={styles.navIcon.width}
                  filled={isActive}
                  color={iconColorFor(isActive)}
                />

                {showText && (
                  <Text
                    style={[
                      styles.navText,
                      {
                        color: isActive
                          ? activeIconColor
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
                <FooterMenuIcon
                  size={styles.navIcon.width}
                  filled={isActive}
                  color={iconColorFor(isActive)}
                />

                {showText && (
                  <Text
                    style={[
                      styles.navText,
                      {
                        color: isActive
                          ? activeIconColor
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
            <Icon name="plus" size={33} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
