import React, { useContext, useEffect, useState } from "react";

import { View, Alert } from "react-native";

import AuthContext from "../../../contexts/AuthContext";

import { styles } from "./HomeVariant2.styles";

import { LinearGradient } from "expo-linear-gradient";

import { useNavigation } from "@react-navigation/native";

import { Timer } from "../../../components/common2/Timer/Timer";

import { ProjectSelector2 } from "../../../components/common2/projectSelector/projectSelector";

import { MainActionButtons } from "../../../components/common2/mainActionButtons/mainActionButtons";

import { FooterButtonsVariant2 } from "../../../components/common2/footer/footer";

import ProjectFilesSection from "../../../components/common/ProjectFilesSection/ProjectFilesSection";

import { useTimer } from "../../../hooks/useTimer";

import shiftService from "../../../services/shift.service";

export default function HomeVariant2() {
  const { selectedProject } = useContext(AuthContext);

  const navigation = useNavigation();

  const [loadingShift, setLoadingShift] = useState(false);

  const [currentShift, setCurrentShift] = useState(null);

  const { isRunning, isPaused, start, pause, resume, reset } = useTimer();

  useEffect(function loadShift() {
    async function fetchShift() {
      try {
        const activeShift = await shiftService.getCurrent();

        if (activeShift) {
          setCurrentShift(activeShift);

          start();
        }
      } catch (error) {
        console.log(error);
      }
    }

    fetchShift();
  }, []);

  function openProjects() {
    navigation.navigate("Projects");
  }

  async function handlePlayPause() {
    try {
      if (!selectedProject) {
        Alert.alert("Select project", "Please select a project first");

        return;
      }

      setLoadingShift(true);
      console.log(selectedProject);
      if (!isRunning) {
        const newShift = await shiftService.start(selectedProject._id);
        console.log(selectedProject);

        setCurrentShift(newShift);

        start();
      } else if (isPaused) {
        await shiftService.resume(currentShift._id);

        resume();
      } else {
        await shiftService.pause(currentShift._id);

        pause();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingShift(false);
    }
  }

  function handleCameraPress() {
    navigation.navigate("Camera");
  }

  return (
    <LinearGradient
      colors={["#5BC8FF", "#0D5DB8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.main}>
        <ProjectSelector2 value={selectedProject} onPress={openProjects} />

        <Timer />

        <MainActionButtons
          isRunning={isRunning}
          isPaused={isPaused}
          loading={loadingShift}
          onPlayPress={handlePlayPause}
          onCameraPress={handleCameraPress}
        />

        <ProjectFilesSection project={selectedProject} />
      </View>

      <FooterButtonsVariant2 />
    </LinearGradient>
  );
}
