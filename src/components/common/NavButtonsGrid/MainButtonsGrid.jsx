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
import Icon from "react-native-vector-icons/Feather";
import { useTheme } from "../../../theme/ThemeContext";
import {
  mainButtons,
  defaultEnabledButtons,
} from "../../../constants/mainButtons";
import { getEnabledButtons } from "../../../utils/homeButtonsStorage";
import { isHomeButtonVisible, canManageEmployees } from "../../../utils/userRoles";
import AuthContext from "../../../contexts/AuthContext";
import { useUnreadChats } from "../../../hooks/useUnreadChats";
import { useHomeButtonStats } from "../../../hooks/useHomeButtonStats";
import UnreadBadge from "../UnreadBadge/UnreadBadge";
import { HomeButtonExtraInfo } from "./HomeButtonExtraInfo";
import { createStyles } from "./MainButtonsGrid.styles";

export default function MainButtonsGrid() {
  const navigation = useNavigation();
  const { user, selectedProject } = useContext(AuthContext);
  const { theme } = useTheme();
  const selectedProjectId =
    selectedProject?._id || selectedProject?.id;

  const styles = createStyles(theme);
  const { unreadCount } = useUnreadChats();
  const showEmployeeStats = canManageEmployees(user?.role);
  const { employeeStats, shiftStats } = useHomeButtonStats({
    projectId: selectedProjectId,
    loadEmployeeStats: showEmployeeStats,
  });

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
          return isHomeButtonVisible(button, enabledButtons, user?.role);
        })
        .map(function renderButton(button) {
          return (
            <View key={button.id} style={styles.button}>
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
                  {button.vectorIcon ? (
                    <Icon
                      name={button.vectorIcon}
                      size={theme.colors.homeButtonIconSize || 26}
                      color={theme.colors.icon}
                    />
                  ) : (
                    <Image source={button.icon} style={styles.buttonIcon} />
                  )}

                  {button.id === "chats" ? (
                    <UnreadBadge count={unreadCount} />
                  ) : null}
                </View>

                <Text style={styles.buttonText}>{button.title}</Text>

                <HomeButtonExtraInfo
                  buttonId={button.id}
                  showEmployeeStats={showEmployeeStats}
                  employeeStats={employeeStats}
                  shiftStats={shiftStats}
                  style={styles.infoBadgesRow}
                />
              </TouchableOpacity>
            </View>
          );
        })}
    </View>
  );
}
