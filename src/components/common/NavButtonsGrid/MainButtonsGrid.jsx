import React, { useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
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

import {
  getEnabledButtons,
} from "../../../utils/homeButtonsStorage";

export default function MainButtonsGrid() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [enabledButtons, setEnabledButtons] = useState(
    defaultEnabledButtons,
  );

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

  function handlePress(screen) {
    navigation.navigate(screen);
  }

  return (
    <View style={styles.container}>
      {mainButtons
        .filter(function filterButtons(button) {
          return enabledButtons.includes(button.id);
        })
        .map(function renderButton(button) {
          return (
            <View
              key={button.id}
              style={[
                styles.button,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.buttonInner}
                onPress={function onButtonPress() {
                  handlePress(button.screen);
                }}
              >
                <Image
                  source={button.icon}
                  style={[
                    styles.buttonIcon,
                    {
                      tintColor: theme.colors.icon,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: theme.colors.text,
                      fontFamily:
                        theme.text.fontFamily.regular,
                    },
                  ]}
                >
                  {button.title}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexWrap: "wrap",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  button: {
    width: "42%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },

  buttonInner: {
    flexDirection: "column",
    padding: 16,
    gap: 18,
    alignItems: "center",
  },

  buttonIcon: {
    width: 26,
    height: 26,
  },

  buttonText: {},
});