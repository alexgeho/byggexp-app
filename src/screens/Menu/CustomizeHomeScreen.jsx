import React, { useState, useContext, useMemo } from "react";

import { ScrollView, View, Text, TouchableOpacity } from "react-native";

import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";

import { themeOptions } from "../../theme/themes";

import AuthContext from "../../contexts/AuthContext";

import {
  mainButtons,
  homeSections,
  getDefaultEnabledButtons,
  getDefaultEnabledSections,
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
  getButtonsOrder,
  saveButtonsOrder,
  getSecondaryAction,
  saveSecondaryAction,
} from "../../utils/homeButtonsStorage";
import Icon from "react-native-vector-icons/Feather";

import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";

import { createStyles } from "./CustomizeHomeScreen.styles";
import { DraggablePillList } from "./DraggablePillList";
import { isHomeButtonCustomizable } from "../../utils/userRoles";

// `embedded` renders the panel without its own BottomBar and routes the header
// button to `onClose` — used by the 70% slide-in drawer over Home, so theme
// changes preview live on the visible part of the home screen behind it.
// `onLiveChange(patch)` lets the embedded drawer push config changes straight
// into the Home screen behind it (enabledButtons / enabledSections /
// sectionsOrder / secondaryAction), so toggles preview live — not only after
// the next focus reload from storage.
export default function CustomizeHomeScreen({
  embedded = false,
  onClose,
  onLiveChange,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const handleClose = embedded ? onClose : navigation.goBack;

  const { selectedProject, user } = useContext(AuthContext);

  const { theme, themeName, changeTheme } = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Drag-handle / secondary-icon colour: white on the dark (black) theme so it
  // doesn't vanish against the dark drawer; navy on the light themes.
  const isDarkScheme = theme?.content?.scheme === "dark";
  const chevronActiveColor = isDarkScheme ? "#FFFFFF" : "#052d50";

  const [enabledButtons, setEnabledButtons] = useState(() =>
    getDefaultEnabledButtons(user?.role),
  );

  const [enabledSections, setEnabledSections] = useState(() =>
    getDefaultEnabledSections(user?.role),
  );

  const [dismissedSections, setDismissedSections] = useState([]);

  const [sectionsOrder, setSectionsOrder] = useState(
    homeSections.map((section) => section.id),
  );

  const [buttonsOrder, setButtonsOrder] = useState(
    mainButtons.map((button) => button.id),
  );

  const [secondaryAction, setSecondaryAction] = useState("camera");

  useFocusEffect(
    React.useCallback(
      function loadSettings() {
        async function fetchSettings() {
          const savedButtons = await getEnabledButtons();

          const savedSections = await getEnabledSections();

          const savedDismissedSections = await getDismissedSections();

          const savedSectionsOrder = await getSectionsOrder();

          const savedButtonsOrder = await getButtonsOrder();

          const savedSecondary = await getSecondaryAction();
          setSecondaryAction(savedSecondary);

          setEnabledButtons(
            savedButtons ?? getDefaultEnabledButtons(user?.role),
          );

          setEnabledSections(
            savedSections ?? getDefaultEnabledSections(user?.role),
          );

          setDismissedSections(savedDismissedSections);

          setSectionsOrder(savedSectionsOrder);

          setButtonsOrder(savedButtonsOrder);
        }

        fetchSettings();
      },
      [user?.role],
    ),
  );

  async function toggleButton(buttonId) {
    const isEnabled = enabledButtons.includes(buttonId);

    if (isEnabled) {
      const updatedButtons = enabledButtons.filter(function removeButton(id) {
        return id !== buttonId;
      });

      setEnabledButtons(updatedButtons);
      onLiveChange?.({ enabledButtons: updatedButtons });

      await saveEnabledButtons(updatedButtons);

      return;
    }

    const updatedButtons = [...enabledButtons, buttonId];

    setEnabledButtons(updatedButtons);
    onLiveChange?.({ enabledButtons: updatedButtons });

    await saveEnabledButtons(updatedButtons);
  }

  async function handlePickSecondary(action) {
    setSecondaryAction(action);
    onLiveChange?.({ secondaryAction: action });
    await saveSecondaryAction(action);
  }

  // The section list shows every section, so the dragged order is the full
  // order — persist it as-is.
  function commitSectionsOrder(nextOrder) {
    setSectionsOrder(nextOrder);
    onLiveChange?.({ sectionsOrder: nextOrder });
    saveSectionsOrder(nextOrder);
  }

  // The button list is role-filtered, so only visible ids are dragged. Drop the
  // reordered visible ids back into the slots the visible buttons occupy in the
  // full order, leaving hidden buttons where they are.
  function commitButtonsOrder(nextVisibleIds) {
    const visible = new Set(nextVisibleIds);
    const slots = [];
    buttonsOrder.forEach(function collectSlot(id, index) {
      if (visible.has(id)) {
        slots.push(index);
      }
    });
    const nextOrder = [...buttonsOrder];
    slots.forEach(function place(slot, k) {
      nextOrder[slot] = nextVisibleIds[k];
    });
    setButtonsOrder(nextOrder);
    onLiveChange?.({ buttonsOrder: nextOrder });
    saveButtonsOrder(nextOrder);
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
      onLiveChange?.({ enabledSections: updatedSections });

      await saveEnabledSections(updatedSections);

      return;
    }

    const updatedSections = [...enabledSections, sectionId];

    setEnabledSections(updatedSections);
    onLiveChange?.({ enabledSections: updatedSections });

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
          onPress={handleClose}
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

        {/* SECONDARY ROUND BUTTON */}
        <View style={styles.themeContainer}>
          <Text style={styles.sectionTitle}>
            {t("home.secondaryButton", "Round buttons")}
          </Text>

          <View style={styles.secondaryRow}>
            {[
              {
                id: "camera",
                icon: "camera",
                label: t("home.secondaryCamera", "Camera"),
              },
              {
                id: "hours",
                icon: "edit-2",
                label: t("home.secondaryHours", "Hours"),
              },
              {
                id: "play",
                icon: "play",
                label: t("home.secondaryPlay", "Play"),
              },
            ].map(function renderOption(option) {
              const active = secondaryAction === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.secondaryOption,
                    active && styles.secondaryOptionActive,
                  ]}
                  onPress={function pickSecondary() {
                    handlePickSecondary(option.id);
                  }}
                >
                  <Icon
                    name={option.icon}
                    // Figma: 20px icon, white.
                    size={20}
                    // Inactive icon: white on the dark theme so it doesn't
                    // vanish into the dark pill (navy on the light themes).
                    color={active ? "#FFFFFF" : chevronActiveColor}
                  />
                  <Text
                    style={[
                      styles.secondaryOptionLabel,
                      active && styles.secondaryOptionLabelActive,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* BUTTON LIST — the square grid buttons (drag to reorder) */}
        <Text style={styles.sectionTitle}>
          {t("home.buttonsListTitle", "Buttons")}
        </Text>
        <DraggablePillList
          items={buttonsOrder
            .map(function toButton(id) {
              return mainButtons.find(function byId(button) {
                return button.id === id;
              });
            })
            .filter(Boolean)
            .filter(function filterButton(button) {
              return isHomeButtonCustomizable(button, user?.role);
            })
            .map(function toItem(button) {
              return {
                id: button.id,
                label: t(`home.buttons.${button.id}`, button.title),
                enabled: enabledButtons.includes(button.id),
                disabled: false,
              };
            })}
          onToggle={toggleButton}
          onReorderCommit={commitButtonsOrder}
          styles={styles}
          handleColor={chevronActiveColor}
        />

        {/* SECTION LIST — the full-width info blocks (drag to reorder) */}
        <Text style={styles.sectionTitle}>
          {t("home.sectionsListTitle", "Blocks")}
        </Text>
        <DraggablePillList
          items={sectionsOrder
            .map(function toSection(id) {
              return homeSections.find(function byId(section) {
                return section.id === id;
              });
            })
            .filter(Boolean)
            .map(function toItem(section) {
              return {
                id: section.id,
                label: t(`home.sections.${section.id}`, section.title),
                enabled: enabledSections.includes(section.id),
                disabled: section.id === "project-files" && !selectedProject,
              };
            })}
          onToggle={toggleSection}
          onReorderCommit={commitSectionsOrder}
          styles={styles}
          handleColor={chevronActiveColor}
        />
      </ScrollView>

      {embedded ? null : (
        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={false}
        />
      )}
    </View>
  );
}
