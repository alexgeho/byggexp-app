import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTheme } from "../../../theme/ThemeContext";
import AuthContext from "../../../contexts/AuthContext";
import { projectService } from "../../../services";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/BottomBar";

export default function ProjectsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
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

  const canManageProjects = [
    "superadmin",
    "companyAdmin",
    "projectAdmin",
  ].includes(user?.role);
  const selectedProjectId = selectedProject?._id || selectedProject?.id;

  const getProjectId = (project) => project?._id || project?.id;

  const formatStatus = (status) => {
    if (!status) return "";

    const normalizedStatus = status.replace(/_/g, " ").toLowerCase();
    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  };

  useEffect(() => {
    if (!authLoading && userId) {
      fetchProjects();
    }
  }, [userId, authLoading, user?.role]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data =
        user?.role === "superadmin"
          ? await projectService.getAll()
          : await projectService.getMyProjects();

      let userProjects = data;
      if (user?.role === "worker" || user?.role === "projectAdmin") {
        userProjects = data.filter(
          (project) => project.workers && project.workers.includes(userId),
        );
      }

      setProjects(userProjects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) => {
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
    });
  }, [projects, searchQuery]);

  const handleProjectPress = (project) => {
    if (isSelectionMode) {
      setSelectedProject(project);
      setTimeout(() => {
        navigation.goBack();
      }, 120);
      return;
    }

    navigation.navigate("Project", { id: getProjectId(project) });
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  const themedSelectionStyle = { borderColor: theme.colors.primary };
  const themedStatusBadgeStyle = {
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}1A`,
  };
  const themedAccentTextStyle = { color: theme.colors.primary };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgb(253 253 253)"}
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
          My projects
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
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
        {filteredProjects.length === 0 ? (
          <Text style={styles.noProjectsText}>No projects found.</Text>
        ) : (
          filteredProjects.map((project) => (
            <TouchableOpacity
              key={getProjectId(project)}
              onPress={() => handleProjectPress(project)}
              style={[
                styles.projectCard,
                selectedProjectId === getProjectId(project) &&
                  styles.projectCardSelected,
                selectedProjectId === getProjectId(project) &&
                  themedSelectionStyle,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.projectName,
                    { fontFamily: theme.text.fontFamily["bold"] },
                  ]}
                >
                  {project.name}
                </Text>
                <Text style={[styles.statusBadge, themedStatusBadgeStyle]}>
                  {formatStatus(project.status)}
                </Text>
              </View>
              <Text style={[styles.dateText, themedAccentTextStyle]}>
                Start: {new Date(project.beginningDate).toLocaleDateString()}
              </Text>
              <Text style={styles.locationText}>
                Location: {project.location}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={canManageProjects}
        onAddPress={() => navigation.navigate("CreateProject")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 12,
    backgroundColor: "#EEEEEE",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    width: 36,
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
  projectCard: {
    backgroundColor: "#ffffff",
    width: "100%",
    padding: 20,
    borderRadius: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  projectCardSelected: {
    borderColor: "#0785F4",
  },
  cardHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projectName: {
    color: "#052D50",
  },
  statusBadge: {
    color: "#2582D9",
    backgroundColor: "#2582D91A",
    padding: 4,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 12,
  },
  dateText: {
    color: "#0785F4",
  },
  locationText: {
    color: "#698196",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
    boxShadow: "0px 2px 7px 0px rgba(0, 0, 0, 0.25)",
  },
});
