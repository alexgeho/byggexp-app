import React, { useState } from "react";

import { View, Text, TouchableOpacity } from "react-native";

import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useTheme } from "../../theme/ThemeContext";

import {
  mainButtons,
  defaultEnabledButtons,
} from "../../constants/mainButtons";

import {
  getEnabledButtons,
  saveEnabledButtons,
} from "../../utils/homeButtonsStorage";

import { GlassBackButton } from "../../components/common/GlassBackButton/GlassBackButton";

import { createStyles } from "./CustomizeHomeScreen.styles";

export default function CustomizeHomeScreen() {
  
  const navigation = useNavigation();

  const { theme } = useTheme();

  const styles = createStyles(theme);

  const [enabledButtons, setEnabledButtons] = useState(defaultEnabledButtons);

  /* LOAD SAVED BUTTONS */
  useFocusEffect(
    React.useCallback(function loadButtons() {
      async function fetchButtons() {
        const savedButtons = await getEnabledButtons();

        if (savedButtons) {
          setEnabledButtons(savedButtons);
        }
      }

      fetchButtons();
    }, []),
  );

  /* TOGGLE BUTTON ENABLED STATE */
  async function toggleButton(buttonId) {
    const isEnabled = enabledButtons.includes(buttonId);

    if (isEnabled) {
      const updatedButtons = enabledButtons.filter(function removeButton(id) {
        return id !== buttonId;
      });

      setEnabledButtons(updatedButtons);

      await saveEnabledButtons(updatedButtons);

      return;
    }

    const updatedButtons = [...enabledButtons, buttonId];

    setEnabledButtons(updatedButtons);

    await saveEnabledButtons(updatedButtons);
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <GlassBackButton
          backgroundColor="#ffffff"
          tint="light"
          borderColor="#FFFFFF50"
          onPress={navigation.goBack}
          iconSource={require("../../assets/Arrow-left.png")}
        />

        {/* TITLE */}
        <Text style={styles.title}>Customize Home Screen</Text>
        <View style={styles.placeholder} />

      </View>

      {/* BUTTON LIST */}
      <View style={styles.list}>
        {mainButtons.map(function renderButton(button, index) {
          const isEnabled = enabledButtons.includes(button.id);

          return (
            <TouchableOpacity
              key={button.id}
              style={[
                styles.item,
                index !== mainButtons.length - 1 && styles.itemBorder,
              ]}
              onPress={function handlePress() {
                toggleButton(button.id);
              }}
            >
              <Text style={styles.itemText}>{button.title}</Text>

              <View
                style={[styles.checkbox, isEnabled && styles.checkboxActive]}
              >
                {isEnabled && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
