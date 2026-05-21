import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import AuthContext from "../../../contexts/AuthContext";

import { useTimer } from "../../../hooks/useTimer";
import { useShiftExitAutoComplete } from "../../../hooks/useShiftExitAutoComplete";

import { Timer } from "../../../components/common2/Timer/Timer";

import shiftService from "../../../services/shift.service";
import { startShiftWithLocationGuard } from "../../../utils/shiftLocationGuard";

import { styles } from "./HomeVariant2.styles";

import { ProjectSelector2 } from "../../../components/common2/projectSelector/projectSelector";
import { MainActionButtons } from "../../../components/common2/mainActionButtons/mainActionButtons";

import { FooterButtonsVariant2 } from "../../../components/common2/footer/footer";

import ProjectFilesSection from "../../../components/common/ProjectFilesSection/ProjectFilesSection";
import {
  mainButtons,
  defaultEnabledButtons,
} from "../../../constants/mainButtons";
import { getEnabledButtons } from "../../../utils/homeButtonsStorage";
import { useUnreadChats } from "../../../hooks/useUnreadChats";
import UnreadBadge from "../../../components/common/UnreadBadge/UnreadBadge";

export default function HomeVariant2() {
  /* SELECTED PROJECT */
  const {
    selectedProject,
    setSelectedProject,
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
  const { unreadCount } = useUnreadChats();

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

  /* OPEN PROJECTS SCREEN */
  function openProjects() {
    navigation.navigate("Projects", {
      mode: "select",
    });
  }

  function openQuickAction(screen) {
    navigation.navigate(screen);
  }

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
          await shiftService.resume(currentShift.id);

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
      colors={[
        "#5BC8FF",
        "#0D5DB8",
      ]}
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
        contentContainerStyle={styles.main}
        showsVerticalScrollIndicator={false}
      >
        {/* PROJECT SELECTOR */}
        <ProjectSelector2
          value={selectedProject}
          onPress={openProjects}
        />

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
        />

        {/* ACTION BUTTONS */}
        <MainActionButtons
          isRunning={isRunning}
          isPaused={isPaused}
          loading={loadingShift}
          onPlayPress={handlePlayPause}
          onCameraPress={handleCameraPress}
        />

        <View style={styles.quickActionsGrid}>
          {mainButtons
            .filter(function filterButton(button) {
              return (
                button.id !== "next" &&
                enabledButtons.includes(button.id)
              );
            })
            .map(function renderButton(button) {
              return (
                <TouchableOpacity
                  key={button.id}
                  style={styles.quickActionCard}
                  onPress={function onButtonPress() {
                    openQuickAction(button.screen);
                  }}
                >
                  <View style={styles.quickActionIconWrapper}>
                    <Image
                      source={button.icon}
                      style={styles.quickActionIcon}
                    />
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

        {/* PROJECT FILES */}
        <ProjectFilesSection
          project={selectedProject}
        />
      </ScrollView>

      {/* FOOTER */}
      <FooterButtonsVariant2 />
    </LinearGradient>
  );
}