import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import { fontSize } from "../../../theme/tokens";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { BackButton } from "../BackButton/BackButton";

const DEFAULT_BACK_ICON = require("../../../assets/Arrow-left.png");

// Themed screen scaffold shared by every screen: it owns the (theme-aware)
// background, side gutters and safe-area padding, plus the standard header row
// (back button · centred title · optional right slot). Changing the app-wide
// screen chrome — background, header spacing, title style — happens here once.
//
// Props:
//  - title: centred header title (omit to hide the title text)
//  - onBack: back handler (omit to hide the back button)
//  - right: node rendered on the header's right (e.g. a search button)
//  - backIcon: override the back-arrow image
//  - header: false to skip the header row entirely
//  - style / contentStyle: extra styles for the outer container
export function Screen({
  title,
  onBack,
  right,
  backIcon = DEFAULT_BACK_ICON,
  header = true,
  style,
  children,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  return (
    <View style={[styles.container, style]}>
      {header ? (
        <View style={styles.header}>
          <View style={styles.side}>
            {onBack ? (
              <BackButton onPress={onBack} iconSource={backIcon} />
            ) : null}
          </View>
          <Text
            style={[
              styles.title,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
            numberOfLines={1}
          >
            {title || ""}
          </Text>
          <View style={[styles.side, styles.sideRight]}>{right || null}</View>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    side: {
      width: 44,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    sideRight: {
      alignItems: "flex-end",
    },
    title: {
      flex: 1,
      textAlign: "center",
      color: c.textPrimary,
      fontSize: fontSize.title,
      fontWeight: "600",
    },
  });

export default Screen;
