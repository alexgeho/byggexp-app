import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  InteractionManager,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { useFocusEffect, useNavigation } from "@react-navigation/native";

import AuthContext from "../../../contexts/AuthContext";
import { useTheme } from "../../../theme/ThemeContext";

import { useTimer } from "../../../hooks/useTimer";
import { useShiftExitAutoComplete } from "../../../hooks/useShiftExitAutoComplete";

import { Timer } from "../../../components/common/Timer/Timer";

import shiftService from "../../../services/shift.service";
import { projectService } from "../../../services";
import {
  resumeShiftWithGuards,
  startShiftWithLocationGuard,
} from "../../../utils/shiftLocationGuard";
import { createShiftGeofenceHandlers } from "../../../utils/shiftGeofenceHandlers";

import { createStyles } from "./HomeVariant2.styles";

import ProjectSelector2 from "../../../components/common/projectSelector/projectSelector";
import { MainActionButtons } from "../../../components/common/mainActionButtons/mainActionButtons";

import { BottomBar } from "../../../components/common/BottomBar/BottomBar";

import ProjectFilesSection from "../../../components/common/ProjectFilesSection/ProjectFilesSection";
import MainButtonsGrid from "../../../components/common/NavButtonsGrid/MainButtonsGrid";
import {
  mainButtons,
  defaultEnabledButtons,
  defaultEnabledSections,
  homeSections,
} from "../../../constants/mainButtons";
import {
  getEnabledButtons,
  getEnabledSections,
  saveEnabledSections,
  getSectionsOrder,
} from "../../../utils/homeButtonsStorage";
import ShiftHistoryPreview from "../../../components/common/ShiftHistoryPreview/ShiftHistoryPreview";
import TasksPreview from "../../../components/common/TasksPreview/TasksPreview";
import { isHomeButtonVisible } from "../../../utils/userRoles";

// react-native-web's Alert.alert is a no-op, so on web the shift-guard messages
// (e.g. "You are not at the project location…") never reach the user and the
// shift just silently fails to start. Fall back to the browser dialog there.
function showShiftAlert(title, message) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}

