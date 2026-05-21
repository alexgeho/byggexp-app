import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../theme/ThemeContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ProjectSelector from "../../../components/common/ProjectSelector/ProjectSelector";
import AuthContext from "../../../contexts/AuthContext";
import { useTimer } from "../../../hooks/useTimer";
import { useShiftExitAutoComplete } from "../../../hooks/useShiftExitAutoComplete";
import { GlassView } from "../../../components/common/GlassView/GlassView";
import { projectService, shiftService } from "../../../services";
import { formatDuration } from "../../../utils/shifts";
import { startShiftWithLocationGuard } from "../../../utils/shiftLocationGuard";

export default function MainScreen() {
  const { theme, changeTheme } = useTheme();
  const navigation = useNavigation();
  const { user, selectedProject, setSelectedProject } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
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

  const getProjectId = (project) => project?._id || project?.id;

  const getErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.message || error?.message || fallbackMessage;

  const upsertProject = useCallback((projectLike) => {
    if (!projectLike) {
      return;
    }

    setProjects((previousProjects) => {
      const projectId = getProjectId(projectLike);
      if (!projectId) {
        return previousProjects;
      }

      const nextProject = {
        ...projectLike,
        _id: projectLike._id || projectLike.id || projectId,
        id: projectLike.id || projectLike._id || projectId,
      };

      const existingIndex = previousProjects.findIndex(
        (project) => getProjectId(project) === projectId,
      );
      if (existingIndex === -1) {
        return [nextProject, ...previousProjects];
      }

      const updatedProjects = [...previousProjects];
      updatedProjects[existingIndex] = {
        ...updatedProjects[existingIndex],
        ...nextProject,
      };

      return updatedProjects;
    });
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const data =
        user?.role === "superadmin"
          ? await projectService.getAll()
          : await projectService.getMyProjects();

      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects for main screen:", error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, [user?.role]);

  const applyShiftState = useCallback(
    (shift) => {
      setCurrentShift(shift);

      if (shift) {
        sync(shift);
        upsertProject({
          _id: shift.projectId,
          id: shift.projectId,
          name: shift.projectName,
          location: shift.location,
        });

        setSelectedProject((previousProject) => {
          const previousProjectId = getProjectId(previousProject);
          if (previousProjectId === shift.projectId) {
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
    [reset, setSelectedProject, sync, upsertProject],
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
      fetchProjects();
      loadCurrentShift(selectedProjectId);
    }, [fetchProjects, loadCurrentShift, selectedProjectId]),
  );

  useShiftExitAutoComplete({
    currentShift,
    selectedProject,
    onShiftAutoCompleted: useCallback(() => {
      setCurrentShift(null);
      reset();

      Alert.alert(
        "Shift completed",
        "You left the project area, so your current shift was ended automatically.",
      );
    }, [reset]),
    onCheckError: useCallback((error) => {
      console.error("Failed to verify shift location:", error);
    }, []),
  });

  const handleProjectChange = (project) => {
    if (currentShift?.status === "active") {
      Alert.alert(
        "Shift in progress",
        "Pause the current shift before switching projects.",
      );
      return;
    }

    setSelectedProject(project);
  };

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
  changeTheme("darkGray");
}, []);

  function openVariantTwo() {
    navigation.navigate("HomeVariant5orange");
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
          onChange={handleProjectChange}
          projects={projects}
          onPress={() => navigation.navigate("Projects", { mode: "select" })}
        />

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
              { 
                color: theme.colors.text,
                fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            :
          </Text>
          <Text
            style={[
              styles.timerNumber,
              { 
                color: theme.colors.text,
                fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            {formattedTime.minutes}
          </Text>
          <Text
            style={[
              styles.timerNumber,
              { 
                color: theme.colors.text,
                fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            :
          </Text>
          <Text
            style={[
              styles.timerSubNumber,
              { 
                color: theme.colors.text,
                fontFamily: theme.text.fontFamily["regular"] },
            ]}
          >
            {formattedTime.seconds}
          </Text>
        </View>

        {/* HOURS DOTS*/}
        <View style={styles.dotsRow}>
          {Array.from({ length: 10 }).map((_, index) => (
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
      </View>

      {/* MAIN NAV BTNs */}
      <View style={styles.navButtonContainer}>
        {/* 1ST BUTTON */}
        <GlassView
          style={[
            styles.button,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
          intensity={60}
        >
          <TouchableOpacity onPress={openVariantTwo} style={styles.buttonInner}>
            <Image
              style={[
                styles.buttonIcon,
                {
                  tintColor: theme.colors.icon,
                },
              ]}
              source={require("../../../assets/next-screen.png")}
            />

            <Text
              style={[
                styles.text,
                {
                  fontFamily: theme.text.fontFamily["regular"],
                  color: theme.colors.text,
                },
              ]}
            >
              NEXT SCREEN 5
            </Text>
          </TouchableOpacity>
        </GlassView>

        {/* CHATS */}
        <GlassView
          style={[
            styles.button,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
          intensity={60}
        >
          <TouchableOpacity
            onPress={() => handleNav("Chats")}
            style={styles.buttonInner}
          >
            <Image
              style={[
                styles.buttonIcon,
                {
                  tintColor: theme.colors.icon,
                },
              ]}
              source={require("../../../assets/mainButtons/messager.png")}
            />
            <Text
              style={[
                styles.text,
                {
                  fontFamily: theme.text.fontFamily["regular"],
                  color: theme.colors.text,
                },
              ]}
            >
              Chats
            </Text>
          </TouchableOpacity>
        </GlassView>

        {/* SHIFTS */}
        <GlassView
          style={[
            styles.button,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
          intensity={60}
        >
          <TouchableOpacity
            onPress={() => handleNav("Shifts")}
            style={styles.buttonInner}
          >
            <Image
              style={[
                styles.buttonIcon,
                {
                  tintColor: theme.colors.icon,
                },
              ]}
              source={require("../../../assets/mainButtons/shifts.png")}
            />
            <Text
              style={[
                styles.text,
                {
                  fontFamily: theme.text.fontFamily["regular"],
                  color: theme.colors.text,
                },
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </GlassView>

        {/* PROJECTS */}
        <GlassView
          style={[
            styles.button,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
          intensity={60}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Projects", { mode: "browse" })}
            style={styles.buttonInner}
          >
            <Image
              style={[
                styles.buttonIcon,
                {
                  tintColor: theme.colors.icon,
                },
              ]}
              source={require("../../../assets/mainButtons/projects.png")}
            />
            <Text
              style={[
                styles.text,
                {
                  fontFamily: theme.text.fontFamily["regular"],
                  color: theme.colors.text,
                },
              ]}
            >
              Projects
            </Text>
          </TouchableOpacity>
        </GlassView>
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

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    paddingTop: 32,
    justifyContent: "space-between",
  },
  selectProjectContainer: {
    padding: 46,
    zIndex: 1000,
    position: "relative",
    gap: 15,
  },
  timerRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
   
    elevation: 3,
  },
  timerNumber: {
    fontSize: 48,
  },
  timerSubNumber: {
    fontSize: 48,
  },
  dotsRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
  },
  dot: {
    width: "6%",
    height: 42,
    borderWidth: 1,
    borderRadius: 50,
  },
  playButtonContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  playButton: {
    width: 130,
    height: 130,
    borderRadius: 100,
    borderWidth: 1,

    shadowOffset: {
      width: 0,
      height: 0,
    },

    alignItems: "center",
    justifyContent: "center",
  },
  playButtonPaused: {
    opacity: 0.7,
  },
  playIcon: {
    width: 52,
    height: 52,
  },
  navButtonContainer: {
    flexWrap: "wrap",
    padding: 16,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
  },
  button: {
    width: "42%",
    borderRadius: 16,
    overflow: "hidden",

    borderWidth: 1,
  },
  buttonInner: {
    flexDirection: "column",
    padding: 16,
    gap: 8,
    alignItems: "center",
  },
  buttonIcon: {
    width: 26,
    height: 26,
  },
  text: {
    color: "#ffffff",
  },
  bottomNavContainer: {
    flexDirection: "row",
    gap: 72,
    justifyContent: "center",
    paddingBottom: 32,
  },
  bottomNavItem: {
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
  bottomIcon: {
    width: 28,
    height: 28,
  },
  bottomText: {
    color: "#ffffff",
    fontSize: 12,
  },
});
