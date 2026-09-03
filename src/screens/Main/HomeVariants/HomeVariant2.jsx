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
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  InteractionManager,
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "../../../utils/apiError";

import AuthContext from "../../../contexts/AuthContext";
import { useTheme } from "../../../theme/ThemeContext";

import { useTimer } from "../../../hooks/useTimer";
import { useShiftExitAutoComplete } from "../../../hooks/useShiftExitAutoComplete";

import { Timer } from "../../../components/common/Timer/Timer";
import { HoursWheelPicker } from "../../../components/common/HoursWheelPicker/HoursWheelPicker";

import shiftService from "../../../services/shift.service";
import { projectService } from "../../../services";
import {
  assertShiftStartAllowed,
  completeShiftSerialized,
  pauseShiftSerialized,
  resumeShiftWithGuards,
  startShiftWithLocationGuard,
} from "../../../utils/shiftLocationGuard";
import { createShiftGeofenceHandlers } from "../../../utils/shiftGeofenceHandlers";
import { handleProjectSwitch } from "../../../tasks/shiftAutoTransition";

import { createStyles } from "./HomeVariant2.styles";

import ProjectSelector2 from "../../../components/common/projectSelector/projectSelector";
import { MainActionButtons } from "../../../components/common/mainActionButtons/mainActionButtons";

import { BottomBar } from "../../../components/common/BottomBar/BottomBar";

