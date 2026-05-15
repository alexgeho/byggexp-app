import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import MainButtonsGrid from "../../../components/common/NavButtonsGrid/MainButtonsGrid";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../theme/ThemeContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ProjectSelector from "../../../components/common/ProjectSelector/ProjectSelector";
import AuthContext from "../../../contexts/AuthContext";
import { useTimer } from "../../../hooks/useTimer";
import { GlassView } from "../../../components/common/GlassView/GlassView";
import { shiftService } from "../../../services";
import { createStyles } from "./HomeVariant1green.styles";

export default function MainScreen() {
  const { theme, changeTheme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const { selectedProject, setSelectedProject } = useContext(AuthContext);
  const [loadingShift, setLoadingShift] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
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

  const selectedProjectId = selectedProject?._id || selectedProject?.id;

  /* ERRORS */
  const getErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.message || error?.message || fallbackMessage;

  const applyShiftState = useCallback(
    (shift) => {
      setCurrentShift(shift);

      if (shift) {
        sync(shift);

        setSelectedProject((previousProject) => {
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
    async (projectId) => {
      try {
        setLoadingShift(true);
        const shift = await shiftService.getCurrent(projectId);

        if (shift) {
          applyShiftState(shift);
          return;
        }

        if (projectId) {
          setCurrentShift(null);
          reset();
          return;
        }

        setCurrentShift(null);
        reset();
      } catch (error) {
        console.error("Failed to load current shift:", error);
        setCurrentShift(null);
        reset();
      } finally {
        setLoadingShift(false);
      }
    },
    [applyShiftState, reset],
  );

  useFocusEffect(
    useCallback(() => {
      loadCurrentShift(selectedProjectId);
    }, [loadCurrentShift, selectedProjectId]),
  );

  const handlePlayPause = async () => {
    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(true);

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
        const resumedShift = await shiftService.resume(currentShift.id);
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
      Alert.alert(
        "Shift error",
        getErrorMessage(error, "Unable to update the shift right now."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleNav = (screen) => {
    navigation.navigate(screen);
  };

  const BackgroundComponent = Platform.OS === "web" ? View : LinearGradient;
  useEffect(function applyTheme() {
    changeTheme("green");
  }, []);

  function openVariantTwo() {
    navigation.navigate("HomeVariant2");
  }

  /* SCREEN RENDER */

  return (
    <BackgroundComponent
      colors={[theme.colors.background, theme.colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
      {...(Platform.OS === "web" && {
        style: [
          styles.container,
          {
            backgroundImage: "linear-gradient(180deg, #00203A 0%, #464a4d 40%)",
          },
        ],
      })}
    >
      {/* PROJECT SELECTOR */}
      <View style={styles.selectProjectContainer}>
        <ProjectSelector
          value={selectedProject}
          onPress={() => navigation.navigate("Projects", { mode: "select" })}
        />
      </View>

      <View style={styles.contentContainer}>
        {/* TIMER */}
        <View style={styles.timerRow}>
          <Text
            style={[
              styles.timerNumber,
              {
                color: theme.colors.text,
                fontFamily: theme.text.fontFamily["regular"],
              },
            ]}
          >
            {formattedTime.hours}
          </Text>
          <Text
            style={[
              styles.timerNumber,
              { fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            :
          </Text>
          <Text
            style={[
              styles.timerNumber,
              { fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            {formattedTime.minutes}
          </Text>
          <Text
            style={[
              styles.timerNumber,
              { fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            :
          </Text>
          <Text
            style={[
              styles.timerSubNumber,
              { fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            {formattedTime.seconds}
          </Text>
        </View>

        {/* HOURS DOTS*/}
        <View style={styles.dotsRow}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: theme.colors.hourBlockEmpty,
                  borderColor: theme.colors.hourBlockEmpty,
                },

                index < timerProgress && {
                  backgroundColor: theme.colors.hourBlockFilled,
                  borderColor: theme.colors.hourBlockFilled,
                },
              ]}
            />
          ))}
        </View>

        {/* PLAY BUTTON CONTAINER */}
        <View style={styles.playButtonContainer}>
          <TouchableOpacity
            style={[
              styles.playButton,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.glow,
                borderColor: theme.colors.glow,
                shadowOpacity: 0.7,
                shadowRadius: 40,
                elevation: 25,
              },
              isPaused && styles.playButtonPaused,
            ]}
            onPress={handlePlayPause}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Image
                style={[styles.playIcon, { tintColor: "#ffffff" }]}
                source={
                  isRunning
                    ? require("../../../assets/main/Pause.png")
                    : require("../../../assets/main/Play.png")
                }
              />
            )}
          </TouchableOpacity>
        </View>

        {/* MAIN NAV BTNs */}
        <MainButtonsGrid />
      </View>
      {/* BOTTOM MENU */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.bottomNavItem}>
          <Image
            style={[
              styles.bottomIcon,
              {
                tintColor: theme.colors.icon,
              },
            ]}
            source={require("../../../assets/Home.png")}
          />

          <Text
            style={[
              styles.bottomText,
              {
                color: theme.colors.bottomNav,
                fontFamily: theme.text.fontFamily["regular"],
              },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleNav("Menu")}
          style={styles.bottomNavItem}
        >
          <Image
            style={[
              styles.bottomIcon,
              {
                tintColor: theme.colors.icon,
              },
            ]}
            source={require("../../../assets/Menu.png")}
          />

          <Text
            style={[
              styles.bottomText,
              {
                color: theme.colors.bottomNav,
                fontFamily: theme.text.fontFamily["regular"],
              },
            ]}
          >
            Menu
          </Text>
        </TouchableOpacity>
      </View>
    </BackgroundComponent>
  );
}
