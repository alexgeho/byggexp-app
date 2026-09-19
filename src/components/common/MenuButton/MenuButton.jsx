import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppIcon } from "../AppIcon";
import { useTheme } from "../../../theme/ThemeContext";

// `icon` is a Feather glyph name (one icon collection across the whole menu).
export const MenuButton = ({ screen, params, title, icon, isLast = false }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const c = theme.content;

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => navigation.navigate(screen ? screen : "Menu", params)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.menuIconContainer}>
        <AppIcon name={icon} size={28} color={c.accent} strokeWidth={1.5} />
      </View>
      {/* Text + chevron carry the separator, so — like iOS — the hairline is
          inset to start at the label, not under the icon. */}
      <View
        style={[
          styles.rowRight,
          !isLast && styles.rowRightDivider,
          !isLast && { borderBottomColor: c.divider },
        ]}
      >
        <Text style={[styles.menuTitle, { color: c.textPrimary }]}>
          {title}
        </Text>
        <AppIcon
          name="chevron-right"
          size={16}
          color={c.placeholder}
          strokeWidth={2}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54, // roomier than the 44 minimum
    backgroundColor: "transparent",
    paddingLeft: 16,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  rowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    paddingRight: 16,
    paddingVertical: 16,
  },
  rowRightDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor is applied inline from theme (c.divider).
  },
  menuTitle: {
    flex: 1,
    // color is applied inline from theme (c.textPrimary).
    fontSize: 17, // iOS body
    fontWeight: "400",
  },
});