import ProjectFilesSection from "../../../components/common/ProjectFilesSection/ProjectFilesSection";
import MainButtonsGrid from "../../../components/common/NavButtonsGrid/MainButtonsGrid";
import CustomizeHomeScreen from "../../Menu/CustomizeHomeScreen";
import {
  mainButtons,
  getDefaultEnabledButtons,
  getDefaultEnabledSections,
  homeSections,
} from "../../../constants/mainButtons";
import {
  getEnabledButtons,
  getEnabledSections,
  saveEnabledSections,
  getSectionsOrder,
  getButtonsOrder,
  getSecondaryAction,
} from "../../../utils/homeButtonsStorage";
import ShiftHistoryPreview from "../../../components/common/ShiftHistoryPreview/ShiftHistoryPreview";
import TasksPreview from "../../../components/common/TasksPreview/TasksPreview";
import { isHomeButtonVisible } from "../../../utils/userRoles";
import { HomeOnboarding } from "../../../components/common/HomeOnboarding/HomeOnboarding";
import { useOnboardingProgress } from "../../../hooks/useOnboardingProgress";
import { setOnboardingDismissed } from "../../../utils/onboardingStorage";

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
  const { t } = useTranslation();
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
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isVeryCompact = screenHeight <= 700;
  const isCompact = screenHeight <= 780;
  // Fixed height for the clock line so swapping the clock for the hours wheel
  // never shifts the digits or the round buttons. Matches the timer line height.
  const timerSlotHeight = isVeryCompact ? 96 : isCompact ? 112 : 132;
  const timerWheelFontSize = isVeryCompact ? 100 : isCompact ? 118 : 140;
  const timerLetterSpacing = isVeryCompact ? -1.4 : isCompact ? -2 : -2.5;
  /* SELECTED PROJECT */
  const { selectedProject, setSelectedProject, user } = useContext(AuthContext);
  const selectedProjectId = selectedProject?._id || selectedProject?.id;
  const selectedProjectIdRef = useRef(selectedProjectId);
  selectedProjectIdRef.current = selectedProjectId;

  /* NAVIGATION */
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Space the floating BottomBar occupies (its bottom offset + pill height +
  // a gap), so the scroll content clears it and the last blocks never hide
  // behind the menu when many buttons/sections are enabled.
  const bottomBarClearance =
    (Platform.OS === "android" ? insets.bottom + 12 : 30) + 97;

  // "Kom igång" first-run checklist — role-aware (worker vs admin steps),
  // shows until done or dismissed.
  const [onboardingHidden, setOnboardingHidden] = useState(false);
  const onboarding = useOnboardingProgress({ role: user?.role });
  function dismissOnboarding() {
    setOnboardingHidden(true);
    setOnboardingDismissed();
  }

  /* CUSTOMIZE DRAWER — the customize panel slides in over Home at 70% width so
     theme / layout changes preview live on the exposed part of the home screen.
     Rendered as an in-tree overlay (not a route) so a theme change is a plain
     re-render of Home, never a native-stack transition (which raced Fabric). */
  const CUSTOMIZE_WIDTH = Math.round(screenWidth * 0.5);
  const [customizeMounted, setCustomizeMounted] = useState(false);
  const drawerX = useRef(new Animated.Value(-CUSTOMIZE_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openCustomize = useCallback(() => {
    setCustomizeMounted(true);
    drawerX.setValue(-CUSTOMIZE_WIDTH);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(drawerX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          // Light scrim: dims the exposed 30% enough to read as an overlay
          // while keeping the live home preview clearly visible behind it.
          toValue: 0.45,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [CUSTOMIZE_WIDTH, drawerX, backdropOpacity]);

  const closeCustomize = useCallback(() => {
    Animated.parallel([
      Animated.timing(drawerX, {
        toValue: -CUSTOMIZE_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setCustomizeMounted(false);
      }
    });
  }, [CUSTOMIZE_WIDTH, drawerX, backdropOpacity]);

  // Deep-link from the Menu's "Customize home" item: open the drawer, then
  // clear the one-shot param so it doesn't re-open on the next focus.
  useEffect(() => {
    if (route.params?.openCustomize) {
      openCustomize();
      navigation.setParams({ openCustomize: undefined });
    }
  }, [route.params?.openCustomize, openCustomize, navigation]);

  /* LOADING STATE */
  const [loadingShift, setLoadingShift] = useState(false);

  /* CURRENT ACTIVE SHIFT */
  const [currentShift, setCurrentShift] = useState(null);
  const currentShiftRef = useRef(currentShift);
  currentShiftRef.current = currentShift;
  const focusFetchIdRef = useRef(0);
  const projectsNavigationPendingRef = useRef(false);
  const [enabledButtons, setEnabledButtons] = useState(() =>
    getDefaultEnabledButtons(user?.role),
  );
  const [secondaryAction, setSecondaryAction] = useState("camera");
  // Manual-hours edit mode (hours secondary button): the top clock turns into
  // an hours/minutes wheel and the pencil becomes a save checkmark.
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [enabledSections, setEnabledSections] = useState(() =>
    getDefaultEnabledSections(user?.role),
  );
  const [sectionsOrder, setSectionsOrder] = useState(
    homeSections.map((section) => section.id),
  );
  const [buttonsOrder, setButtonsOrder] = useState(() =>
    mainButtons.map((button) => button.id),
  );
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Live preview: the customize drawer pushes each config change straight into
  // Home's own state, so toggling a button/section (or the secondary button)
  // shows/hides it behind the drawer instantly — not only after the next focus
  // reload from storage.
  const handleCustomizeLiveChange = useCallback((patch) => {
    if (patch.enabledButtons) setEnabledButtons(patch.enabledButtons);
    if (patch.enabledSections) setEnabledSections(patch.enabledSections);
    if (patch.sectionsOrder) setSectionsOrder(patch.sectionsOrder);
    if (patch.buttonsOrder) setButtonsOrder(patch.buttonsOrder);
    if (patch.secondaryAction) setSecondaryAction(patch.secondaryAction);
  }, []);

  // Memoize the drawer content so unrelated Home re-renders (e.g. the 1 Hz
  // shift timer) don't re-render the whole customize panel; it still re-renders
  // on theme change (its own useTheme) and on its own toggles.
  const customizeContent = useMemo(
    () => (
      <CustomizeHomeScreen
        embedded
        onClose={closeCustomize}
        onLiveChange={handleCustomizeLiveChange}
      />
    ),
    [closeCustomize, handleCustomizeLiveChange],
  );
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
  const {
    formattedTime,
    timeElapsed,
    isRunning,
    isPaused,
    start,
    pause,
    sync,
    reset,
  } = useTimer();

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

      // Completing the old project's shift and picking up the new project's
      // shift run as one queued transition, so a start for the new project can
      // never overtake the complete for the old one. The location monitor
      // decides afterwards whether the worker is actually inside the new area.
      handleProjectSwitch({
        fromProjectId: prevId,
        fromShiftId: activeShift.id,
        toProjectId: selectedProjectId,
      }).catch((err) =>
        console.error("Failed to auto-complete shift on project switch:", err),
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
          const [
            savedButtons,
            savedSections,
            savedSectionsOrder,
            savedButtonsOrder,
            savedSecondary,
          ] = await Promise.all([
            getEnabledButtons(),
            getEnabledSections(),
            getSectionsOrder(),
            getButtonsOrder(),
            getSecondaryAction(),
          ]);

          if (fetchId !== focusFetchIdRef.current) {
            return;
          }

          setEnabledButtons(
            savedButtons ?? getDefaultEnabledButtons(user?.role),
          );

          setEnabledSections(
            savedSections ?? getDefaultEnabledSections(user?.role),
          );

          if (savedSectionsOrder) {
            setSectionsOrder(savedSectionsOrder);
          }

          if (savedButtonsOrder) {
            setButtonsOrder(savedButtonsOrder);
          }

          if (savedSecondary) {
            setSecondaryAction(savedSecondary);
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
      [loadCurrentShift, refreshSelectedProject, user?.role],
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

  // Upsert a manual-hours entry for today on the selected project. Logging
  // hours manually supersedes a live timer: if a shift is ticking (status
  // "active"), stop it first so the manual total isn't double-counted.
  const saveManualHours = useCallback(
    async function saveManualHours(durationMs) {
      if (!selectedProjectId) {
        showShiftAlert(
          t("home.projectRequired"),
          t("home.selectProjectBeforeHours"),
        );
        return false;
      }
      if (!durationMs || durationMs <= 0) {
        return false;
      }

      // Logging hours by hand must obey the same on-site rule as starting a
      // shift: someone who can't clock in away from the project address can't
      // enter the time manually either.
      try {
        await assertShiftStartAllowed({
          project: selectedProject,
          fallbackProjectLocation: selectedProject?.location,
        });
      } catch (guardError) {
        showShiftAlert(
          t("home.manualHoursBlockedTitle"),
          getApiErrorMessage(guardError, t("home.manualHoursBlockedMessage")),
        );
        return false;
      }

      const now = new Date();
      const pad = (value) => String(value).padStart(2, "0");
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
      )}`;

      try {
        const activeShift = currentShiftRef.current;
        if (activeShift?.id && activeShift.status === "active") {
          try {
            await completeShiftSerialized(activeShift.id);
          } catch (stopError) {
            console.error(
              "Failed to stop running shift before logging hours:",
              stopError,
            );
          }
          setCurrentShift(null);
          reset();
        }

        await shiftService.addManualHours({
          workerId: user?._id || user?.id,
          projectId: selectedProjectId,
          date,
          durationMs,
        });
        setPreviewRefreshKey((previousKey) => previousKey + 1);
        return true;
      } catch (error) {
        console.error("Failed to save manual hours:", error);
        showShiftAlert(t("common.error"), t("home.saveHoursError"));
        return false;
      }
    },
    [selectedProjectId, selectedProject, user, reset, t],
  );

  // Enter edit mode: seed the wheel from the currently-tracked time so the
  // worker can fine-tune rather than start from zero. Switching to manual
  // entry also stops the live timer right away (the shift is completed).
  async function handleEnterEditHours() {
    // Block off-site / out-of-schedule workers before opening the editor (and
    // before stopping their running shift), so manual entry can't sidestep the
    // on-site requirement that gates starting a shift.
    if (selectedProjectId) {
      try {
        await assertShiftStartAllowed({
          project: selectedProject,
          fallbackProjectLocation: selectedProject?.location,
        });
      } catch (guardError) {
        showShiftAlert(
          t("home.manualHoursBlockedTitle"),
          getApiErrorMessage(guardError, t("home.manualHoursBlockedMessage")),
        );
        return;
      }
    }

    const totalMs = timeElapsed || 0;
    setEditHours(Math.min(24, Math.floor(totalMs / 3600000)));
    setEditMinutes(Math.floor((totalMs % 3600000) / 60000));
    setIsEditingHours(true);

    const activeShift = currentShiftRef.current;
    if (activeShift?.id && activeShift.status === "active") {
      try {
        await completeShiftSerialized(activeShift.id);
      } catch (error) {
        console.error("Failed to stop running shift on manual edit:", error);
      }
      setCurrentShift(null);
      reset();
    }
  }

  async function handleConfirmEditHours() {
    const durationMs = editHours * 3600000 + editMinutes * 60000;
    setIsEditingHours(false);
    const saved = await saveManualHours(durationMs);
    if (saved) {
      // Show the saved total on the top display instead of resetting to 00:00.
      sync({ durationMs, status: "completed" });
    }
  }

  // Close the editor without saving. The shift was already stopped when the
  // editor opened, so the clock stays where it is.
  function handleCancelEditHours() {
    setIsEditingHours(false);
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

        const pausedShift = await pauseShiftSerialized({
          shiftId: currentShift.id,
          projectId: currentShift.projectId || selectedProjectId,
        });

        setCurrentShift(pausedShift);
        pause(pausedShift);
        return;
      }

      if (!selectedProjectId) {
        showShiftAlert(
          t("home.projectRequired"),
          t("home.selectProjectBeforeShift"),
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
        t("home.shiftErrorTitle"),
        getApiErrorMessage(error, t("home.shiftErrorMessage")),
      );
    } finally {
      setLoadingShift(false);
    }
  }

  // The home sections (shift-history / tasks / project-files previews) do NOT
  // depend on the clock, but the timer's 1 Hz `timeElapsed` state re-renders
  // this whole screen every second. Memoize the section subtree so a tick only
  // re-renders the clock, not these (data-fetching) preview cards.
  const sectionElements = useMemo(
    () =>
      sectionsOrder.map(function renderSection(sectionId) {
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
      }),
    [
      sectionsOrder,
      enabledSections,
      isLightBlueTheme,
      previewRefreshKey,
      selectedProject,
      handleHideSection,
    ],
  );

  // Static grid (no props) — memoize the element so the timer tick doesn't
  // re-render it each second.
  const mainButtonsGrid = useMemo(
    () => (
      <MainButtonsGrid
        enabledButtonsOverride={enabledButtons}
        buttonsOrderOverride={buttonsOrder}
      />
    ),
    [enabledButtons, buttonsOrder],
  );

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
      // On web the fixed native top padding double-counts the status bar; use
      // the real safe-area inset instead (env-based on iOS PWA, 0 on desktop).
      style={[
        styles.container,
        Platform.OS === "web" && { paddingTop: insets.top },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.main,
          shouldDistributeBlocksEvenly && styles.mainEvenlyDistributed,
          shouldDistributeBlocksEvenly && scrollViewHeight > 0
            ? // Distributed (short) layout: fit within the space above the bar
              // so the last block isn't covered.
              { minHeight: Math.max(0, scrollViewHeight - bottomBarClearance) }
            : // Scrolling (tall) layout: pad the bottom so content clears the bar.
              { paddingBottom: bottomBarClearance },
        ]}
        onLayout={function handleScrollViewLayout(event) {
          setScrollViewHeight(event.nativeEvent.layout.height);
        }}
        onContentSizeChange={function handleContentSizeChange(_width, height) {
          setContentHeight(height);
        }}
        showsVerticalScrollIndicator={false}
      >
        {onboarding.visible && !onboardingHidden ? (
          <HomeOnboarding
            steps={onboarding.steps}
            completed={onboarding.completed}
            total={onboarding.total}
            onDismiss={dismissOnboarding}
          />
        ) : null}

        {/* PROJECT SELECTOR — dimmed & inactive while editing hours */}
        <View
          style={isEditingHours && styles.inactiveDimmed}
          pointerEvents={isEditingHours ? "none" : "auto"}
        >
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
        </View>

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
              {/* The clock stays in the layout (hidden while editing) so nothing
                  below moves. The hours wheel + Done button live in a full-screen
                  blurred overlay rendered at the bottom of this file. */}
              <View style={styles.timerSlot}>
                <Timer
                  hours={formattedTime.hours}
                  minutes={formattedTime.minutes}
                  seconds={formattedTime.seconds}
                  containerStyle={[
                    styles.timerContainer,
                    isEditingHours && styles.timerHidden,
                  ]}
                  textStyle={[
                    isCompact
                      ? styles.timerTextCompact
                      : styles.timerTextRegular,
                    isLightBlueTheme && styles.timerTextLightBlue,
                  ]}
                  secondsStyle={[
                    isCompact ? styles.timerSecondsCompact : null,
                    isLightBlueTheme && styles.timerSecondsLightBlue,
                  ]}
                />
              </View>

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
                secondaryMode={secondaryAction}
                isEditingHours={isEditingHours}
                onEnterEditHours={handleEnterEditHours}
                compact={isCompact}
                veryCompact={isVeryCompact}
                actionButtonColor={
                  isLightBlueTheme || themeName === "black"
                    ? theme.colors.primary
                    : undefined
                }
                actionIconColor={
                  isLightBlueTheme || themeName === "black"
                    ? "#FFFFFF"
                    : undefined
                }
                // Figma dark home: soft blue halo behind the play button.
                actionButtonGlow={
                  themeName === "black" ? theme.colors.glow : undefined
                }
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

              <View
                style={isEditingHours && styles.inactiveDimmed}
                pointerEvents={isEditingHours ? "none" : "auto"}
              >
                {mainButtonsGrid}
              </View>
            </View>

            <View
              style={[
                styles.mainContentGroup,
                isEditingHours && styles.inactiveDimmed,
              ]}
              pointerEvents={isEditingHours ? "none" : "auto"}
            >
              {sectionElements}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER — shared bottom bar, frosted glass over the gradient.
          Dimmed & inactive while editing hours, like the other blocks. */}
      <View
        style={isEditingHours && styles.inactiveDimmed}
        pointerEvents={isEditingHours ? "none" : "auto"}
      >
        <BottomBar
          glass
          // Only the black theme gets the dark pill. The blue theme keeps its
          // light frosted pill.
          darkOverride={themeName === "black"}
          // Tint the nav icons: white only on the black theme (dark pill); the
          // blue theme keeps the original dark-navy icons over its light frosted
          // pill; light themes use their own text colour.
          iconColor={
            themeName === "black"
              ? "#FFFFFF"
              : isLightBlueTheme
                ? theme.colors.text
                : "#052D50"
          }
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={false}
        />
      </View>

      {/* Manual-hours editor: a full-screen blurred overlay with the hours
          wheel sitting a bit lower, and a "Done" button pinned to the bottom. */}
      {isEditingHours ? (
        <View style={styles.editOverlay}>
          <BlurView
            intensity={40}
            tint={isLightBlueTheme ? "light" : "dark"}
            style={styles.editBlur}
          />
          <View
            style={[
              styles.editContent,
              {
                paddingTop: insets.top + 24,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <HoursWheelPicker
              hours={editHours}
              minutes={editMinutes}
              onChange={(h, m) => {
                setEditHours(h);
                setEditMinutes(m);
              }}
              textColor={isLightBlueTheme ? theme.colors.text : "#FFFFFF"}
              fontSize={timerWheelFontSize}
              itemHeight={timerSlotHeight}
              peek={timerSlotHeight}
              letterSpacing={timerLetterSpacing}
            />

            <View style={styles.doneGap} />

            {/* Cancel (left) + Done (right). The whole group is centred
                vertically so the space above and below is equal. */}
            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={styles.doneRound}
                onPress={handleCancelEditHours}
                activeOpacity={0.85}
              >
                <Icon
                  name="x"
                  size={40}
                  color={isLightBlueTheme ? theme.colors.text : "#FFFFFF"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneRound}
                onPress={handleConfirmEditHours}
                activeOpacity={0.85}
              >
                <Icon
                  name="check"
                  size={40}
                  color={isLightBlueTheme ? theme.colors.text : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {/* CUSTOMIZE DRAWER — 70% slide-in over Home. The backdrop dims the
          exposed 30% just enough to read as a scrim while keeping the live
          home preview visible; tapping it (or the header button) closes. */}
      {customizeMounted ? (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#000", opacity: backdropOpacity },
            ]}
          >
            <Pressable style={styles.flexFill} onPress={closeCustomize} />
          </Animated.View>

          <Animated.View
            style={[
              styles.customizeDrawer,
              {
                width: CUSTOMIZE_WIDTH,
                backgroundColor: theme.content.background,
                transform: [{ translateX: drawerX }],
              },
            ]}
          >
            {customizeContent}
          </Animated.View>
        </View>
      ) : null}
    </LinearGradient>
  );
}
