import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, userService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { ProjectFilterSelector } from "../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { cardStyles } from "../../styles/cards";
import {
  canManageEmployees,
  getAccountStatusLabel,
  getRoleLabel,
  shouldShowAccountStatus,
} from "../../utils/userRoles";

const getApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return message || error?.message || fallback;
};

const getUserId = (employee) => employee?._id || employee?.id;

const getEntityId = (entity) => {
  const id = entity?._id || entity?.id;
  return id ? String(id) : "";
};

const buildProjectNameById = (projects) => {
  const map = new Map();

  projects.forEach((project) => {
    const id = getEntityId(project);
    if (id && project?.name) {
      map.set(id, project.name);
    }
  });

  return map;
};

const getEmployeeProjectIds = (employee, projects) => {
  const ids = new Set();
  const employeeId = getEntityId(employee);

  if (Array.isArray(employee?.projectIds)) {
    employee.projectIds.forEach((projectId) => {
      const normalizedId = getEntityId({ id: projectId });
      if (normalizedId) {
        ids.add(normalizedId);
      }
    });
  }

  projects.forEach((project) => {
    if (!Array.isArray(project?.workers)) {
      return;
    }

    const isAssigned = project.workers.some((worker) => {
      const workerId =
        typeof worker === "string"
          ? worker
          : worker?._id || worker?.id;

      return getEntityId({ id: workerId }) === employeeId;
    });

    if (isAssigned) {
      const projectId = getEntityId(project);
      if (projectId) {
        ids.add(projectId);
      }
    }
  });

  return [...ids];
};

const MAX_PROJECT_NAME_LENGTH = 35;

const truncateProjectName = (name) => {
  if (!name || name.length <= MAX_PROJECT_NAME_LENGTH) {
    return name;
  }

  return `${name.slice(0, MAX_PROJECT_NAME_LENGTH - 3)}...`;
};

const getEmployeeProjectLabel = (employee, projectNameById, projects) => {
  const projectNames = getEmployeeProjectIds(employee, projects)
    .map((projectId) => truncateProjectName(projectNameById.get(projectId)))
    .filter(Boolean);

  if (projectNames.length === 0) {
    return null;
  }

  return projectNames.join(", ");
};

export default function EmployeesScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, selectedProject } = useContext(AuthContext);

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => selectedProject?._id || selectedProject?.id || null,
  );

  const projectNameById = useMemo(
    () => buildProjectNameById(projects),
    [projects],
  );

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const [employeesData, projectsData] = await Promise.all([
        selectedProjectId
          ? userService.getByProject(selectedProjectId)
          : userService.getMyCompanyUsers(),
        user?.role === "superadmin"
          ? projectService.getAll()
          : projectService.getMyProjects(),
      ]);

      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Failed to load employees:", error);
      Alert.alert(
        "Error",
        getApiErrorMessage(error, "Unable to load employees."),
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, user?.role]);

  const filteredEmployees = employees;

  useFocusEffect(
    useCallback(() => {
      if (canManageEmployees(user?.role)) {
        loadEmployees();
      }
    }, [loadEmployees, user?.role]),
  );

  if (!canManageEmployees(user?.role)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton
            backgroundColor="rgba(255, 255, 255, 0.6)"
            tint="light"
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../assets/Arrow-left.png")}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            Employees
          </Text>
          <View style={standardScreenHeaderPlaceholder} />
        </View>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>Access denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            Only administrators can manage employees.
          </Text>
        </View>
      </View>
    );
  }

  const themedAccentTextStyle = { color: theme.colors.primary };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor="rgba(255, 255, 255, 0.6)"
          tint="light"
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
        >
          Employees
        </Text>
        <View style={standardScreenHeaderPlaceholder} />
      </View>

      <View style={styles.searchContainer}>
        <ProjectFilterSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No employees found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedProjectId
                  ? "No employees assigned to this project."
                  : "Tap the add button below to create the first employee."}
              </Text>
            </View>
          ) : (
            filteredEmployees.map((employee) => {
              const employeeId = getUserId(employee);
              const projectLabel = getEmployeeProjectLabel(
                employee,
                projectNameById,
                projects,
              );
              const accountStatusLabel = getAccountStatusLabel(
                employee.accountStatus,
              );
              const showAccountStatus = shouldShowAccountStatus(
                employee.accountStatus,
              );

              const themedRoleBadgeStyle = {
                color: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}1A`,
              };

              return (
                <ListCard
                  key={employeeId}
                  title={employee.name || "Unnamed"}
                  badgeLabel={
                    showAccountStatus
                      ? accountStatusLabel
                      : getRoleLabel(employee.role)
                  }
                  badgeStyle={
                    showAccountStatus
                      ? cardStyles.cardBadgeWarning
                      : themedRoleBadgeStyle
                  }
                >
                  <Text
                    style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {employee.profession || "No profession"}
                  </Text>

                  <Text
                    style={cardStyles.cardSecondaryText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {projectLabel || "No project assigned"}
                  </Text>
                </ListCard>
              );
            })
          )}
        </ScrollView>
      )}

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton
        onAddPress={() => navigation.navigate("CreateEmployee")}
        renderAddContent={() => (
          <Image
            source={require("../../assets/mainButtons/employees.png")}
            style={styles.addButtonIcon}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    paddingBottom: 0,
    gap: 12,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: "#052D50",
    textAlign: "center",
  },
  searchContainer: {
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingBottom: 140,
    gap: 10,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#151515",
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#5a6b7d",
    textAlign: "center",
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  accessDeniedText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
  },
  accessDeniedSubtext: {
    fontSize: 14,
    color: "#5a6b7d",
    textAlign: "center",
  },
  addButtonIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    tintColor: "#FFFFFF",
  },
});
