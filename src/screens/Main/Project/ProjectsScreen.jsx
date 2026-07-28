/* PROJECTS LIST */

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import AuthContext from "../../../contexts/AuthContext";
import { projectService } from "../../../services";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";
import { sortByNewest } from "../../../utils/sortByNewest";
import { cardStyles } from "../../../styles/cards";
import { canCreateProjects } from "../../../utils/userRoles";
import {
  formatProjectStatus,
  getProjectStatusBadgeStyle,
} from "../../../utils/projectStatus";

export default function ProjectsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    userId,
    isLoading: authLoading,
    user,
    selectedProject,
    setSelectedProject,
  } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isSelectionMode = route.params?.mode === "select";
  const isLocalSelectionMode = route.params?.mode === "select-local";
  const allowAllProjectsOption = isLocalSelectionMode && route.params?.allowAll;

  const showCreateProject = canCreateProjects(user?.role);
  const selectedProjectId = isLocalSelectionMode
    ? route.params?.currentProjectId ?? null
    : selectedProject?._id || selectedProject?.id;

  const getProjectId = (project) => project?._id || project?.id;

  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const fetchProjects = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        // Backend already scopes projects by role (getMy / getAll).
        const data =
          user?.role === "superadmin"
            ? await projectService.getAll()
            : await projectService.getMyProjects();

        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setProjects([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [user?.role],
  );

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !userId) {
        return;
      }

      fetchProjects(projectsRef.current.length > 0);
    }, [authLoading, fetchProjects, userId]),
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
      setSelectedProject(project);
      setTimeout(() => {
        navigation.goBack();
      }, 120);
      return;
    }

    if (isLocalSelectionMode) {
      route.params?.onSelect?.(project);
      navigation.goBack();
      return;
    }

    navigation.navigate("Project", { id: getProjectId(project) });
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>{t("common.loading")}</Text>
      </View>
    );
  }

  const themedAccentTextStyle = { color: theme.colors.primary };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint="light"
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily["semiBold"] },
          ]}
        >
          {t("projects.myProjects")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder={t("common.search")}
            placeholderTextColor="rgba(5, 45, 80, 0.45)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.searchIconWrapper} pointerEvents="none">
            <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
      >
        {allowAllProjectsOption ? (
          <ListCard
            onPress={() => {
              route.params?.onSelect?.(null);
              navigation.goBack();
            }}
            selected={!selectedProjectId}
            title={t("projects.all")}
          />
        ) : null}

        {filteredProjects.length === 0 ? (
          <Text style={styles.noProjectsText}>{t("projects.notFound")}</Text>
        ) : (
          filteredProjects.map((project) => (
            <ListCard
              key={getProjectId(project)}
              onPress={() => handleProjectPress(project)}
              selected={selectedProjectId === getProjectId(project)}
              title={project.name}
              badgeLabel={t(
                `projects.status.${project.status}`,
                formatProjectStatus(project.status),
              )}
              badgeStyle={getProjectStatusBadgeStyle(project.status)}
            >
              <Text style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}>
                {t("projects.startLabel", {
                  date: new Date(project.beginningDate).toLocaleDateString(),
                })}
              </Text>

              <Text style={cardStyles.cardSecondaryText}>
                {t("projects.locationLabel", { location: project.location })}
              </Text>
            </ListCard>
          ))
        )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={showCreateProject}
        onAddPress={() => navigation.navigate("CreateProject")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
  },
  searchContainer: {
    width: "100%",
  },
  searchInputWrapper: {
    width: "100%",
    height: 48,
    backgroundColor: "#052D500D",
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: "#052D50",
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: 12,
  },
  searchIconWrapper: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    gap: 12,
    paddingBottom: 140,
  },

  noProjectsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#698196",
    fontSize: 16,
  },
  floatingAddButton: {
    position: "absolute",
    right: 16,
    bottom: 45,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
