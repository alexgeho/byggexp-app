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
import { useTheme } from "../../../theme/ThemeContext";
import AuthContext from "../../../contexts/AuthContext";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { ProjectFilterSelector } from "../../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import { chatService, projectService, userService } from "../../../services";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";
import { cardStyles } from "../../../styles/cards";
import { shouldShowAccountStatus, USER_ROLES } from "../../../utils/userRoles";

const getEntityId = (entity) => {
  const id = entity?._id || entity?.id;
  return id ? String(id) : "";
};

const getUserId = (person) => person?._id || person?.id;

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

const getPersonProjectIds = (person, projects) => {
  const ids = new Set();
  const personId = getEntityId(person);

  if (Array.isArray(person?.projectIds)) {
    person.projectIds.forEach((projectId) => {
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
      return getEntityId({ id: workerId }) === personId;
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

const isPersonAtWork = (person, selectedProjectId) => {
  if (person?.workStatus !== "working") {
    return false;
  }
  if (!selectedProjectId) {
    return true;
  }
  return getEntityId({ id: person?.workStatusProjectId }) === selectedProjectId;
};

const getPersonProjectLabel = (person, projectNameById, projects) => {
  const projectNames = getPersonProjectIds(person, projects)
    .map((projectId) => truncateProjectName(projectNameById.get(projectId)))
    .filter(Boolean);
  if (projectNames.length === 0) {
    return null;
  }
  return projectNames.join(", ");
};

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);

  const [colleagues, setColleagues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  // Default to "All projects"; the dropdown narrows to a single project.
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const projectNameById = useMemo(
    () => buildProjectNameById(projects),
    [projects],
  );

  const loadColleagues = useCallback(async () => {
    try {
      setLoading(true);
      const [peopleData, projectsData] = await Promise.all([
        userService.getColleagues().catch(() => []),
        (user?.role === "superadmin"
          ? projectService.getAll()
          : projectService.getMyProjects()
        ).catch(() => []),
      ]);
      setColleagues(Array.isArray(peopleData) ? peopleData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (loadError) {
      console.error("Failed to load colleagues:", loadError);
      setColleagues([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useFocusEffect(
    useCallback(() => {
      loadColleagues();
    }, [loadColleagues]),
  );

  const visibleColleagues = useMemo(() => {
    const currentUserId = getEntityId({ id: user?._id || user?.id });
    const getSortPriority = (person) => {
      if (shouldShowAccountStatus(person?.accountStatus)) {
        return 2;
      }
      return isPersonAtWork(person, selectedProjectId) ? 0 : 1;
    };

    // Don't list company/superadmin accounts or the current user.
    const nonStaffRoles = [USER_ROLES.COMPANY_ADMIN, USER_ROLES.SUPERADMIN];

    return [...colleagues]
      .filter((person) => !nonStaffRoles.includes(person?.role))
      .filter((person) => getEntityId(person) !== currentUserId)
      .filter((person) => {
        if (!selectedProjectId) {
          return true;
        }
        const ids = Array.isArray(person?.projectIds)
          ? person.projectIds.map((projectId) => getEntityId({ id: projectId }))
          : [];
        return ids.includes(String(selectedProjectId));
      })
      .sort((left, right) => getSortPriority(left) - getSortPriority(right));
  }, [colleagues, selectedProjectId, user?._id, user?.id]);

  const openChatWith = async (person) => {
    const id = getUserId(person);
    if (!id || opening) {
      return;
    }
    try {
      setOpening(true);
      const chat = await chatService.getOrCreateDirect(id);
      navigation.navigate("SingleChat", {
        chatId: chat._id,
        initialChat: chat,
      });
    } catch (error) {
      console.error("Failed to open chat:", error);
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setOpening(false);
    }
  };

  const themedAccentTextStyle = { color: theme.colors.primary };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
        >
          {t("chat.title")}
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
          {visibleColleagues.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t("chat.emptyTitle")}</Text>
              <Text style={styles.emptySubtitle}>{t("chat.emptyText")}</Text>
            </View>
          ) : (
            visibleColleagues.map((person) => {
              const personId = getUserId(person);
              const projectLabel = getPersonProjectLabel(
                person,
                projectNameById,
                projects,
              );
              const showAccountStatus = shouldShowAccountStatus(
                person.accountStatus,
              );
              const atWork = isPersonAtWork(person, selectedProjectId);

              const badgeLabel = showAccountStatus
                ? t("employees.waitingApproval")
                : atWork
                  ? t("employees.atWork")
                  : t("employees.notAtWork");
              const badgeStyle = showAccountStatus
                ? cardStyles.cardBadgeWarning
                : atWork
                  ? cardStyles.cardBadgeAtWork
                  : cardStyles.cardBadgeAbsent;

              return (
                <ListCard
                  key={personId}
                  title={person.name || t("employees.unnamed")}
                  badgeLabel={badgeLabel}
                  badgeStyle={badgeStyle}
                  onPress={() => openChatWith(person)}
                >
                  <Text
                    style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {person.profession || t("employees.noProfession")}
                  </Text>

                  <Text
                    style={cardStyles.cardSecondaryText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {projectLabel || t("employees.noProjectAssigned")}
                  </Text>

                  {/* Chat affordance */}
                  <View style={styles.chatBubble}>
                    <Image
                      source={require("../../../assets/chatBubble.png")}
                      style={styles.chatBubbleIcon}
                    />
                  </View>
                </ListCard>
              );
            })
          )}
        </ScrollView>
      )}

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    backgroundColor: "#F9FBFD",
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
    flex: 1,
  },
  searchContainer: {
    width: "100%",
    marginBottom: 12,
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
    gap: 12,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#052D50",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(5, 45, 80, 0.55)",
    textAlign: "center",
  },
  chatBubble: {
    position: "absolute",
    // Horizontally centered under the status badge (card padding 20 + roughly
    // half the "At work" badge width).
    right: 38,
    bottom: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#338600",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBubbleIcon: {
    width: 16,
    height: 16,
  },
});
