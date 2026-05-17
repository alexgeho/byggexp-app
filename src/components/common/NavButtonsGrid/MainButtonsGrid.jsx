import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { useTheme } from "../../../theme/ThemeContext";
import {
  mainButtons,
  defaultEnabledButtons,
} from "../../../constants/mainButtons";
import { getEnabledButtons } from "../../../utils/homeButtonsStorage";
import { createStyles } from "./MainButtonsGrid.styles";

export default function MainButtonsGrid() {
  
  const navigation = useNavigation();

  const { theme } = useTheme();

  const styles = createStyles(theme);

  const [enabledButtons, setEnabledButtons] =
    useState(defaultEnabledButtons);

  useFocusEffect(
    React.useCallback(function loadButtons() {
      async function fetchButtons() {
        const savedButtons =
          await getEnabledButtons();

        if (savedButtons) {
          setEnabledButtons(savedButtons);
        }
      }

      fetchButtons();
    }, []),
  );

  function handlePress(screen) {
    navigation.navigate(screen);
  }

  return (
    <View style={styles.container}>
      {mainButtons
        .filter(function filterButtons(button) {
          return enabledButtons.includes(
            button.id,
          );
        })
        .map(function renderButton(button) {
          return (
            <View
              key={button.id}
              style={styles.button}
            >
              <TouchableOpacity
                style={styles.buttonInner}
                onPress={function onButtonPress() {
                  handlePress(button.screen);
                }}
              >
                <View
                  style={styles.linesContainer}
                >
                  <View style={styles.line} />
                  <View style={styles.line} />
                  <View style={styles.line} />
                  <View style={styles.line} />
                </View>

                <Image
                  source={button.icon}
                  style={styles.buttonIcon}
                />

                <Text style={styles.buttonText}>
                  {button.title}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
    </View>
  );
}