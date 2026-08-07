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
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, shiftService, userService } from "../../services";
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
  getPersonWorkStatus,
  USER_ROLES,
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
        typeof worker === "string" ? worker : worker?._id || worker?.id;

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

const getTodayDateKey = () => {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// Surface who needs attention first: not-yet-confirmed, then absent all day,
// then off duty (worked earlier), then those currently at work.
const STATUS_SORT_PRIORITY = {
  waiting: 0,
  not_at_work: 1,
  off_duty: 2,
  at_work: 3,
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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, selectedProject } = useContext(AuthContext);

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workedTodayIds, setWorkedTodayIds] = useState(() => new Set());
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

      const today = getTodayDateKey();
      const [employeesData, projectsData, todayShifts] = await Promise.all([
        selectedProjectId
          ? userService.getByProject(selectedProjectId)
          : userService.getMyCompanyUsers(),
        user?.role === "superadmin"
          ? projectService.getAll()
          : projectService.getMyProjects(),
        // Same call the admin uses: today's shifts to tell "off duty" (worked
        // earlier today) from "not at work" (no shift today).
        shiftService.list({ dates: today }).catch(() => null),
      ]);

      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      // /shifts/list responds with { items: [...] }, not a bare array.
      const shiftItems = Array.isArray(todayShifts?.items)
        ? todayShifts.items
        : Array.isArray(todayShifts)
          ? todayShifts
          : [];
      setWorkedTodayIds(
        new Set(
          shiftItems
            .map((shift) => getEntityId({ id: shift?.workerId }))
            .filter(Boolean),
        ),
      );
    } catch (error) {
      console.error("Failed to load employees:", error);
      Alert.alert(
        t("common.error"),
        getApiErrorMessage(error, t("employees.loadError")),
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, user?.role]);

  const filteredEmployees = useMemo(() => {
    const getSortPriority = (employee) =>
      STATUS_SORT_PRIORITY[
        getPersonWorkStatus(employee, selectedProjectId, workedTodayIds)
      ] ?? 99;

    // The company/owner account (companyAdmin) and platform superadmin are not
    // employees, so keep them out of the list.
    const nonStaffRoles = [USER_ROLES.COMPANY_ADMIN, USER_ROLES.SUPERADMIN];

    return [...employees]
      .filter((employee) => !nonStaffRoles.includes(employee?.role))
      .sort((left, right) => getSortPriority(left) - getSortPriority(right));
  }, [employees, selectedProjectId, workedTodayIds]);

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
            {t("employees.title")}
          </Text>
          <View style={standardScreenHeaderPlaceholder} />
        </View>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>{t("access.denied")}</Text>
          <Text style={styles.accessDeniedSubtext}>
            {t("employees.accessDenied")}
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
          {t("employees.title")}
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
              <Text style={styles.emptyTitle}>{t("employees.emptyTitle")}</Text>
              <Text style={styles.emptySubtitle}>
                {selectedProjectId
                  ? t("employees.emptyProjectFiltered")
                  : t("employees.emptyCanCreate")}
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
              const statusKind = getPersonWorkStatus(
                employee,
                selectedProjectId,
                workedTodayIds,
              );

              const badgeLabel = {
                waiting: t("employees.waitingApproval"),
                at_work: t("employees.atWork"),
                off_duty: t("employees.offDuty"),
                not_at_work: t("employees.notAtWork"),
              }[statusKind];
              const badgeStyle = {
                waiting: cardStyles.cardBadgeWarning,
                at_work: cardStyles.cardBadgeAtWork,
                off_duty: cardStyles.cardBadgeNeutral,
                not_at_work: cardStyles.cardBadgeAbsent,
              }[statusKind];

              return (
                <ListCard
                  key={employeeId}
                  title={employee.name || t("employees.unnamed")}
                  badgeLabel={badgeLabel}
                  badgeStyle={badgeStyle}
                  onPress={() =>
                    navigation.navigate("Employee", {
                      employeeId,
                    })
                  }
                >
                  <Text
                    style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {employee.profession || t("employees.noProfession")}
                  </Text>

                  <Text
                    style={cardStyles.cardSecondaryText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {projectLabel || t("employees.noProjectAssigned")}
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
    width: 35,
    height: 35,
    resizeMode: "contain",
    tintColor: "#FFFFFF",
  },
});
