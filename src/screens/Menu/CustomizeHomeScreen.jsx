import React, { useState, useContext } from "react";

import { ScrollView, View, Text, TouchableOpacity } from "react-native";

import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";

import { themeOptions } from "../../theme/themes";

import AuthContext from "../../contexts/AuthContext";

import {
  mainButtons,
  homeSections,
  defaultEnabledButtons,
  defaultEnabledSections,
} from "../../constants/mainButtons";

import {
  getEnabledButtons,
  saveEnabledButtons,
  getDismissedSections,
  saveDismissedSections,
  getEnabledSections,
  saveEnabledSections,
  getSectionsOrder,
  saveSectionsOrder,
} from "../../utils/homeButtonsStorage";
import Icon from "react-native-vector-icons/Feather";

import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";

import { createStyles } from "./CustomizeHomeScreen.styles";
import { isHomeButtonCustomizable } from "../../utils/userRoles";

export default function CustomizeHomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { selectedProject, user } = useContext(AuthContext);

  const { theme, themeName, changeTheme } = useTheme();

  const styles = createStyles(theme);

  const [enabledButtons, setEnabledButtons] = useState(defaultEnabledButtons);

  const [enabledSections, setEnabledSections] = useState(
    defaultEnabledSections,
  );

  const [dismissedSections, setDismissedSections] = useState([]);

  const [sectionsOrder, setSectionsOrder] = useState(
    homeSections.map((section) => section.id),
  );

  useFocusEffect(
    React.useCallback(function loadSettings() {
      async function fetchSettings() {
        const savedButtons = await getEnabledButtons();

        const savedSections = await getEnabledSections();

        const savedDismissedSections = await getDismissedSections();

        const savedSectionsOrder = await getSectionsOrder();

        if (savedButtons) {
          setEnabledButtons(savedButtons);
        }

        if (savedSections) {
          setEnabledSections(savedSections);
        }

        setDismissedSections(savedDismissedSections);

        setSectionsOrder(savedSectionsOrder);
      }

      fetchSettings();
    }, []),
  );

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

  function moveSection(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= sectionsOrder.length) {
      return;
    }
    const nextOrder = [...sectionsOrder];
    [nextOrder[index], nextOrder[target]] = [
      nextOrder[target],
      nextOrder[index],
    ];
    setSectionsOrder(nextOrder);
    saveSectionsOrder(nextOrder);
  }

  async function toggleSection(sectionId) {
    const isEnabled = enabledSections.includes(sectionId);

    if (isEnabled) {
      const updatedSections = enabledSections.filter(
        function removeSection(id) {
          return id !== sectionId;
        },
      );

      setEnabledSections(updatedSections);

      await saveEnabledSections(updatedSections);

      return;
    }

    const updatedSections = [...enabledSections, sectionId];

    setEnabledSections(updatedSections);

    await saveEnabledSections(updatedSections);

    const updatedDismissedSections = dismissedSections.filter(
      function removeDismissed(id) {
        return id !== sectionId;
      },
    );

    setDismissedSections(updatedDismissedSections);

    await saveDismissedSections(updatedDismissedSections);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor="#ffffff"
          tint="light"
          borderColor="#FFFFFF50"
          onPress={navigation.goBack}
          iconSource={require("../../assets/Arrow-left.png")}
        />

        <Text style={styles.title}>{t("home.customizeTitle")}</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* THEME SWITCHER */}
        <View style={styles.themeContainer}>
          <Text style={styles.sectionTitle}>{t("home.themes")}</Text>

          <View style={styles.themeRow}>
            {themeOptions.map(function renderTheme(item) {
              const isActive = themeName === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: item.color,
                    },
                    isActive && styles.activeThemeButton,
                  ]}
                  onPress={function handleThemePress() {
                    changeTheme(item.id);
                  }}
                >
                  {item.secondaryColor ? (
                    <View style={styles.splitThemePreview}>
                      <View
                        style={[
                          styles.splitThemeHalf,
                          {
                            backgroundColor: item.color,
                          },
                        ]}
                      />

                      <View
                        style={[
                          styles.splitThemeHalf,
                          {
                            backgroundColor: item.secondaryColor,
                          },
                        ]}
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* BUTTON LIST */}
        <View style={styles.list}>
          {mainButtons
            .filter(function filterButton(button) {
              return isHomeButtonCustomizable(button, user?.role);
            })
            .map(function renderButton(button, index, filteredButtons) {
              const isEnabled = enabledButtons.includes(button.id);

              return (
                <TouchableOpacity
                  key={button.id}
                  style={[
                    styles.item,
                    index !== filteredButtons.length - 1 && styles.itemBorder,
                  ]}
                  onPress={function handlePress() {
                    toggleButton(button.id);
                  }}
                >
                  <Text style={styles.itemText}>
                    {t(`home.buttons.${button.id}`, button.title)}
                  </Text>

                  <View
                    style={[
                      styles.checkbox,
                      isEnabled && styles.checkboxActive,
                    ]}
                  >
                    {isEnabled && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* SECTION LIST */}
        <View style={styles.list}>
          {sectionsOrder
            .map(function toSection(id) {
              return homeSections.find(function byId(section) {
                return section.id === id;
              });
            })
            .filter(Boolean)
            .map(function renderSection(section, index, orderedSections) {
              const isEnabled = enabledSections.includes(section.id);

              const isProjectFiles = section.id === "project-files";

              const isDisabled = isProjectFiles && !selectedProject;

              const isFirst = index === 0;
              const isLast = index === orderedSections.length - 1;

              return (
                <TouchableOpacity
                  key={section.id}
                  disabled={isDisabled}
                  style={[
                    styles.item,
                    !isLast && styles.itemBorder,
                    {
                      opacity: isDisabled ? 0.4 : 1,
                    },
                  ]}
                  onPress={function handlePress() {
                    toggleSection(section.id);
                  }}
                >
                  <Text style={styles.itemText}>
                    {t(`home.sections.${section.id}`, section.title)}
                  </Text>

                  <View style={styles.sectionRowActions}>
                    <TouchableOpacity
                      style={styles.reorderButton}
                      disabled={isFirst}
                      onPress={function moveUp() {
                        moveSection(index, -1);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Icon
                        name="chevron-up"
                        size={20}
                        color={isFirst ? "#c2ccd6" : "#052d50"}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.reorderButton}
                      disabled={isLast}
                      onPress={function moveDown() {
                        moveSection(index, 1);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Icon
                        name="chevron-down"
                        size={20}
                        color={isLast ? "#c2ccd6" : "#052d50"}
                      />
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.checkbox,
                        isEnabled && styles.checkboxActive,
                      ]}
                    >
                      {isEnabled && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
}
