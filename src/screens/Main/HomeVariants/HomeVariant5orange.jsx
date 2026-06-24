import React, { useCallback, useContext, useState } from "react";
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
import Icon from "react-native-vector-icons/Feather";
import ProjectSelector2 from "../../../components/common2/projectSelector/projectSelector";
import AuthContext from "../../../contexts/AuthContext";
import { useTimer } from "../../../hooks/useTimer";
import { useShiftExitAutoComplete } from "../../../hooks/useShiftExitAutoComplete";
import { useUnreadChats } from "../../../hooks/useUnreadChats";
import { GlassView } from "../../../components/common/GlassView/GlassView";
import UnreadBadge from "../../../components/common/UnreadBadge/UnreadBadge";
import { projectService, shiftService } from "../../../services";
import { formatDuration } from "../../../utils/shifts";
import { startShiftWithLocationGuard } from "../../../utils/shiftLocationGuard";
import {
  defaultEnabledButtons,
  defaultEnabledSections,
  mainButtons,
} from "../../../constants/mainButtons";
import {
  getEnabledButtons,
  getEnabledSections,
  saveEnabledSections,
} from "../../../utils/homeButtonsStorage";
import ProjectFilesSection from "../../../components/common/ProjectFilesSection/ProjectFilesSection";
import ShiftHistoryPreview from "../../../components/common2/ShiftHistoryPreview/ShiftHistoryPreview";
import { isHomeButtonVisible } from "../../../utils/userRoles";

export default function MainScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user, selectedProject, setSelectedProject } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [loadingShift, setLoadingShift] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [enabledButtons, setEnabledButtons] = useState(defaultEnabledButtons);
  const [enabledSections, setEnabledSections] = useState(defaultEnabledSections);
  const { unreadCount } = useUnreadChats();
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

  const handleHideSection = useCallback(async (sectionId) => {
    const updatedSections = enabledSections.filter((id) => id !== sectionId);
    setEnabledSections(updatedSections);
    await saveEnabledSections(updatedSections);
  }, [enabledSections]);

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
      async function loadHomeSettings() {
        const [savedButtons, savedSections] = await Promise.all([
          getEnabledButtons(),
          getEnabledSections(),
        ]);

        if (savedButtons) {
          setEnabledButtons(savedButtons);
        }

        if (savedSections) {
          setEnabledSections(savedSections);
        }
      }

      loadHomeSettings();
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
  const visibleButtons = mainButtons.filter((button) =>
    isHomeButtonVisible(button, enabledButtons, user?.role),
  );

  const BackgroundComponent = Platform.OS === "web" ? View : LinearGradient;

  function openVariantTwo() {
    navigation.navigate("HomeVariant6blue");
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
      <View style={styles.projectSelectorWrapper}>
        <ProjectSelector2
          value={selectedProject}
          onChange={handleProjectChange}
          projects={projects}
          onPress={() => navigation.navigate("Projects", { mode: "select" })}
        />
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.contentContainer}>
        <View style={styles.timerContentContainer}>
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
                  fontFamily: theme.text.fontFamily["regular"],
                },
              ]}
            >
              :
            </Text>

            <Text
              style={[
                styles.timerNumber,
                {
                  color: theme.colors.text,
                  fontFamily: theme.text.fontFamily["regular"],
                },
              ]}
            >
              {formattedTime.minutes}
            </Text>

            <Text
              style={[
                styles.timerNumber,
                {
                  color: theme.colors.text,
                  fontFamily: theme.text.fontFamily["regular"],
                },
              ]}
            >
              :
            </Text>

            <Text
              style={[
                styles.timerSubNumber,
                {
                  color: theme.colors.text,
                  fontFamily: theme.text.fontFamily["regular"],
                },
              ]}
            >
              {formattedTime.seconds}
            </Text>
          </View>

          {/* HOURS DOTS */}
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

          {/* PLAY BUTTON */}
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
          {visibleButtons.map((button) => (
            <GlassView
              key={button.id}
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
                onPress={() => handleNav(button.screen)}
                style={styles.buttonInner}
              >
                <View style={styles.iconWrapper}>
                  {button.vectorIcon ? (
                    <Icon
                      name={button.vectorIcon}
                      size={theme.colors.homeButtonIconSize || 26}
                      color={theme.colors.icon}
                    />
                  ) : (
                    <Image
                      style={[
                        styles.buttonIcon,
                        {
                          tintColor: theme.colors.icon,
                        },
                      ]}
                      source={button.icon}
                    />
                  )}
                  {button.id === "chats" ? (
                    <UnreadBadge count={unreadCount} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.text,
                    {
                      fontFamily: theme.text.fontFamily["regular"],
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {button.title}
                </Text>
              </TouchableOpacity>
            </GlassView>
          ))}
        </View>

        <View style={styles.sectionsContainer}>
          {enabledSections.includes("shift-history") && (
            <ShiftHistoryPreview
              onClose={() => handleHideSection("shift-history")}
            />
          )}

          {enabledSections.includes("project-files") && (
            <ProjectFilesSection
              project={selectedProject}
              onClose={() => handleHideSection("project-files")}
            />
          )}
        </View>

        {/* BOTTOM MENU */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity style={styles.bottomNavItem}>
            <Image
            style={styles.bottomIcon}
            source={require("../../../assets/navigation/home-filled.png")}
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
            style={styles.bottomIcon}
            source={require("../../../assets/navigation/menu-outline.png")}
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
  projectSelectorWrapper: {
    paddingTop: 46,
    paddingHorizontal: 46,
    zIndex: 1000,
    position: "relative",
    gap: 15,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-around",
  },

  timerContentContainer: {
    paddingTop: 46,
    paddingHorizontal: 46,
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
    justifyContent: "center",
    gap: 15,
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
    width: 120,
    height: 120,
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
    gap: 10,
  },
  sectionsContainer: {
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  button: {
    width: "42%",
    borderRadius: 6,
    overflow: "hidden",

    borderWidth: 1,
  },
  buttonInner: {
    flexDirection: "column",
    padding: 10,
    gap: 10,
    alignItems: "center",
  },
  iconWrapper: {
    position: "relative",
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
    width: 24,
    height: 24,
  },
  bottomText: {
    color: "#ffffff",
    fontSize: 12,
  },
});
