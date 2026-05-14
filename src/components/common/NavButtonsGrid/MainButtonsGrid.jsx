import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../../theme/ThemeContext";
import { mainButtons } from "../../../constants/mainButtons";

export default function MainButtonsGrid() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  function handlePress(screen) {
    navigation.navigate(screen);
  }

  return (
    <View style={styles.container}>
      {mainButtons
        .map((button) => (
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
              onPress={() => handlePress(button.screen)}
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
                    fontFamily: theme.text.fontFamily.regular,
                  },
                ]}
              >
                {button.title}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
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