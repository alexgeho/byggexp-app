import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  useWindowDimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";

import AuthContext from "../../../contexts/AuthContext";
import { useTheme } from "../../../theme/ThemeContext";

import { useTimer } from "../../../hooks/useTimer";
import { useShiftExitAutoComplete } from "../../../hooks/useShiftExitAutoComplete";

import { Timer } from "../../../components/common2/Timer/Timer";

import shiftService from "../../../services/shift.service";
import { projectService } from "../../../services";
import { resumeShiftWithGuards, startShiftWithLocationGuard } from "../../../utils/shiftLocationGuard";

import { createStyles } from "./HomeVariant2.styles";

import ProjectSelector2 from "../../../components/common2/projectSelector/projectSelector";
import { MainActionButtons } from "../../../components/common2/mainActionButtons/mainActionButtons";

import { FooterButtonsVariant2 } from "../../../components/common2/footer/footer";

import ProjectFilesSection from "../../../components/common/ProjectFilesSection/ProjectFilesSection";
import {
  mainButtons,
  defaultEnabledButtons,
  defaultEnabledSections,
} from "../../../constants/mainButtons";
import {
  getEnabledButtons,
  getEnabledSections,
  saveEnabledSections,
} from "../../../utils/homeButtonsStorage";
import { useUnreadChats } from "../../../hooks/useUnreadChats";
import UnreadBadge from "../../../components/common/UnreadBadge/UnreadBadge";
import ShiftHistoryPreview from "../../../components/common2/ShiftHistoryPreview/ShiftHistoryPreview";
import { isHomeButtonVisible } from "../../../utils/userRoles";

