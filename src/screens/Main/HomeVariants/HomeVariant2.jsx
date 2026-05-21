import React, {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  View,
  Alert,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { useNavigation } from "@react-navigation/native";

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

export default function HomeVariant2() {
  /* SELECTED PROJECT */
  const { selectedProject } =
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

  /* TIMER LOGIC */
  const {
    formattedTime,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
  } = useTimer();

  /* LOAD ACTIVE SHIFT */
  useEffect(function loadShift() {
    async function fetchShift() {
      try {
        const activeShift =
          await shiftService.getCurrent();

        if (activeShift) {
          setCurrentShift(
            activeShift,
          );

          start(activeShift);
        }
      } catch (error) {
        console.log(error);
      }
    }

    fetchShift();
  }, []);

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

  /* OPEN PROJECTS SCREEN */
  function openProjects() {
    navigation.navigate("Projects");
  }

  /* PLAY / PAUSE BUTTON */
  async function handlePlayPause() {
    try {
      /* PROJECT REQUIRED */
      if (!selectedProject) {
        Alert.alert(
          "Select project",
          "Please select a project first",
        );

        return;
      }

      setLoadingShift(true);

      /* START SHIFT */
      if (!isRunning) {
        const newShift =
          await startShiftWithLocationGuard({
            projectId: selectedProjectId,
            project: selectedProject,
          });

        setCurrentShift(
          newShift,
        );

        start(newShift);
      }

      /* RESUME SHIFT */
      else if (isPaused) {
        await shiftService.resume(
          currentShift?.id || currentShift?._id,
        );

        resume();
      }

      /* PAUSE SHIFT */
      else {
        await shiftService.pause(
          currentShift?.id || currentShift?._id,
        );

        pause();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingShift(false);
    }
  }

  /* OPEN CAMERA SCREEN */
  function handleCameraPress() {
    navigation.navigate("Camera");
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
      <View style={styles.main}>
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
          onPlayPress={
            handlePlayPause
          }
          onCameraPress={
            handleCameraPress
          }
        />

        {/* PROJECT FILES */}
        <ProjectFilesSection
          project={selectedProject}
        />
      </View>

      {/* FOOTER */}
      <FooterButtonsVariant2 />
    </LinearGradient>
  );
}