import React, { useContext, useState } from "react";
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
import { isHomeButtonVisible } from "../../../utils/userRoles";
import AuthContext from "../../../contexts/AuthContext";
import { useUnreadChats } from "../../../hooks/useUnreadChats";
import UnreadBadge from "../UnreadBadge/UnreadBadge";
import { createStyles } from "./MainButtonsGrid.styles";

export default function MainButtonsGrid() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();

  const styles = createStyles(theme);
  const { unreadCount } = useUnreadChats();

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
          return isHomeButtonVisible(
            button,
            enabledButtons,
            user?.role,
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
                  style={[
                    styles.linesContainer,
                    theme.colors.hideButtonLines &&
                      styles.linesContainerHidden,
                  ]}
                >
                  <View style={styles.line} />
                  <View style={styles.line} />
                  <View style={styles.line} />
                  <View style={styles.line} />
                </View>

                <View style={styles.iconWrapper}>
                  <Image
                    source={button.icon}
                    style={styles.buttonIcon}
                  />

                  {button.id === "chats" ? (
                    <UnreadBadge count={unreadCount} />
                  ) : null}
                </View>

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