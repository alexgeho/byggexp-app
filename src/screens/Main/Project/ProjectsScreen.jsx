/* PROJECTS LIST */

import { formatDateOrNull } from "../../../utils/dateLocale";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
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
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import AuthContext from "../../../contexts/AuthContext";
import { projectService } from "../../../services";
import { Screen } from "../../../components/common/Screen/Screen";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { sortByNewest } from "../../../utils/sortByNewest";
import { resolveLocalProjectSelection } from "../../../utils/localProjectSelection";
import { cardStyles } from "../../../styles/cards";
import { createStyles } from "./ProjectsScreen.styles";
import { canCreateProjects } from "../../../utils/userRoles";
import {
  formatProjectStatus,
  getProjectStatusBadgeStyle,
} from "../../../utils/projectStatus";

const projectsCache = new Map();

const getProjectId = (project) => project?._id || project?.id;

function getProjectsSignature(projects) {
  return projects
    .map((project) =>
      [
        getProjectId(project),
        project?.updatedAt,
        project?.name,
        project?.status,
        project?.location,
        project?.beginningDate,
      ].join("|"),
    )
    .join(";");
}

export default function ProjectsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const {
    userId,
    isLoading: authLoading,
    user,
    selectedProject,
    setSelectedProject,
  } = useContext(AuthContext);
  const isSelectionMode = route.params?.mode === "select";
  const isLocalSelectionMode = route.params?.mode === "select-local";
  const allowAllProjectsOption = isLocalSelectionMode && route.params?.allowAll;
  const cacheKey = `${user?.role || "user"}:${userId || "anonymous"}`;
  const [projects, setProjects] = useState(
    () => projectsCache.get(cacheKey) || [],
  );
  const [loading, setLoading] = useState(projects.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const isFocusedRef = useRef(false);
  const isLeavingRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const projectsSignatureRef = useRef(getProjectsSignature(projects));

  const showCreateProject = canCreateProjects(user?.role);
  const selectedProjectId = isLocalSelectionMode
    ? (route.params?.currentProjectId ?? null)
    : selectedProject?._id || selectedProject?.id;

  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const invalidatePendingFetches = useCallback(() => {
    isFocusedRef.current = false;
    fetchRequestIdRef.current += 1;
  }, []);

  const beginLeaving = useCallback(() => {
    if (isLeavingRef.current) {
      return false;
    }

    isLeavingRef.current = true;
    invalidatePendingFetches();
    return true;
  }, [invalidatePendingFetches]);

  const goBackSafely = useCallback(() => {
    if (!beginLeaving()) {
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
  }, [beginLeaving, navigation]);

  const navigateSafely = useCallback(
    (screen, params) => {
      if (!beginLeaving()) {
        return;
      }

      navigation.navigate(screen, params);
    },
    [beginLeaving, navigation],
  );

  useEffect(
    () =>
      navigation.addListener("beforeRemove", () => {
        isLeavingRef.current = true;
        invalidatePendingFetches();
      }),
    [invalidatePendingFetches, navigation],
  );

  const fetchProjects = useCallback(
    async (silent = false) => {
      const requestId = ++fetchRequestIdRef.current;

      try {
        if (
          !silent &&
          isFocusedRef.current &&
          projectsRef.current.length === 0
        ) {
          setLoading(true);
        }

        // Backend already scopes projects by role (getMy / getAll).
        const data =
          user?.role === "superadmin"
            ? await projectService.getAll()
            : await projectService.getMyProjects();

        const nextProjects = Array.isArray(data) ? data : [];
        const nextSignature = getProjectsSignature(nextProjects);
        projectsCache.set(cacheKey, nextProjects);

        if (
          isFocusedRef.current &&
          requestId === fetchRequestIdRef.current &&
          nextSignature !== projectsSignatureRef.current
        ) {
          projectsSignatureRef.current = nextSignature;
          setProjects(nextProjects);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        if (
          !silent &&
          isFocusedRef.current &&
          requestId === fetchRequestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [cacheKey, user?.role],
  );

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      isLeavingRef.current = false;

      if (!authLoading && userId) {
        fetchProjects(projectsRef.current.length > 0);
      }

      return () => {
        invalidatePendingFetches();
      };
    }, [authLoading, fetchProjects, invalidatePendingFetches, userId]),
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const visibleProjects = normalizedQuery
      ? projects.filter((project) => {
          const searchableText = [
            project?.name,
            project?.location,
            project?.status,
            project?.contractNumber,
            project?.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(normalizedQuery);
        })
      : projects;

    return sortByNewest(visibleProjects, (project) => [
      project?.createdAt,
      project?.updatedAt,
      project?.beginningDate,
    ]);
  }, [projects, searchQuery]);

  const handleProjectPress = (project) => {
    if (isSelectionMode) {
      // Go back first, then switch the global selected project AFTER the back
      // transition settles. Updating selectedProject re-renders Home; doing it
      // mid-transition raced react-native-screens on the New Architecture and
      // crashed with "Unable to find viewState for tag" (a release-only Fabric
      // mount race). Deferring past the interaction avoids the race.
      if (!beginLeaving()) {
        return;
      }
      navigation.goBack();
      InteractionManager.runAfterInteractions(() => {
        setSelectedProject(project);
      });
      return;
    }

    if (isLocalSelectionMode) {
      if (!beginLeaving()) {
        return;
      }
      navigation.goBack();
      InteractionManager.runAfterInteractions(() => {
        resolveLocalProjectSelection(project);
      });
      return;
    }

    navigateSafely("Project", { id: getProjectId(project) });
  };

  const themedAccentTextStyle = { color: theme.colors.primary };

  return (
    <Screen
      title={t("projects.myProjects")}
      onBack={goBackSafely}
      style={styles.screenExtra}
    >
      {/* Search only earns its space once the list is long enough to scan for —
          hidden until the user has more than 10 projects. */}
      {projects.length > 10 ? (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder={t("common.search")}
              placeholderTextColor={theme.content.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.searchIconWrapper} pointerEvents="none">
              <Icon name="search" size={18} color={theme.content.textMuted} />
            </View>
          </View>
        </View>
      ) : null}

      {authLoading || (loading && projects.length === 0) ? (
        <View style={styles.inlineLoader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text>{t("common.loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(project) => getProjectId(project)}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollContainer}
          ListHeaderComponent={
            allowAllProjectsOption ? (
              <ListCard
                onPress={() => {
                  if (!beginLeaving()) {
                    return;
                  }
                  navigation.goBack();
                  InteractionManager.runAfterInteractions(() => {
                    resolveLocalProjectSelection(null);
                  });
                }}
                selected={!selectedProjectId}
                title={t("projects.all")}
              />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.noProjectsText}>{t("projects.notFound")}</Text>
          }
          renderItem={({ item: project }) => (
            <ListCard
              onPress={() => handleProjectPress(project)}
              selected={selectedProjectId === getProjectId(project)}
              title={project.name}
              badgeLabel={t(
                `projects.status.${project.status}`,
                formatProjectStatus(project.status),
              )}
              badgeStyle={getProjectStatusBadgeStyle(project.status)}
            >
              {formatDateOrNull(project.beginningDate) ? (
                <Text
                  style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
                >
                  {t("projects.startLabel", {
                    date: formatDateOrNull(project.beginningDate),
                  })}
                </Text>
              ) : null}

              <Text style={[cardStyles.cardSecondaryText, styles.mutedText]}>
                {t("projects.locationLabel", {
                  location: project.location,
                })}
              </Text>
            </ListCard>
          )}
        />
      )}

      <BottomBar
        onLeftPress={() => navigateSafely("Main")}
        onRightPress={() => navigateSafely("Menu")}
        showAddButton={showCreateProject}
        onAddPress={() => navigateSafely("CreateProject")}
      />
    </Screen>
  );
}
