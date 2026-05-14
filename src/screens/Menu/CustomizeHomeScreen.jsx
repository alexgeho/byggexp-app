import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import {
  mainButtons,
  defaultEnabledButtons,
} from "../../constants/mainButtons";

import { GlassBackButton } from "../../components/common/GlassBackButton/GlassBackButton";

export default function CustomizeHomeScreen() {
  const navigation = useNavigation();

  const [enabledButtons, setEnabledButtons] = useState(
    defaultEnabledButtons,
  );

  function toggleButton(buttonId) {
    const isEnabled = enabledButtons.includes(buttonId);

    if (isEnabled) {
      setEnabledButtons(
        enabledButtons.filter(function removeButton(id) {
          return id !== buttonId;
        }),
      );

      return;
    }

    setEnabledButtons([...enabledButtons, buttonId]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton
          backgroundColor="#ffffff"
          tint="light"
          borderColor="#FFFFFF50"
          onPress={navigation.goBack}
          iconSource={require("../../assets/Arrow-left.png")}
        />

        <Text style={styles.title}>Customize Home Screen</Text>

        <View style={styles.placeholder} />
      </View>

      <View style={styles.list}>
        {mainButtons.map(function renderButton(button) {
          const isEnabled = enabledButtons.includes(button.id);

          return (
            <TouchableOpacity
              key={button.id}
              style={styles.item}
              onPress={function handlePress() {
                toggleButton(button.id);
              }}
            >
              <Text style={styles.itemText}>
                {button.title}
              </Text>

              <View
                style={[
                  styles.checkbox,
                  isEnabled && styles.checkboxActive,
                ]}
              >
                {isEnabled && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF5FB",
    paddingTop: 48,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#052D50",
  },

  placeholder: {
    width: 44,
  },

  list: {
    gap: 12,
  },

  item: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemText: {
    fontSize: 16,
    color: "#052D50",
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D0D7E2",

    alignItems: "center",
    justifyContent: "center",
  },

  checkboxActive: {
    backgroundColor: "#2582D9",
    borderColor: "#2582D9",
  },

  checkmark: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});