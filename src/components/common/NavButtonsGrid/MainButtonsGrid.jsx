import React, { useContext, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import {
  mainButtons,
  defaultEnabledButtons,
} from "../../../constants/mainButtons";
import {
  getEnabledButtons,
  getButtonsOrder,
} from "../../../utils/homeButtonsStorage";
import {
  isHomeButtonVisible,
  canViewEmployeeStatsForProject,
} from "../../../utils/userRoles";
import AuthContext from "../../../contexts/AuthContext";
import { useUnreadChats } from "../../../hooks/useUnreadChats";
import { useTaskProjectBadges } from "../../../hooks/useTaskProjectBadges";
import { useHomeButtonStats } from "../../../hooks/useHomeButtonStats";
import UnreadBadge from "../UnreadBadge/UnreadBadge";
import { HomeButtonExtraInfo } from "./HomeButtonExtraInfo";
import { createStyles } from "./MainButtonsGrid.styles";

export default function MainButtonsGrid() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, userId, selectedProject } = useContext(AuthContext);
  const { theme } = useTheme();
  const selectedProjectId = selectedProject?._id || selectedProject?.id;

  const styles = createStyles(theme);
  const { unreadCount } = useUnreadChats();
  const { overdueTaskCount, taskDeadlines, projectStart, projectDeadline } =
    useTaskProjectBadges({
      projectId: selectedProjectId,
    });
  const showEmployeeStats = canViewEmployeeStatsForProject(
    user?.role,
    userId || user?._id || user?.id,
    selectedProject,
  );
  const { employeeStats, shiftStats } = useHomeButtonStats({
    projectId: selectedProjectId,
    loadEmployeeStats: showEmployeeStats,
  });

  const [enabledButtons, setEnabledButtons] = useState(defaultEnabledButtons);
  const [buttonsOrder, setButtonsOrder] = useState(() =>
    mainButtons.map((button) => button.id),
  );

  // Measure the grid width so the two columns get equal gaps (theme.gridGap)
  // both horizontally and vertically, with the outer edges flush to the
  // container. Without this, a percentage width + "space-between" makes the
  // horizontal gap differ from the vertical one.
  const [gridWidth, setGridWidth] = useState(0);
  const gridGap = theme.homeButton.gridGap;
  const columnButtonWidth =
    gridWidth > 0 ? (gridWidth - gridGap) / 2 : theme.homeButton.width;

  useFocusEffect(
    React.useCallback(function loadButtons() {
      async function fetchButtons() {
        const savedButtons = await getEnabledButtons();
        const savedOrder = await getButtonsOrder();

        if (savedButtons) {
          setEnabledButtons(savedButtons);
        }

        setButtonsOrder(savedOrder);
      }

      fetchButtons();
    }, []),
  );

  const orderedButtons = buttonsOrder
    .map(function toButton(id) {
      return mainButtons.find(function byId(button) {
        return button.id === id;
      });
    })
    .filter(Boolean);

  function handlePress(screen) {
    navigation.navigate(screen);
  }

  return (
    <View
      style={styles.container}
      onLayout={function onGridLayout(event) {
        const nextWidth = event.nativeEvent.layout.width;
        setGridWidth(function keepStable(previousWidth) {
          return Math.abs(previousWidth - nextWidth) > 0.5
            ? nextWidth
            : previousWidth;
        });
      }}
    >
      {orderedButtons
        .filter(function filterButtons(button) {
          return isHomeButtonVisible(button, enabledButtons, user?.role);
        })
        .map(function renderButton(button) {
          const buttonColor = theme.colors.buttonColors?.[button.id];
          const iconColor = buttonColor
            ? "#FFFFFF"
            : theme.colors.homeButtonText || theme.colors.icon;

          return (
            <View
              key={button.id}
              style={[
                styles.button,
                { width: columnButtonWidth },
                buttonColor && {
                  backgroundColor: buttonColor,
                  borderColor: "#FFFFFF",
                },
              ]}
            >
              {theme.colors.cardGlow && !buttonColor ? (
                // Fixed-size glow anchored to the bottom-right corner, so it
                // looks identical whatever the card's height (Figma blurred
                // ellipse). Card overflow:hidden clips it to the rounded corner.
                <Svg
                  pointerEvents="none"
                  width={190}
                  height={190}
                  style={{ position: "absolute", right: -30, bottom: -30 }}
                >
                  <Defs>
                    <RadialGradient
                      id={`cardGlow-${button.id}`}
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <Stop
                        offset="0"
                        stopColor={theme.colors.cardGlow}
                        stopOpacity="0.13"
                      />
                      <Stop
                        offset="0.55"
                        stopColor={theme.colors.cardGlow}
                        stopOpacity="0.05"
                      />
                      <Stop
                        offset="1"
                        stopColor={theme.colors.cardGlow}
                        stopOpacity="0"
                      />
                    </RadialGradient>
                  </Defs>
                  <Rect
                    x="0"
                    y="0"
                    width="190"
                    height="190"
                    fill={`url(#cardGlow-${button.id})`}
                  />
                </Svg>
              ) : null}
              <TouchableOpacity
                style={styles.buttonInner}
                onPress={function onButtonPress() {
                  handlePress(button.screen);
                }}
              >
                <View
                  style={[
                    styles.linesContainer,
                    (theme.colors.hideButtonLines || buttonColor) &&
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
                      size={theme.homeButton.iconSize}
                      color={iconColor}
                    />
                  ) : (
                    <Image
                      source={button.icon}
                      style={[
                        styles.buttonIcon,
                        buttonColor && { tintColor: "#FFFFFF" },
                      ]}
                    />
                  )}

                  {button.id === "chats" ? (
                    <UnreadBadge count={unreadCount} />
                  ) : null}

                  {button.id === "tasks" ? (
                    <UnreadBadge count={overdueTaskCount} />
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.buttonText,
                    buttonColor && { color: "#FFFFFF" },
                  ]}
                >
                  {t(`home.buttons.${button.id}`, button.title)}
                </Text>

                <HomeButtonExtraInfo
                  buttonId={button.id}
                  showEmployeeStats={showEmployeeStats}
                  employeeStats={employeeStats}
                  shiftStats={shiftStats}
                  taskDeadlines={taskDeadlines}
                  projectStart={projectStart}
                  projectDeadline={projectDeadline}
                  style={styles.infoBadgesRow}
                />
              </TouchableOpacity>
            </View>
          );
        })}
    </View>
  );
}
