import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";

const ACTIVE_COLOR = "#052D50";
const INACTIVE_COLOR = "#8A97A6";

export function FooterColorful() {
  const navigation = useNavigation();

  // Icons match the Figma design: filled home (active) + Feather folder / grid.
  const items = [
    {
      id: "home",
      Icon: Ionicons,
      icon: "home",
      active: true,
      onPress: () => {},
    },
    {
      id: "projects",
      Icon: Feather,
      icon: "folder",
      onPress: () => navigation.navigate("Projects"),
    },
    {
      id: "menu",
      Icon: Feather,
      icon: "grid",
      onPress: () => navigation.navigate("Menu"),
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        {items.map(({ id, Icon, icon, active, onPress }) => (
          <TouchableOpacity
            key={id}
            style={styles.item}
            activeOpacity={0.7}
            onPress={onPress}
          >
            <Icon
              name={icon}
              size={24}
              color={active ? ACTIVE_COLOR : INACTIVE_COLOR}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: 24,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 248,
    maxWidth: "80%",
    height: 64,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 34,
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});
