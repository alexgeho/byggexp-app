import React, { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";

export const MenuButton = ({ screen, params, title, icon, isLast = false }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  return (
    <>
      <TouchableOpacity
        style={[styles.menuItem, !isLast && styles.menuItemDivider]}
        onPress={() => navigation.navigate(screen ? screen : "Menu", params)}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {/* iOS-style row: the glyph sits directly on the row, tinted the system
            accent — no filled colour badge behind it. */}
        <View style={styles.menuIconContainer}>
          <Image style={styles.menuIcon} source={icon} resizeMode="contain" />
        </View>
        <Text style={styles.menuTitle}>{title}</Text>
        <Image
          style={styles.arrowIcon}
          source={require("../../../assets/Arrow-right.png")}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 56,
      backgroundColor: "transparent",
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    menuItemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    menuIconContainer: {
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    menuIcon: {
      width: 26,
      height: 26,
      tintColor: "#007AFF", // iOS system blue — glyph only, no badge
    },
    menuTitle: {
      flex: 1,
      marginLeft: 12,
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "500",
    },
    arrowIcon: {
      width: 16,
      height: 16,
      tintColor: c.textMuted,
    },
  });
