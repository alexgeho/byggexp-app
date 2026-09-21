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
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigationState } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import {
  flattenColor,
  hexToRgba,
  isLightColor,
} from "../../../theme/colorUtils";

import { createStyles } from "./BottomBar.styles";
import { FooterHomeIcon, FooterMenuIcon } from "./BottomBarIcons";

const ACTIVE_ICON_COLOR = "#052D50";

// Glass pill layers matching the round back button: a base sheen, a top
// highlight and a thin inner ring, in light and dark palettes.
const PILL_GLASS = {
  light: {
    base: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.10)"],
    highlight: [
      "rgba(255,255,255,0.85)",
      "rgba(255,255,255,0.12)",
      "rgba(255,255,255,0)",
    ],
    ring: "rgba(255,255,255,0.35)",
  },
  dark: {
    // Very subtle on the wide pill — a strong highlight/ring reads as grey
    // stripes across the top and sides, so keep only a faint top sheen.
    base: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.015)"],
    highlight: [
      "rgba(255,255,255,0.05)",
      "rgba(255,255,255,0.015)",
      "rgba(255,255,255,0)",
    ],
    ring: "transparent",
  },
};
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
  addAccessibilityLabel,
  // Force the dark treatment (dark pill + white icons) regardless of the
  // content scheme. The home screen passes this for its dark-appearance themes
  // (blue/black) so the nav icons read white, matching the card icons.
  darkOverride,
  // Explicit tint for the nav icons, independent of the pill's light/dark look.
  // The home screen passes the same colour it uses for its card icons so the
  // nav icons match them (e.g. white over the blue gradient, while the pill
  // stays a light frosted glass). Inactive icons use it at reduced opacity.
  iconColor,
  // Flat pill fill, no blur and no glass layers — the home screen passes the
  // same surface its cards use, so the bar is one of them rather than a
  // frosted sheet floating over the screen. When set it overrides the
  // frosted-glass / white-fill treatment.
  pillColor,
  // Hairline around that flat pill; again the cards' own border. Without it
  // the pill has no edge at all.
  pillBorderColor,
  // The cards' corner glow (dark theme). Passed so the bar is the same object
  // as the buttons above it, down to the light in its corner.
  pillGlowColor,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const currentRouteName = useNavigationState(
    (state) => state.routes[state.index]?.name,
  );

  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  // Lift the pill above the Android system navigation bar. A 3-button nav bar
  // (insets.bottom ~48) otherwise collides with the pill; gesture nav has a
  // small inset. iOS is left at its original 30 (unchanged).
  const bottomOffset = Platform.OS === "android" ? insets.bottom + 12 : 30;
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
  // A screen that asks for nothing gets the home screen's bar: the cards'
  // own surface, their hairline and their corner glow, flattened onto the
  // page colour so nothing shows through. Home passes the same values
  // explicitly because its page is a gradient, not a flat colour.
  const themedPill = flattenColor(
    theme.colors.homeButtonBackground || theme.colors.card,
    theme.colors.background,
  );
  const themedBorder =
    theme.colors.homeButtonBorder &&
    theme.colors.homeButtonBorder !== "transparent"
      ? theme.colors.homeButtonBorder
      : theme.colors.border;
  // The home treatment is white-on-glass, which works over home's gradient.
  // On an inner page that same surface flattens to near-white, so the white
  // icons and the white hairline vanish. There the bar keeps exactly the bar
  // it always had: the frosted fill, no outline, navy glyphs.
  const homeLookWouldVanish =
    theme.content.scheme !== "dark" &&
    isLightColor(themedPill, theme.colors.background) &&
    isLightColor(theme.colors.homeButtonText || "#FFFFFF");
  const usesDefaultLook =
    !pillColor && !glass && showBackground && !homeLookWouldVanish;
  const effectivePillColor = pillColor || (usesDefaultLook ? themedPill : null);
  const effectivePillBorder =
    pillBorderColor || (usesDefaultLook ? themedBorder : null);
  const effectiveGlow =
    pillGlowColor || (usesDefaultLook ? theme.colors.cardGlow : null);

  const isTransparent = !glass && !showBackground;
  const dark =
    typeof darkOverride === "boolean"
      ? darkOverride
      : theme.content.scheme === "dark";
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
  // Match the card surface tone (#2C2C2E) so the pill sits at the same
  // elevation as the cards above the near-black background.
  const darkFill = glass
    ? "rgba(44,44,46,0.55)"
    : isAndroid
      ? "rgba(44,44,46,0.96)"
      : "rgba(44,44,46,0.78)";
  const fillColor = isTransparent
    ? "transparent"
    : effectivePillColor
      ? effectivePillColor
      : dark
        ? darkFill
        : lightFill;
  // Icons/text: keep the original (untinted) navy look in light themes; in dark
  // tint the icons light so they read on the dark pill.
  const resolvedIconColor =
    iconColor ?? (usesDefaultLook ? theme.colors.homeButtonText : undefined);
  const activeIconColor =
    resolvedIconColor ?? (dark ? "#FFFFFF" : ACTIVE_ICON_COLOR);
  const iconColorFor = (isActive) => {
    if (resolvedIconColor) {
      return isActive ? resolvedIconColor : hexToRgba(resolvedIconColor, 0.55);
    }
    return dark ? (isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)") : undefined;
  };
  const pillGlass = dark ? PILL_GLASS.dark : PILL_GLASS.light;
  const wrapperStyle = [
    styles.menuWrapper,
    isTransparent && styles.menuWrapperTransparent,
    glass && !effectivePillColor && styles.menuWrapperGlass,
    dark && !isTransparent && !effectivePillColor && styles.menuWrapperDark,
    effectivePillColor && styles.menuWrapperOpaque,
  ];

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View
        style={
          !isTransparent && !glass && !pillColor ? styles.menuShadow : null
        }
      >
        <View style={wrapperStyle}>
          {!isTransparent &&
          !effectivePillColor &&
          Platform.OS !== "android" ? (
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
          {effectivePillColor && effectiveGlow ? (
            // Same fixed-size glow as a home card: a blurred ellipse anchored
            // to the bottom-right corner, clipped by the pill's own radius.
            <Svg
              pointerEvents="none"
              width={190}
              height={190}
              style={styles.pillGlow}
            >
              <Defs>
                <RadialGradient id="navPillGlow" cx="50%" cy="50%" r="50%">
                  <Stop
                    offset="0"
                    stopColor={pillGlowColor}
                    stopOpacity="0.13"
                  />
                  <Stop
                    offset="0.55"
                    stopColor={pillGlowColor}
                    stopOpacity="0.05"
                  />
                  <Stop offset="1" stopColor={pillGlowColor} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="190"
                height="190"
                fill="url(#navPillGlow)"
              />
            </Svg>
          ) : null}
          {!isTransparent && !effectivePillColor && dark ? (
            <>
              <LinearGradient
                colors={pillGlass.base}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                pointerEvents="none"
                style={styles.glassBase}
              />
              <LinearGradient
                colors={pillGlass.highlight}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 0.9 }}
                pointerEvents="none"
                style={styles.glassHighlight}
              />
              <View
                pointerEvents="none"
                style={[styles.glassRing, { borderColor: pillGlass.ring }]}
              />
            </>
          ) : null}
          {effectivePillColor && effectivePillBorder ? (
            <View
              pointerEvents="none"
              style={[styles.pillRing, { borderColor: effectivePillBorder }]}
            />
          ) : null}
          <Pressable
            style={styles.navButton}
            onPress={onLeftPress}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.home")}
          >
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
                      {t("a11y.home")}
                    </Text>
                  )}
                </>
              );
            }}
          </Pressable>

          <Pressable
            style={styles.navButton}
            onPress={onRightPress}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.menu")}
          >
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
                      {t("a11y.menu")}
                    </Text>
                  )}
                </>
              );
            }}
          </Pressable>
        </View>
      </View>

      {showAddButton && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
          disabled={addDisabled}
          accessibilityRole="button"
          accessibilityLabel={addAccessibilityLabel || t("a11y.add")}
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
