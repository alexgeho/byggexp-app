import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";

// Exact iOS (light) system colours — see the palette table in HANDOFF.md.
const IOS = {
  blue: "#007AFF", // systemBlue
  label: "#000000", // label
  chevron: "#C7C7CC", // tertiaryLabel-ish chevron grey
  separator: "#C6C6C8", // opaque separator
};

// `icon` is a Feather glyph name (one icon collection across the whole menu).
export const MenuButton = ({ screen, params, title, icon, isLast = false }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuItemDivider]}
      onPress={() => navigation.navigate(screen ? screen : "Menu", params)}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.menuIconContainer}>
        <Icon name={icon} size={22} color={IOS.blue} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Icon name="chevron-right" size={20} color={IOS.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS.separator,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    flex: 1,
    marginLeft: 12,
    color: IOS.label,
    fontSize: 17, // iOS body
    fontWeight: "400",
  },
});