export default function HomeVariant2() {
  const {
    theme,
    themeName,
  } = useTheme();
  const isLightBlueTheme =
    themeName === "lightBlue";
  const gradientColors = useMemo(
    () =>
      ({
        blue: ["#5BC8FF", "#0D5DB8"],
        blueDarkText: ["#5BC8FF", "#0D5DB8"],
        black: ["#1C1C1C", "#1C1C1C"],
        lightBlue: ["#ECF6FF", "#ECF6FF"],
        green: ["#8ED057", "#4C9E3C"],
        orange: ["#FFAE63", "#F97316"],
        darkGray: ["#363636", "#121212"],
      })[themeName] || ["#5BC8FF", "#0D5DB8"],
    [themeName],
  );
  const { height: screenHeight } =
    useWindowDimensions();
  const isVeryCompact = screenHeight <= 700;
  const isCompact =
    screenHeight <= 780;
  /* SELECTED PROJECT */
  const {
    selectedProject,
    setSelectedProject,
    user,
  } =
    useContext(AuthContext);
  const selectedProjectId =
    selectedProject?._id || selectedProject?.id;

  /* NAVIGATION */
  const navigation =
    useNavigation();

  /* LOADING STATE */
  const [
    loadingShift,
    setLoadingShift,
  ] = useState(false);

  /* CURRENT ACTIVE SHIFT */
  const [
    currentShift,
    setCurrentShift,
  ] = useState(null);
  const [
    enabledButtons,
    setEnabledButtons,
  ] = useState(defaultEnabledButtons);
  const [
    enabledSections,
    setEnabledSections,
  ] = useState(defaultEnabledSections);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const { unreadCount } = useUnreadChats();
  const visibleQuickButtons = useMemo(
    () =>
      mainButtons.filter(function filterButton(button) {
        return isHomeButtonVisible(
          button,
          enabledButtons,
          user?.role,
        );
      }),
    [enabledButtons, user?.role],
  );
  const hasSections =
    enabledSections.includes("shift-history") ||
    enabledSections.includes("project-files");
  const quickButtonCount = visibleQuickButtons.length;
  const useFixedCoreSpacing =
    quickButtonCount === 4 ||
    ((quickButtonCount === 1 || quickButtonCount === 2) &&
      hasSections);
  const contentFitsVisibleArea =
    scrollViewHeight > 0 &&
    contentHeight > 0 &&
    contentHeight <= scrollViewHeight;
  const distributeCoreControlsInternally =
    !hasSections &&
    !useFixedCoreSpacing &&
    contentFitsVisibleArea;
  const shouldDistributeBlocksEvenly =
    distributeCoreControlsInternally;
  const showCoreSpacers = !distributeCoreControlsInternally;
  const styles = useMemo(
    () =>
      createStyles({
        compact: isCompact,
        veryCompact: isVeryCompact,
        hasSections,
        theme,
        isLightBlue: isLightBlueTheme,
      }),
    [
      hasSections,
      isCompact,
      isLightBlueTheme,
      theme,
      isVeryCompact,
    ],
  );

  /* TIMER LOGIC */
  const {
    formattedTime,
    isRunning,
    isPaused,
    start,
    pause,
    sync,
    reset,
  } = useTimer();

  const getErrorMessage = useCallback(function getErrorMessage(
    error,
    fallbackMessage,
  ) {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallbackMessage
    );
  }, []);

  const applyShiftState = useCallback(function applyShiftState(
    shift,
  ) {
    setCurrentShift(shift);

    if (shift) {
      sync(shift);

      setSelectedProject(function updateProject(previousProject) {
        if (
          previousProject?._id === shift.projectId ||
          previousProject?.id === shift.projectId
        ) {
          return previousProject;
        }

        return {
          _id: shift.projectId,
          id: shift.projectId,
          name: shift.projectName,
          location: shift.location,
        };
      });

      return;
    }

    reset();
  }, [reset, setSelectedProject, sync]);

  const loadCurrentShift = useCallback(async function loadCurrentShift(
    projectId,
  ) {
    try {
      const shift =
        await shiftService.getCurrent(projectId);

      if (shift) {
        applyShiftState(shift);
        return;
      }

      setCurrentShift(null);
      reset();
    } catch (error) {
      console.error("Failed to load current shift:", error);
      setCurrentShift(null);
      reset();
    }
  }, [applyShiftState, reset]);

  /* LOAD ACTIVE SHIFT */
  useEffect(function loadShift() {
    loadCurrentShift(selectedProjectId);
  }, [loadCurrentShift, selectedProjectId]);

  const refreshSelectedProject = useCallback(async () => {
    if (!selectedProjectId) {
      return;
    }

    try {
      const populatedProject = await projectService.getPopulatedById(
        selectedProjectId,
      );

      if (populatedProject) {
        setSelectedProject(populatedProject);
      }
    } catch (error) {
      console.error("Failed to refresh selected project on home:", error);
    }
  }, [selectedProjectId, setSelectedProject]);

  useShiftExitAutoComplete({
    currentShift,
    selectedProject,
    onShiftAutoCompleted: () => {
      setCurrentShift(null);
      reset();

      Alert.alert(
        "Shift completed",
        "You left the project area, so your current shift was ended automatically.",
      );
    },
    onCheckError: (error) => {
      console.error("Failed to verify shift location:", error);
    },
  });

  useFocusEffect(
    React.useCallback(function loadHomeSettings() {
      async function fetchSettings() {
        const [
          savedButtons,
          savedSections,
        ] = await Promise.all([
          getEnabledButtons(),
          getEnabledSections(),
        ]);

        if (savedButtons) {
          setEnabledButtons(savedButtons);
        }

        if (savedSections) {
          setEnabledSections(savedSections);
        }

        await Promise.all([
          loadCurrentShift(selectedProjectId),
          refreshSelectedProject(),
        ]);

        setPreviewRefreshKey((previousKey) => previousKey + 1);
      }

      fetchSettings();
    }, [loadCurrentShift, refreshSelectedProject, selectedProjectId]),
  );

  /* OPEN PROJECTS SCREEN */
  function openProjects() {
    navigation.navigate("Projects", {
      mode: "select",
    });
  }

  function openQuickAction(screen) {
    navigation.navigate(screen);
  }

  const handleHideSection = useCallback(async (sectionId) => {
    const updatedSections = enabledSections.filter((id) => id !== sectionId);
    setEnabledSections(updatedSections);
    await saveEnabledSections(updatedSections);
  }, [enabledSections]);

  function handleCameraPress() {
    navigation.navigate("Camera");
  }

  /* PLAY / PAUSE BUTTON */
  async function handlePlayPause() {
    if (loadingShift) {
      return;
    }

    try {
      setLoadingShift(true);

      if (isRunning) {
        if (!currentShift?.id) {
          throw new Error("Active shift is missing.");
        }

        const pausedShift =
          await shiftService.pause(currentShift.id);

        setCurrentShift(pausedShift);
        pause(pausedShift);
        return;
      }

      if (!selectedProjectId) {
        Alert.alert(
          "Project required",
          "Select a project before starting a shift.",
        );
        return;
      }

      if (
        currentShift?.id &&
        currentShift.projectId === selectedProjectId &&
        currentShift.status === "paused"
      ) {
        const resumedShift =
          await resumeShiftWithGuards({
            shiftId: currentShift.id,
            project: selectedProject,
          });

        setCurrentShift(resumedShift);
        start(resumedShift);
        return;
      }

      const startedShift =
        await startShiftWithLocationGuard({
          projectId: selectedProjectId,
          project: selectedProject,
        });

      setCurrentShift(startedShift);
      start(startedShift);
    } catch (error) {
      console.error("Shift action failed:", error);
      Alert.alert(
        "Shift error",
        getErrorMessage(
          error,
          "Unable to update the shift right now.",
        ),
      );
    } finally {
      setLoadingShift(false);
    }
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 0,
        y: 1,
      }}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.main,
          shouldDistributeBlocksEvenly &&
            styles.mainEvenlyDistributed,
          shouldDistributeBlocksEvenly &&
            scrollViewHeight > 0 && {
              minHeight: scrollViewHeight,
            },
        ]}
        onLayout={function handleScrollViewLayout(event) {
          setScrollViewHeight(event.nativeEvent.layout.height);
        }}
        onContentSizeChange={function handleContentSizeChange(
          _width,
          height,
        ) {
          setContentHeight(height);
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* PROJECT SELECTOR */}
        <ProjectSelector2
          value={selectedProject}
          onPress={openProjects}
          style={[
            styles.selectorTop,
            isLightBlueTheme &&
              styles.selectorLightBlue,
            isCompact
              ? styles.selectorCompact
              : null,
          ]}
          textStyle={
            [
              isLightBlueTheme &&
                styles.selectorTextLightBlue,
              isCompact
                ? styles.selectorTextCompact
                : null,
            ]
          }
          iconStyle={
            [
              isLightBlueTheme &&
                styles.selectorIconLightBlue,
              isCompact
                ? styles.selectorIconCompact
                : null,
            ]
          }
        />

        <View
          style={[
            styles.mainContent,
            shouldDistributeBlocksEvenly &&
              styles.mainContentEvenlySpaced,
          ]}
        >
          <View
            style={[
              styles.mainContentGroup,
              shouldDistributeBlocksEvenly &&
                styles.mainContentGroupExpanded,
            ]}
          >
            <View
              style={[
                styles.coreControlsGroup,
                distributeCoreControlsInternally &&
                  styles.coreControlsGroupEvenlySpaced,
              ]}
            >
              {/* TIMER */}
              <Timer
                hours={
                  formattedTime.hours
                }
                minutes={
                  formattedTime.minutes
                }
                seconds={
                  formattedTime.seconds
                }
                containerStyle={styles.timerContainer}
                textStyle={
                  [
                    isCompact
                      ? styles.timerTextCompact
                      : styles.timerTextRegular,
                    isLightBlueTheme &&
                      styles.timerTextLightBlue,
                  ]
                }
                secondsStyle={
                  [
                    isCompact
                      ? styles.timerSecondsCompact
                      : null,
                    isLightBlueTheme &&
                      styles.timerSecondsLightBlue,
                  ]
                }
              />

              {showCoreSpacers ? (
                <View style={styles.timerToActionsSpacer} />
              ) : null}

              {/* ACTION BUTTONS */}
              <MainActionButtons
                isRunning={isRunning}
                isPaused={isPaused}
                loading={loadingShift}
                onPlayPress={handlePlayPause}
                onCameraPress={handleCameraPress}
                compact={isCompact}
                veryCompact={isVeryCompact}
                actionButtonColor={
                  isLightBlueTheme
                    ? theme.colors.primary
                    : undefined
                }
                actionIconColor={
                  isLightBlueTheme
                    ? "#FFFFFF"
                    : undefined
                }
                cameraButtonColor={
                  isLightBlueTheme
                    ? "#FFFFFF"
                    : undefined
                }
                cameraIconColor={
                  isLightBlueTheme
                    ? theme.colors.text
                    : undefined
                }
              />

              {showCoreSpacers ? (
                <View style={styles.actionsToQuickActionsSpacer} />
              ) : null}

              <View style={styles.quickActionsGrid}>
                {visibleQuickButtons.map(function renderButton(button, index) {
                  const isSingleLastItem =
                    visibleQuickButtons.length % 2 === 1 &&
                    index === visibleQuickButtons.length - 1;

                  return (
                    <TouchableOpacity
                      key={button.id}
                      style={[
                        styles.quickActionCard,
                        isSingleLastItem && styles.quickActionCardFullWidth,
                      ]}
                      onPress={function onButtonPress() {
                        openQuickAction(button.screen);
                      }}
                    >
                      <View style={styles.quickActionIconWrapper}>
                        {button.vectorIcon ? (
                          <Icon
                            name={button.vectorIcon}
                            size={theme.colors.homeButtonIconSize || 28}
                            color={
                              theme.colors.homeButtonText ||
                              (isLightBlueTheme ? theme.colors.text : "#FFFFFF")
                            }
                          />
                        ) : (
                          <Image
                            source={button.icon}
                            style={styles.quickActionIcon}
                          />
                        )}
                        {button.id === "chats" ? (
                          <UnreadBadge count={unreadCount} />
                        ) : null}
                      </View>

                      <Text style={styles.quickActionText}>
                        {button.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {enabledSections.includes("shift-history") && (
              <ShiftHistoryPreview
                colorMode={isLightBlueTheme ? "light" : "dark"}
                refreshKey={previewRefreshKey}
                onClose={() => handleHideSection("shift-history")}
              />
            )}

            {enabledSections.includes("project-files") && (
              <ProjectFilesSection
                project={selectedProject}
                colorMode={isLightBlueTheme ? "light" : "dark"}
                refreshKey={previewRefreshKey}
                onClose={() => handleHideSection("project-files")}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <FooterButtonsVariant2
        iconStyle={
          isLightBlueTheme
            ? styles.footerIconLightBlue
            : null
        }
      />
    </LinearGradient>
  );
}