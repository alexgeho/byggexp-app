import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  View,
  Alert,
} from "react-native";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import { useTheme } from "@theme/ThemeContext";
import AuthContext from "@contexts/AuthContext";
import { useTimer } from "@hooks/useTimer";
import { shiftService } from "@services";
import { createStyles } from "./HomeVariant1green.styles";
import { getEnabledSections } from "@utils/homeButtonsStorage";
import ProjectSelector from "@components/common/ProjectSelector/ProjectSelector";
import MainButtonsGrid from "@components/common/NavButtonsGrid/MainButtonsGrid";
import ProjectFilesSection from "@components/common/ProjectFilesSection/ProjectFilesSection";
import TimerDisplay from "@components/common/TimerDisplay/TimerDisplay";
import PlayButton from "@components/common/PlayButton/PlayButton";
import TimerProgress from "@components/common/TimerProgress/TimerProgress";
import { BottomBar } from "@components/BottomBar";

export default function MainScreen() {

  const { theme, changeTheme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const {
    selectedProject,
    setSelectedProject,
  } = useContext(AuthContext);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [enabledSections, setEnabledSections] = useState([]);
  const [showProjectFiles, setShowProjectFiles] = useState(true);
  const {
    formattedTime,
    isRunning,
    isPaused,
    progress: timerProgress,
    start,
    pause,
    sync,
    reset,
  } = useTimer();
  const selectedProjectId =
    selectedProject?._id || selectedProject?.id;

  function getErrorMessage(error, fallbackMessage) {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallbackMessage
    );
  }

  const applyShiftState = useCallback(
    function applyShiftState(shift) {
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

  useFocusEffect(
    React.useCallback(
      function loadScreenData() {
        async function fetchData() {
          await loadCurrentShift(selectedProjectId);

          const savedSections =
            await getEnabledSections();

          if (savedSections) {
            setEnabledSections(savedSections);
          }
        }

        fetchData();
      },
      [loadCurrentShift, selectedProjectId],
    ),
  );

  async function handlePlayPause() {
    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(true);

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
          await shiftService.resume(currentShift.id);

        setCurrentShift(resumedShift);

        start(resumedShift);

        return;
      }

      const startedShift = await shiftService.start({
        projectId: selectedProjectId,
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
      setActionLoading(false);
    }
  }

  useEffect(function applyTheme() {
    changeTheme("green");
  }, []);

  function handleHomePress() {
    navigation.navigate("Main");
  }

  function handleMenuPress() {
    navigation.navigate("Menu");
  }

  return (
    <View style={styles.container}>
      <View style={styles.selectProjectContainer}>
        <ProjectSelector
          value={selectedProject}
          onPress={function handleProjectPress() {
            navigation.navigate("Projects", {
              mode: "select",
            });
          }}
        />
      </View>

      <View style={styles.contentContainer}>
        <TimerDisplay
          hours={formattedTime.hours}
          minutes={formattedTime.minutes}
          seconds={formattedTime.seconds}
        />


        <PlayButton
          isRunning={isRunning}
          isPaused={isPaused}
          loading={actionLoading}
          onPress={handlePlayPause}
        />

        <MainButtonsGrid />

        {showProjectFiles &&
          enabledSections.includes("project-files") && (
            <ProjectFilesSection
              project={selectedProject}
              onClose={function handleClose() {
                setShowProjectFiles(false);
              }}
            />
          )}
      </View>

      <BottomBar
        showAddButton={false}
        showBackground={false}
        showText={true}
        onLeftPress={handleHomePress}
        onRightPress={handleMenuPress}
      />
    </View>
  );
}