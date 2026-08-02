import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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
    // Match the Employees list: not-yet-confirmed accounts first, then people
    // who are away, and those currently at work last.
    const getSortPriority = (person) => {
      if (shouldShowAccountStatus(person?.accountStatus)) {
        return 0;
      }
      return isPersonAtWork(person, selectedProjectId) ? 2 : 1;
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

  const openReturnedChat = (chat) => {
    navigation.navigate(chat.type === "group" ? "GroupChat" : "SingleChat", {
      chatId: chat._id,
      initialChat: chat,
    });
  };

  const openChatWith = async (person) => {
    const id = getUserId(person);
    if (!id || opening) {
      return;
    }
    try {
      setOpening(true);
      const chat = await chatService.getOrCreateDirect(id);
      openReturnedChat(chat);
    } catch (error) {
      console.error("Failed to open chat:", error);
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setOpening(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const openProjectGroup = async () => {
    if (!selectedProjectId || opening) {
      return;
    }
    try {
      setOpening(true);
      const chat = await chatService.getOrCreateProjectGroup(selectedProjectId);
      openReturnedChat(chat);
    } catch (error) {
      console.error("Failed to open project group:", error);
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setOpening(false);
    }
  };

  const createGroup = async () => {
    if (selectedIds.length === 0 || opening) {
      return;
    }
    try {
      setOpening(true);
      const chat = await chatService.createGroup(selectedIds);
      setSelectMode(false);
      setSelectedIds([]);
      openReturnedChat(chat);
    } catch (error) {
      console.error("Failed to create group:", error);
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
        <TouchableOpacity
          style={styles.headerButton}
          onPress={toggleSelectMode}
          activeOpacity={0.8}
        >
          <Text style={styles.headerButtonText}>
            {selectMode ? t("common.cancel") : t("chat.newGroup")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <ProjectFilterSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />
      </View>

      {selectedProjectId && !selectMode ? (
        <TouchableOpacity
          style={styles.projectGroupButton}
          onPress={openProjectGroup}
          activeOpacity={0.85}
        >
          <Image
            source={require("../../../assets/chatBubble.png")}
            style={styles.projectGroupIcon}
          />
          <Text style={styles.projectGroupText}>
            {t("chat.messageWholeProject")}
          </Text>
        </TouchableOpacity>
      ) : null}

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
                  onPress={() =>
                    selectMode ? toggleSelect(personId) : openChatWith(person)
                  }
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

                  {/* Chat affordance / selection checkbox */}
                  {selectMode ? (
                    <View
                      style={[
                        styles.selectCheckbox,
                        selectedIds.includes(personId) &&
                          styles.selectCheckboxOn,
                      ]}
                    >
                      {selectedIds.includes(personId) ? (
                        <Text style={styles.selectCheckmark}>✓</Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.chatBubble}>
                      <Image
                        source={require("../../../assets/chatBubble.png")}
                        style={styles.chatBubbleIcon}
                      />
                    </View>
                  )}
                </ListCard>
              );
            })
          )}
        </ScrollView>
      )}

      {selectMode ? (
        <TouchableOpacity
          style={[
            styles.createGroupButton,
            selectedIds.length === 0 && styles.createGroupButtonDisabled,
          ]}
          onPress={createGroup}
          disabled={selectedIds.length === 0 || opening}
          activeOpacity={0.85}
        >
          <Text style={styles.createGroupText}>
            {t("chat.createGroupCount", { count: selectedIds.length })}
          </Text>
        </TouchableOpacity>
      ) : null}

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
    backgroundColor: "#f2f1f6",
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
    paddingBottom: 190,
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
    backgroundColor: "#0089f6",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBubbleIcon: {
    width: 16,
    height: 16,
  },
  headerButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#0089f6",
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  projectGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0089f6",
    borderRadius: 23,
    height: 46,
    marginBottom: 12,
  },
  projectGroupIcon: {
    width: 18,
    height: 18,
  },
  projectGroupText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  selectCheckbox: {
    position: "absolute",
    // Centered under the status badge, same as the chat bubble.
    right: 38,
    bottom: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#C2CCD6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  selectCheckboxOn: {
    backgroundColor: "#0089f6",
    borderColor: "#0089f6",
  },
  selectCheckmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  createGroupButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 120,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0089f6",
    alignItems: "center",
    justifyContent: "center",
  },
  createGroupButtonDisabled: {
    backgroundColor: "#9DB7D8",
  },
  createGroupText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
