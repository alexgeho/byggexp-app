import React, { useState } from "react";

import { View, Text, TouchableOpacity } from "react-native";

import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useTheme } from "../../theme/ThemeContext";

import {
  mainButtons,
  homeSections,
  defaultEnabledButtons,
  defaultEnabledSections,
} from "../../constants/mainButtons";

import {
  getEnabledButtons,
  saveEnabledButtons,
  getEnabledSections,
  saveEnabledSections,
} from "../../utils/homeButtonsStorage";

import { BackButton } from "../../components/common/BackButton/BackButton";

import { createStyles } from "./CustomizeHomeScreen.styles";

export default function CustomizeHomeScreen() {
  const navigation = useNavigation();

  const { theme } = useTheme();

  const styles = createStyles(theme);

  const [enabledButtons, setEnabledButtons] = useState(
    defaultEnabledButtons,
  );

  const [enabledSections, setEnabledSections] = useState(
    defaultEnabledSections,
  );

  /* LOAD SAVED SETTINGS */
  useFocusEffect(
    React.useCallback(function loadSettings() {
      async function fetchSettings() {
        const savedButtons = await getEnabledButtons();

        const savedSections = await getEnabledSections();

        if (savedButtons) {
          setEnabledButtons(savedButtons);
        }

        if (savedSections) {
          setEnabledSections(savedSections);
        }
      }

      fetchSettings();
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

  /* TOGGLE SECTION ENABLED STATE */
  async function toggleSection(sectionId) {
    const isEnabled = enabledSections.includes(sectionId);

    if (isEnabled) {
      const updatedSections = enabledSections.filter(function removeSection(
        id,
      ) {
        return id !== sectionId;
      });

      setEnabledSections(updatedSections);

      await saveEnabledSections(updatedSections);

      return;
    }

    const updatedSections = [...enabledSections, sectionId];

    setEnabledSections(updatedSections);

    await saveEnabledSections(updatedSections);
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <BackButton
          backgroundColor="#ffffff"
          tint="light"
          borderColor="#FFFFFF50"
          onPress={navigation.goBack}
          iconSource={require("../../assets/Arrow-left.png")}
        />

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

      {/* SECTION LIST */}
      <View style={styles.list}>
        {homeSections.map(function renderSection(section, index) {
          const isEnabled = enabledSections.includes(section.id);

          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.item,
                index !== homeSections.length - 1 && styles.itemBorder,
              ]}
              onPress={function handlePress() {
                toggleSection(section.id);
              }}
            >
              <Text style={styles.itemText}>{section.title}</Text>

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