export default function HomeVariant2() {
  const { theme, themeName } = useTheme();
  // Light-background home themes share the same "light" treatment
  // (dark timer text, blue play button, white camera, dark footer icons).
  const isLightBlueTheme =
    themeName === "lightBlue" ||
    themeName === "colorful" ||
    themeName === "lightGray";
  const gradientColors = useMemo(
    () =>
      ({
        blue: ["#5BC8FF", "#0D5DB8"],
        blueDarkText: ["#5BC8FF", "#0D5DB8"],
        black: ["#1C1C1C", "#1C1C1C"],
        lightBlue: ["#ECF6FF", "#ECF6FF"],
        lightGray: ["#EEEEEE", "#EEEEEE"],
        colorful: ["#EEEEEE", "#EEEEEE"],
        green: ["#8ED057", "#4C9E3C"],
        orange: ["#FFAE63", "#F97316"],
        darkGray: ["#363636", "#121212"],
      })[themeName] || ["#5BC8FF", "#0D5DB8"],
    [themeName],
  );
  const { height: screenHeight } = useWindowDimensions();
  const isVeryCompact = screenHeight <= 700;
  const isCompact = screenHeight <= 780;
  /* SELECTED PROJECT */
  const { selectedProject, setSelectedProject, user } = useContext(AuthContext);
  const selectedProjectId = selectedProject?._id || selectedProject?.id;
  const selectedProjectIdRef = useRef(selectedProjectId);
  selectedProjectIdRef.current = selectedProjectId;

  /* NAVIGATION */
  const navigation = useNavigation();

  /* LOADING STATE */
  const [loadingShift, setLoadingShift] = useState(false);

  /* CURRENT ACTIVE SHIFT */
  const [currentShift, setCurrentShift] = useState(null);
  const currentShiftRef = useRef(currentShift);
  currentShiftRef.current = currentShift;
  const focusFetchIdRef = useRef(0);
  const projectsNavigationPendingRef = useRef(false);
  const [enabledButtons, setEnabledButtons] = useState(defaultEnabledButtons);
  const [enabledSections, setEnabledSections] = useState(
    defaultEnabledSections,
  );
  const [sectionsOrder, setSectionsOrder] = useState(
    homeSections.map((section) => section.id),
  );
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const visibleQuickButtons = useMemo(
    () =>
      mainButtons.filter(function filterButton(button) {
        return isHomeButtonVisible(button, enabledButtons, user?.role);
      }),
    [enabledButtons, user?.role],
  );
  const hasSections =
    enabledSections.includes("shift-history") ||
    enabledSections.includes("project-files");
  const quickButtonCount = visibleQuickButtons.length;
  const useFixedCoreSpacing =
    quickButtonCount === 4 ||
    ((quickButtonCount === 1 || quickButtonCount === 2) && hasSections);
  const contentFitsVisibleArea =
    scrollViewHeight > 0 &&
    contentHeight > 0 &&
    contentHeight <= scrollViewHeight;
  const distributeCoreControlsInternally =
    !hasSections && !useFixedCoreSpacing && contentFitsVisibleArea;
  const shouldDistributeBlocksEvenly = distributeCoreControlsInternally;
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
    [hasSections, isCompact, isLightBlueTheme, theme, isVeryCompact],
  );

  /* TIMER LOGIC */
  const { formattedTime, isRunning, isPaused, start, pause, sync, reset } =
    useTimer();

  const getErrorMessage = useCallback(function getErrorMessage(
    error,
    fallbackMessage,
  ) {
    return error?.response?.data?.message || error?.message || fallbackMessage;
  }, []);

  const applyShiftState = useCallback(
    function applyShiftState(shift) {
      setCurrentShift(shift);

      if (shift) {
        sync(shift);

        // If no project is currently selected (e.g. fresh install or data
        // cleared), restore it from the running shift so the UI is consistent.
        // Do NOT override a project the user has already explicitly selected —
        // that caused the flickering / Fabric crash fixed in 81e4c7e.
        if (!selectedProjectIdRef.current && shift.projectId) {
          setSelectedProject({
            _id: shift.projectId,
            id: shift.projectId,
            name: shift.projectName,
            location: shift.location,
          });
        }

        return;
      }

      reset();
    },
    [reset, setSelectedProject, sync],
  );

  const loadCurrentShift = useCallback(
    async function loadCurrentShift(projectId) {
      try {
        const shift = await shiftService.getCurrent(projectId);

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
    },
    [applyShiftState, reset],
  );

  /* LOAD ACTIVE SHIFT */
  useEffect(
    function loadShift() {
      const task = InteractionManager.runAfterInteractions(() => {
        loadCurrentShift(selectedProjectId);
      });
      return () => task.cancel();
    },
    [loadCurrentShift, selectedProjectId],
  );

  /* AUTO-COMPLETE SHIFT WHEN USER SWITCHES PROJECT */
  const prevProjectIdRef = useRef(selectedProjectId);
  useEffect(
    function stopShiftOnProjectSwitch() {
      const prevId = prevProjectIdRef.current;
      prevProjectIdRef.current = selectedProjectId;

      if (!prevId || !selectedProjectId || prevId === selectedProjectId) {
        return;
      }

      const activeShift = currentShiftRef.current;
      if (!activeShift?.id) {
        return;
      }

      setCurrentShift(null);
      reset();
      shiftService
        .complete(activeShift.id)
        .catch((err) =>
          console.error(
            "Failed to auto-complete shift on project switch:",
            err,
          ),
        );
    },
    [selectedProjectId, reset],
  );

  const refreshSelectedProject = useCallback(async () => {
    const projectId = selectedProjectIdRef.current;

    if (!projectId) {
      return;
    }

    try {
      const populatedProject = await projectService.getPopulatedById(projectId);

      if (populatedProject && selectedProjectIdRef.current === projectId) {
        setSelectedProject(populatedProject);
      }
    } catch (error) {
      console.error("Failed to refresh selected project on home:", error);
    }
  }, [setSelectedProject]);

  const geofenceHandlers = useMemo(
    () =>
      createShiftGeofenceHandlers({
        applyShiftState,
        reset,
        setCurrentShift,
        start,
      }),
    [applyShiftState, reset, start],
  );

  useShiftExitAutoComplete({
    currentShift,
    selectedProject,
    ...geofenceHandlers,
  });

  useFocusEffect(
    React.useCallback(
      function loadHomeSettings() {
        projectsNavigationPendingRef.current = false;
        const fetchId = ++focusFetchIdRef.current;

        async function fetchSettings() {
          const [savedButtons, savedSections, savedSectionsOrder] =
            await Promise.all([
              getEnabledButtons(),
              getEnabledSections(),
              getSectionsOrder(),
            ]);

          if (fetchId !== focusFetchIdRef.current) {
            return;
          }

          if (savedButtons) {
            setEnabledButtons(savedButtons);
          }

          if (savedSections) {
            setEnabledSections(savedSections);
          }

          if (savedSectionsOrder) {
            setSectionsOrder(savedSectionsOrder);
          }

          await Promise.all([
            loadCurrentShift(selectedProjectIdRef.current),
            refreshSelectedProject(),
          ]);

          if (fetchId !== focusFetchIdRef.current) {
            return;
          }

          setPreviewRefreshKey((previousKey) => previousKey + 1);
        }

        // Defer the whole state burst until the navigation transition settles.
        // Running it while returning to Home (e.g. after picking a project)
        // re-rendered Home mid-transition and raced Fabric on the New Arch,
        // crashing with "Unable to find viewState for tag".
        const task = InteractionManager.runAfterInteractions(() => {
          fetchSettings();
        });

        return () => {
          task.cancel();
          focusFetchIdRef.current++;
        };
      },
      [loadCurrentShift, refreshSelectedProject],
    ),
  );

  /* OPEN PROJECTS SCREEN */
  function openProjects() {
    if (projectsNavigationPendingRef.current) {
      return;
    }

    projectsNavigationPendingRef.current = true;
    navigation.navigate("Projects", {
      mode: "select",
    });
  }

  const handleHideSection = useCallback(
    async (sectionId) => {
      const updatedSections = enabledSections.filter((id) => id !== sectionId);
      setEnabledSections(updatedSections);
      await saveEnabledSections(updatedSections);
    },
    [enabledSections],
  );

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

        const pausedShift = await shiftService.pause(currentShift.id);

        setCurrentShift(pausedShift);
        pause(pausedShift);
        return;
      }

      if (!selectedProjectId) {
        showShiftAlert(
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
        const resumedShift = await resumeShiftWithGuards({
          shiftId: currentShift.id,
          project: selectedProject,
        });

        setCurrentShift(resumedShift);
        start(resumedShift);
        return;
      }

      const startedShift = await startShiftWithLocationGuard({
        projectId: selectedProjectId,
        project: selectedProject,
      });

      setCurrentShift(startedShift);
      start(startedShift);
    } catch (error) {
      console.error("Shift action failed:", error);
      showShiftAlert(
        "Shift error",
        getErrorMessage(error, "Unable to update the shift right now."),
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
          shouldDistributeBlocksEvenly && styles.mainEvenlyDistributed,
          shouldDistributeBlocksEvenly &&
            scrollViewHeight > 0 && {
              minHeight: scrollViewHeight,
            },
          themeName === "colorful" && { paddingBottom: 136 },
        ]}
        onLayout={function handleScrollViewLayout(event) {
          setScrollViewHeight(event.nativeEvent.layout.height);
        }}
        onContentSizeChange={function handleContentSizeChange(_width, height) {
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
            isLightBlueTheme && styles.selectorLightBlue,
            themeName === "colorful" && styles.selectorColorful,
            isCompact ? styles.selectorCompact : null,
          ]}
          textStyle={[
            isLightBlueTheme && styles.selectorTextLightBlue,
            themeName === "colorful" && styles.selectorTextColorful,
            isCompact ? styles.selectorTextCompact : null,
          ]}
          iconStyle={[
            isLightBlueTheme && styles.selectorIconLightBlue,
            themeName === "colorful" && styles.selectorIconColorful,
            isCompact ? styles.selectorIconCompact : null,
          ]}
        />

        <View
          style={[
            styles.mainContent,
            shouldDistributeBlocksEvenly && styles.mainContentEvenlySpaced,
          ]}
        >
          <View
            style={[
              styles.mainContentGroup,
              shouldDistributeBlocksEvenly && styles.mainContentGroupExpanded,
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
                hours={formattedTime.hours}
                minutes={formattedTime.minutes}
                seconds={formattedTime.seconds}
                containerStyle={styles.timerContainer}
                textStyle={[
                  isCompact ? styles.timerTextCompact : styles.timerTextRegular,
                  isLightBlueTheme && styles.timerTextLightBlue,
                ]}
                secondsStyle={[
                  isCompact ? styles.timerSecondsCompact : null,
                  isLightBlueTheme && styles.timerSecondsLightBlue,
                ]}
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
                  isLightBlueTheme ? theme.colors.primary : undefined
                }
                actionIconColor={isLightBlueTheme ? "#FFFFFF" : undefined}
                cameraButtonColor={
                  isLightBlueTheme ? "#FFFFFF" : "rgba(255,255,255,0.20)"
                }
                cameraIconColor={
                  isLightBlueTheme ? theme.colors.text : "#FFFFFF"
                }
              />

              {showCoreSpacers ? (
                <View style={styles.actionsToQuickActionsSpacer} />
              ) : null}

              <MainButtonsGrid />
            </View>

            {sectionsOrder.map(function renderSection(sectionId) {
              if (!enabledSections.includes(sectionId)) {
                return null;
              }

              const colorMode = isLightBlueTheme ? "light" : "dark";

              if (sectionId === "shift-history") {
                return (
                  <ShiftHistoryPreview
                    key={sectionId}
                    colorMode={colorMode}
                    refreshKey={previewRefreshKey}
                    onClose={() => handleHideSection("shift-history")}
                  />
                );
              }

              if (sectionId === "tasks-history") {
                return (
                  <TasksPreview
                    key={sectionId}
                    colorMode={colorMode}
                    refreshKey={previewRefreshKey}
                    onClose={() => handleHideSection("tasks-history")}
                  />
                );
              }

              if (sectionId === "project-files") {
                return (
                  <ProjectFilesSection
                    key={sectionId}
                    project={selectedProject}
                    colorMode={colorMode}
                    refreshKey={previewRefreshKey}
                    onClose={() => handleHideSection("project-files")}
                  />
                );
              }

              return null;
            })}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER — shared bottom bar, frosted glass over the gradient */}
      <BottomBar
        glass
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </LinearGradient>
  );
}
