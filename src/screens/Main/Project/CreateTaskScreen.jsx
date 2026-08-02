import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import FloatingActionButton from "../../../components/common/FloatingActionButton/FloatingActionButton";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { projectService, taskService, userService } from "../../../services";
import AuthContext from "../../../contexts/AuthContext";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import {
  buildTaskNotificationsPayload,
  createDefaultTaskNotificationSettings,
  deriveNotificationReminderFlags,
  getTaskNotificationSummary,
  getRepeatLabel,
  getRepeatOptionState,
  normalizeTaskNotificationSettings,
  normalizeRepeatIntervalMinutes,
  REPEAT_OPTIONS,
} from "../../../utils/taskNotifications";
import { defaultRepeatIntervalMinutes } from "../../../theme/settings";
import { canCreateTasks } from "../../../utils/userRoles";
import { styles } from "./CreateTaskScreen.styles";
import {
  FieldIcon,
  isImageDocument,
  getDocumentTypeMeta,
  SectionLabel,
  GroupCard,
  GroupRow,
  buildAllDayRange,
  DateTimeFieldModal,
  ScheduleDateRow,
  getProjectId,
  getUserId,
  parseDraftDate,
  ProjectPickerModal,
  UserPickerModal,
} from "./CreateTaskScreen.parts";

export default function CreateTaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const { user } = useContext(AuthContext);
  const isWorkerCreator = user?.role === "worker";
  const { projectId: initialProjectId, projectName: initialProjectName } =
    route.params || {};
  const initialTaskDraft = route.params?.taskDraft || {};
  const isWorkerProjectTaskFlow =
    isWorkerCreator &&
    Boolean(initialTaskDraft.selectedProjectId || initialProjectId);
  const returnTarget =
    initialTaskDraft.returnTarget || (initialProjectId ? "project" : "tasks");
  const allowedToCreate = canCreateTasks(user?.role);

  const [selectedProjectId, setSelectedProjectId] = useState(
    initialTaskDraft.selectedProjectId || initialProjectId || "",
  );
  const [projectName, setProjectName] = useState(
    initialTaskDraft.projectName || initialProjectName || "",
  );
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState(
    initialTaskDraft.selectedAssigneeUserId || "",
  );
  const [selectedAssigneeName, setSelectedAssigneeName] = useState(
    initialTaskDraft.selectedAssigneeName || "",
  );
  const [selectedAssigneeRole, setSelectedAssigneeRole] = useState(
    initialTaskDraft.selectedAssigneeRole || "",
  );
  const [taskTitle, setTaskTitle] = useState(initialTaskDraft.taskTitle || "");
  const [taskDescription, setTaskDescription] = useState(
    initialTaskDraft.taskDescription || "",
  );
  const [notes, setNotes] = useState(initialTaskDraft.notes || "");
  const [notificationSettings, setNotificationSettings] = useState(() =>
    createDefaultTaskNotificationSettings(),
  );
  const [notificationRepeatInput, setNotificationRepeatInput] = useState(() =>
    String(defaultRepeatIntervalMinutes),
  );
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState(
    initialTaskDraft.selectedDocuments || [],
  );
  const [startDate, setStartDate] = useState(
    parseDraftDate(initialTaskDraft.startDate),
  );
  const [dueDate, setDueDate] = useState(
    parseDraftDate(initialTaskDraft.dueDate),
  );
  const [allDay, setAllDay] = useState(Boolean(initialTaskDraft.allDay));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (
      !selectedProjectId ||
      (selectedProject && getProjectId(selectedProject) === selectedProjectId)
    ) {
      return;
    }

    const fetchProject = async () => {
      try {
        setLoadingProject(true);
        const project = await projectService.getById(selectedProjectId);
        setProjectName(project?.name || "");
        setSelectedProject(project || null);
      } catch (error) {
        console.error("Failed to load project for task creation:", error);
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [selectedProject, selectedProjectId]);

  useEffect(() => {
    if (!user?.role) {
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const data =
          user.role === "superadmin"
            ? await projectService.getAll({ sort: "newest" })
            : await projectService.getMyProjects({ sort: "newest" });

        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load projects for task creation:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user?.role]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      return;
    }

    const project = projects.find(
      (item) => getProjectId(item) === selectedProjectId,
    );

    if (project) {
      setSelectedProject(project);

      if (!projectName) {
        setProjectName(project?.name || "");
      }
    }
  }, [projects, selectedProjectId, projectName]);

  useEffect(() => {
    if (!user?.role) {
      return;
    }

    const fetchUsers = async () => {
      if (user.role === "worker") {
        setUsers(user ? [user] : []);
        return;
      }

      try {
        setLoadingUsers(true);
        const data =
          user.role === "superadmin"
            ? await userService.getAll()
            : await userService.getMyCompanyUsers();
        const assignableUsers = data.filter((item) =>
          ["worker", "projectAdmin"].includes(item?.role),
        );

        setUsers(assignableUsers);
      } catch (error) {
        console.error("Failed to load users for personal task:", error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [user?.role]);

  useEffect(() => {
    if (!route.params?.notificationSettings) {
      return;
    }

    const normalized = normalizeTaskNotificationSettings(
      route.params.notificationSettings,
    );
    setNotificationSettings(normalized);
    if (Array.isArray(normalized.assignees) && normalized.assignees.length) {
      setAssigneeIds(normalized.assignees.map((a) => a.id).filter(Boolean));
    }
  }, [route.params?.notificationSettings]);

  useEffect(() => {
    setNotificationRepeatInput(
      String(notificationSettings.repeatIntervalMinutes),
    );
  }, [notificationSettings.repeatIntervalMinutes]);

  useEffect(() => {
    const taskDraft = route.params?.taskDraft;

    if (!taskDraft) {
      return;
    }

    setSelectedProjectId(taskDraft.selectedProjectId || "");
    setProjectName(taskDraft.projectName || "");
    setSelectedAssigneeUserId(taskDraft.selectedAssigneeUserId || "");
    setSelectedAssigneeName(taskDraft.selectedAssigneeName || "");
    setSelectedAssigneeRole(taskDraft.selectedAssigneeRole || "");
    setTaskTitle(taskDraft.taskTitle || "");
    setTaskDescription(taskDraft.taskDescription || "");
    setNotes(taskDraft.notes || "");
    setSelectedDocuments(taskDraft.selectedDocuments || []);
    setStartDate(parseDraftDate(taskDraft.startDate));
    setDueDate(parseDraftDate(taskDraft.dueDate));
    setAllDay(Boolean(taskDraft.allDay));
  }, [route.params?.taskDraft]);

  useEffect(() => {
    if (!isWorkerCreator) {
      return;
    }

    const currentUserId = getUserId(user);
    setSelectedAssigneeUserId(currentUserId || "");
    setSelectedAssigneeName(user?.name || user?.email || "");
    setSelectedAssigneeRole(user?.profession || user?.role || "");

    if (isWorkerProjectTaskFlow) {
      setSelectedProjectId(
        initialTaskDraft.selectedProjectId || initialProjectId || "",
      );
      setProjectName(initialTaskDraft.projectName || initialProjectName || "");
    } else {
      setSelectedProjectId("");
      setSelectedProject(null);
      setProjectName("");
    }
  }, [isWorkerCreator, user, route.params?.taskDraft]);

  const notificationsSummary = useMemo(
    () => getTaskNotificationSummary(notificationSettings),
    [notificationSettings],
  );

  const effectiveSelectedProject = useMemo(() => {
    if (
      selectedProject &&
      getProjectId(selectedProject) === selectedProjectId
    ) {
      return selectedProject;
    }

    return (
      projects.find((project) => getProjectId(project) === selectedProjectId) ||
      null
    );
  }, [projects, selectedProject, selectedProjectId]);

  const applyAllDayRange = (project = effectiveSelectedProject) => {
    const { start, end } = buildAllDayRange(
      project,
      startDate || dueDate || new Date(),
    );
    setStartDate(start);
    setDueDate(end);
  };

  const handleAllDayChange = (enabled) => {
    setAllDay(enabled);

    if (enabled) {
      applyAllDayRange();
    }
  };

  const updateNotificationSettings = (updater) => {
    setNotificationSettings((previous) => {
      const nextSettings =
        typeof updater === "function" ? updater(previous) : updater;
      return normalizeTaskNotificationSettings({
        ...previous,
        ...nextSettings,
      });
    });
  };

  const openNotificationsSheet = () => {
    setNotificationRepeatInput(
      String(notificationSettings.repeatIntervalMinutes),
    );
    setShowNotificationsSheet(true);
  };

  const closeNotificationsSheet = () => {
    const normalizedInterval = normalizeRepeatIntervalMinutes(
      notificationRepeatInput,
    );

    setNotificationSettings(
      deriveNotificationReminderFlags({
        ...normalizeTaskNotificationSettings({
          ...notificationSettings,
          customMessage: notificationSettings.customMessage.trim(),
          repeatIntervalMinutes: normalizedInterval,
        }),
      }),
    );
    setNotificationRepeatInput(String(normalizedInterval));
    setShowNotificationsSheet(false);
  };

  const selectRepeatOption = (repeatKey) => {
    updateNotificationSettings({
      repeat: repeatKey,
      repeatIntervalMinutes: normalizeRepeatIntervalMinutes(
        notificationRepeatInput,
      ),
    });
  };

  useEffect(() => {
    if (!allDay) {
      return;
    }

    const { start, end } = buildAllDayRange(
      effectiveSelectedProject,
      startDate || dueDate || new Date(),
    );
    setStartDate(start);
    setDueDate(end);
  }, [allDay, effectiveSelectedProject]);

  const pickDocuments = async () => {
    try {
      const pickedAssets = await pickUploadAssets({
        fileNamePrefix: "task-document",
      });

      if (!pickedAssets.length) {
        return;
      }
      setSelectedDocuments((prev) => [...prev, ...pickedAssets]);
    } catch (error) {
      console.error("Error picking task documents:", error);
      Alert.alert(
        t("createTask.documentsErrorTitle"),
        t("createTask.documentsErrorMessage"),
      );
    }
  };

  const selectProject = (project) => {
    if (isWorkerCreator) {
      return;
    }

    setSelectedProjectId(getProjectId(project) || "");
    setSelectedProject(project || null);
    setProjectName(project?.name || "");
    setSelectedAssigneeUserId("");
    setSelectedAssigneeName("");
    setSelectedAssigneeRole("");
    setShowProjectPicker(false);
    setAssigneeIds([]);
    updateNotificationSettings(createDefaultTaskNotificationSettings());

    if (allDay) {
      applyAllDayRange(project);
    }
  };

  const selectUser = (nextUser) => {
    if (isWorkerCreator) {
      return;
    }

    setSelectedAssigneeUserId(getUserId(nextUser) || "");
    setSelectedAssigneeName(nextUser?.name || nextUser?.email || "");
    setSelectedAssigneeRole(nextUser?.profession || nextUser?.role || "");
    setSelectedProjectId("");
    setSelectedProject(null);
    setProjectName("");
    setShowUserPicker(false);
    updateNotificationSettings(createDefaultTaskNotificationSettings());

    if (allDay) {
      applyAllDayRange(null);
    }
  };

  const clearSelectedUser = () => {
    if (isWorkerCreator) {
      return;
    }

    setSelectedAssigneeUserId("");
    setSelectedAssigneeName("");
    setSelectedAssigneeRole("");
  };

  // Toggle a project member in/out of the task's assignee subset. Empty = the
  // whole project team is notified.
  const toggleAssignee = (item) => {
    const id = getUserId(item);
    if (!id) {
      return;
    }
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const assigneeSummary = assigneeIds
    .map((id) => users.find((item) => getUserId(item) === id))
    .filter(Boolean)
    .map((item) => item.name || item.email)
    .join(", ");

  const createTask = async () => {
    if (!selectedProjectId && !selectedAssigneeUserId) {
      Alert.alert(
        t("createTask.validationTitle"),
        t("createTask.validationSelectTarget"),
      );
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert(
        t("createTask.validationTitle"),
        t("createTask.titleRequired"),
      );
      return;
    }

    if (!startDate || !dueDate) {
      Alert.alert(
        t("createTask.validationTitle"),
        t("createTask.datesRequired"),
      );
      return;
    }

    try {
      setSaving(true);
      const taskData = new FormData();
      // Chosen project members (when creating a project task) become the task's
      // assignee subset; empty keeps the whole-project-team default.
      const chosenAssignees = assigneeIds
        .map((id) => users.find((item) => getUserId(item) === id))
        .filter(Boolean)
        .map((item) => ({
          id: getUserId(item),
          name: item.name || item.email || "",
          profession: item.profession || item.role || "",
        }));
      let effectiveNotificationSettings;
      if (selectedAssigneeUserId) {
        effectiveNotificationSettings = {
          ...deriveNotificationReminderFlags(notificationSettings),
          allMembersNotification: false,
          assignees: [
            {
              id: selectedAssigneeUserId,
              name: selectedAssigneeName,
              profession: selectedAssigneeRole,
            },
          ],
        };
      } else if (chosenAssignees.length) {
        effectiveNotificationSettings = {
          ...deriveNotificationReminderFlags(notificationSettings),
          allMembersNotification: false,
          assignees: chosenAssignees,
        };
      } else {
        effectiveNotificationSettings =
          deriveNotificationReminderFlags(notificationSettings);
      }
      const notifications = buildTaskNotificationsPayload({
        settings: effectiveNotificationSettings,
        dueDate,
      });

      if (selectedProjectId) {
        taskData.append("projectId", selectedProjectId);
      }

      if (selectedAssigneeUserId) {
        taskData.append("assigneeUserId", selectedAssigneeUserId);
      }

      taskData.append("taskTitle", taskTitle.trim());

      if (taskDescription.trim()) {
        taskData.append("taskDescription", taskDescription.trim());
      }

      if (notes.trim()) {
        taskData.append("notes", notes.trim());
      }

      if (notifications.length > 0) {
        taskData.append("notifications", JSON.stringify(notifications));
      }

      taskData.append(
        "notificationSettings",
        JSON.stringify(effectiveNotificationSettings),
      );

      if (startDate) {
        taskData.append("startDate", startDate.toISOString());
      }

      if (dueDate) {
        taskData.append("dueDate", dueDate.toISOString());
      }

      selectedDocuments.forEach((item, index) => {
        taskData.append("documents", {
          uri: item.uri,
          name: item.name || `task-document-${index + 1}`,
          type: item.mimeType || "application/octet-stream",
        });
      });

      const createdTask = await taskService.create(taskData);
      showSuccess({
        title: t("createTask.created"),
        message: t("createTask.createdMessage"),
      });

      if (returnTarget === "project" && selectedProjectId) {
        navigation.navigate("Project", {
          id: selectedProjectId,
          initialTab: "Tasks",
          refreshKey: createdTask?._id || createdTask?.id || Date.now(),
        });
        return;
      }

      navigation.navigate("Tasks");
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert(
        t("common.error"),
        error?.message || t("createTask.createError"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProject) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text style={styles.loadingText}>{t("project.loading")}</Text>
      </View>
    );
  }

  if (!allowedToCreate) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>{t("access.denied")}</Text>
        <Text style={styles.accessDeniedSubtext}>
          {t("createTask.accessDenied")}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t("common.goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fieldIconBadgeStyle = {
    backgroundColor: theme.colors.primaryIconBadge,
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint="light"
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>{t("createTask.title")}</Text>
          <FloatingActionButton
            onPress={createTask}
            disabled={saving}
            renderContent={() =>
              saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="check" size={24} color="#FFFFFF" />
              )
            }
          />
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SectionLabel>General</SectionLabel>
          <GroupCard>
            <TouchableOpacity
              style={[
                styles.groupRow,
                (selectedAssigneeUserId || isWorkerCreator) &&
                  styles.groupRowDisabled,
              ]}
              onPress={() => !isWorkerCreator && setShowProjectPicker(true)}
              activeOpacity={0.85}
              disabled={
                loadingProjects ||
                Boolean(selectedAssigneeUserId) ||
                isWorkerCreator
              }
            >
              <View style={styles.rowContent}>
                <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                  <FieldIcon name="folder" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>
                    {t("createTask.projectLabel")}
                  </Text>
                  <Text
                    style={[
                      styles.rowValue,
                      !projectName && styles.rowPlaceholder,
                    ]}
                  >
                    {isWorkerProjectTaskFlow
                      ? projectName ||
                        initialProjectName ||
                        t("createTask.currentProject")
                      : isWorkerCreator
                        ? t("createTask.workersPersonalOnly")
                        : loadingProjects
                          ? t("projects.loading")
                          : projectName || t("createTask.selectProject")}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#052D50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.groupRow}
              onPress={() => !isWorkerCreator && setShowUserPicker(true)}
              activeOpacity={0.85}
              disabled={loadingUsers || isWorkerCreator}
            >
              <View style={styles.rowContent}>
                <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                  <FieldIcon name="user" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>
                    {isWorkerCreator
                      ? t("createTask.assignedTo")
                      : t("createTask.personalTaskUser")}
                  </Text>
                  <Text
                    style={[
                      styles.rowValue,
                      !selectedAssigneeName && styles.rowPlaceholder,
                    ]}
                  >
                    {loadingUsers
                      ? t("createTask.loadingUsers")
                      : selectedAssigneeName ||
                        (isWorkerCreator
                          ? t("createTask.currentUser")
                          : t("createTask.selectWorkerOrForeman"))}
                  </Text>
                </View>
              </View>
              {selectedAssigneeUserId && !isWorkerCreator ? (
                <TouchableOpacity
                  style={styles.clearInlineButton}
                  onPress={clearSelectedUser}
                >
                  <Icon name="x" size={16} color="#052D50" />
                </TouchableOpacity>
              ) : (
                <Icon name="chevron-right" size={18} color="#052D50" />
              )}
            </TouchableOpacity>
            {selectedProjectId && !selectedAssigneeUserId ? (
              <TouchableOpacity
                style={styles.groupRow}
                onPress={() => setShowAssigneePicker(true)}
                activeOpacity={0.85}
                disabled={loadingUsers}
              >
                <View style={styles.rowContent}>
                  <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                    <FieldIcon name="users" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.rowTextContainer}>
                    <Text style={styles.rowLabel}>
                      {t("createTask.assignToLabel")}
                    </Text>
                    <Text
                      style={[
                        styles.rowValue,
                        assigneeIds.length === 0 && styles.rowPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {assigneeIds.length
                        ? assigneeSummary
                        : t("createTask.wholeProjectTeam")}
                    </Text>
                  </View>
                </View>
                {assigneeIds.length ? (
                  <TouchableOpacity
                    style={styles.clearInlineButton}
                    onPress={() => setAssigneeIds([])}
                  >
                    <Icon name="x" size={16} color="#052D50" />
                  </TouchableOpacity>
                ) : (
                  <Icon name="chevron-right" size={18} color="#052D50" />
                )}
              </TouchableOpacity>
            ) : null}
            <GroupRow isLast={true}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>
                  {t("createTask.taskTitleLabel")}
                </Text>
                <TextInput
                  style={styles.input}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder={t("createTask.taskTitlePlaceholder")}
                  placeholderTextColor="rgba(5, 45, 80, 0.45)"
                />
              </View>
            </GroupRow>
          </GroupCard>

          <SectionLabel>Schedule</SectionLabel>
          <GroupCard>
            <GroupRow>
              <View style={styles.allDayTextContainer}>
                <Text style={styles.scheduleLabel}>
                  {t("createTask.allDay")}
                </Text>
                <Text style={styles.allDayHint}>
                  {t("createTask.allDayHint")}
                </Text>
              </View>
              <Switch
                value={allDay}
                onValueChange={handleAllDayChange}
                trackColor={{ false: "#D9E3EC", true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </GroupRow>
            <ScheduleDateRow
              label={t("createTask.starts")}
              value={startDate}
              onPress={() => setShowStartDatePicker(true)}
            />
            <ScheduleDateRow
              label={t("createTask.ends")}
              value={dueDate}
              onPress={() => setShowDueDatePicker(true)}
              isLast={true}
            />
          </GroupCard>

          <SectionLabel>Details</SectionLabel>
          <GroupCard>
            <GroupRow>
              <View style={styles.textAreaWrapper}>
                <Text style={styles.inputLabel}>
                  {t("createTask.descriptionLabel")}
                </Text>
                <TextInput
                  multiline={true}
                  style={[styles.input, styles.textArea]}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder={t("createTask.descriptionPlaceholder")}
                  placeholderTextColor="rgba(5, 45, 80, 0.45)"
                />
              </View>
            </GroupRow>
          </GroupCard>

          <SectionLabel>Notifications</SectionLabel>
          <GroupCard>
            <TouchableOpacity
              style={[styles.groupRow, styles.groupRowLast]}
              activeOpacity={0.85}
              onPress={openNotificationsSheet}
            >
              <View style={styles.rowContent}>
                <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                  <FieldIcon name="bell" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>
                    {t("createTask.notificationsLabel")}
                  </Text>
                  <Text
                    style={[
                      styles.rowValue,
                      notificationsSummary === "Off" && styles.rowPlaceholder,
                    ]}
                  >
                    {notificationsSummary}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#052D50" />
            </TouchableOpacity>
          </GroupCard>

          <SectionLabel>Files</SectionLabel>
          <GroupCard>
            <TouchableOpacity
              style={[styles.groupRow, styles.groupRowLast]}
              onPress={pickDocuments}
              activeOpacity={0.85}
            >
              <View style={styles.rowContent}>
                <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                  <FieldIcon name="paperclip" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>
                    {t("createTask.documentsLabel")}
                  </Text>
                  <Text
                    style={[
                      styles.rowValue,
                      selectedDocuments.length === 0 && styles.rowPlaceholder,
                    ]}
                  >
                    {selectedDocuments.length > 0
                      ? t("createTask.fileCount", {
                          count: selectedDocuments.length,
                        })
                      : t("createTask.addFiles")}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#052D50" />
            </TouchableOpacity>
          </GroupCard>

          {selectedDocuments.length > 0 ? (
            <View style={styles.documentsGrid}>
              {selectedDocuments.map((document, index) => {
                const typeMeta = getDocumentTypeMeta(document);
                const imageDocument = isImageDocument(document);

                return (
                  <View
                    key={`${document.uri}-${index}`}
                    style={styles.documentCard}
                  >
                    {imageDocument ? (
                      <Image
                        source={{ uri: document.uri }}
                        style={styles.documentImage}
                      />
                    ) : (
                      <View style={styles.documentFileContent}>
                        <FieldIcon name={typeMeta.icon} size={18} />
                        <Text numberOfLines={2} style={styles.documentName}>
                          {document.name}
                        </Text>
                        <Text style={styles.documentTypeBadge}>
                          {typeMeta.label}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}

          <SectionLabel>Notes</SectionLabel>
          <GroupCard>
            <GroupRow isLast={true}>
              <View style={styles.textAreaWrapper}>
                <Text style={styles.inputLabel}>
                  {t("createTask.notesLabel")}
                </Text>
                <TextInput
                  multiline={true}
                  style={[styles.input, styles.textAreaLarge]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t("tools.notesPlaceholder")}
                  placeholderTextColor="rgba(5, 45, 80, 0.45)"
                />
              </View>
            </GroupRow>
          </GroupCard>

          <DateTimeFieldModal
            visible={showStartDatePicker}
            title={t("createTask.starts")}
            value={startDate}
            onChange={(date) => {
              setAllDay(false);
              setStartDate(date);
            }}
            onClose={() => setShowStartDatePicker(false)}
          />
          <DateTimeFieldModal
            visible={showDueDatePicker}
            title={t("createTask.ends")}
            value={dueDate}
            onChange={(date) => {
              setAllDay(false);
              setDueDate(date);
            }}
            onClose={() => setShowDueDatePicker(false)}
          />
          <ProjectPickerModal
            visible={showProjectPicker}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={selectProject}
            onClose={() => setShowProjectPicker(false)}
          />
          <UserPickerModal
            visible={showUserPicker}
            users={users}
            selectedUserId={selectedAssigneeUserId}
            onSelect={selectUser}
            onClose={() => setShowUserPicker(false)}
          />
          <UserPickerModal
            visible={showAssigneePicker}
            users={users}
            multiple
            selectedUserIds={assigneeIds}
            onSelect={toggleAssignee}
            onClose={() => setShowAssigneePicker(false)}
          />
        </ScrollView>
      </View>

      <Modal
        visible={showNotificationsSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={closeNotificationsSheet}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={closeNotificationsSheet}
          />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {t("createTask.notificationsLabel")}
              </Text>
              <TouchableOpacity
                style={styles.sheetCloseButton}
                onPress={closeNotificationsSheet}
              >
                <Icon name="x" size={20} color="#052D50" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>
                  {t("createTask.whenToNotify")}
                </Text>
                <View style={styles.repeatCard}>
                  {REPEAT_OPTIONS.map((option, index) => {
                    const optionState = getRepeatOptionState({
                      repeatKey: option.key,
                      dueDate,
                      settings: notificationSettings,
                    });
                    const isSelected =
                      notificationSettings.repeat === option.key;

                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.repeatOptionRow,
                          index === REPEAT_OPTIONS.length - 1 &&
                            styles.groupRowLast,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => selectRepeatOption(option.key)}
                      >
                        <View style={styles.rowTextContainer}>
                          <Text style={styles.repeatOptionTitle}>
                            {option.key === "minutes"
                              ? getRepeatLabel(
                                  "minutes",
                                  normalizeRepeatIntervalMinutes(
                                    notificationRepeatInput,
                                  ),
                                )
                              : getRepeatLabel(option.key)}
                          </Text>
                          {optionState.helperText ? (
                            <Text style={styles.repeatOptionHint}>
                              {optionState.helperText}
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && styles.radioOuterSelected,
                          ]}
                        >
                          {isSelected ? (
                            <View style={styles.radioInner} />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View
                  style={[
                    styles.messageBox,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.inputLabel}>
                      {t("createTask.remindUntilDoneLabel")}
                    </Text>
                    <Text style={styles.allDayHint}>
                      {t("createTask.remindUntilDoneHint")}
                    </Text>
                  </View>
                  <Switch
                    value={Boolean(notificationSettings.remindUntilDone)}
                    onValueChange={(value) =>
                      updateNotificationSettings({ remindUntilDone: value })
                    }
                    trackColor={{
                      false: "#D9E3EC",
                      true: theme.colors.primary,
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {notificationSettings.repeat === "minutes" ||
                notificationSettings.remindUntilDone ? (
                  <View style={styles.intervalBox}>
                    <Text style={styles.inputLabel}>
                      {t("createTask.intervalLabel")}
                    </Text>
                    <TextInput
                      style={styles.intervalInput}
                      value={notificationRepeatInput}
                      onChangeText={setNotificationRepeatInput}
                      onBlur={() => {
                        const normalized = normalizeRepeatIntervalMinutes(
                          notificationRepeatInput,
                        );
                        setNotificationRepeatInput(String(normalized));
                        updateNotificationSettings({
                          repeatIntervalMinutes: normalized,
                        });
                      }}
                      keyboardType="number-pad"
                      placeholder={String(defaultRepeatIntervalMinutes)}
                      placeholderTextColor="rgba(5, 45, 80, 0.45)"
                    />
                  </View>
                ) : null}

                {notificationSettings.remindUntilDone ? (
                  <View style={styles.intervalBox}>
                    <Text style={styles.inputLabel}>
                      {t("createTask.maxRemindersLabel")}
                    </Text>
                    <TextInput
                      style={styles.intervalInput}
                      value={String(notificationSettings.maxReminders ?? 0)}
                      onChangeText={(v) => {
                        const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
                        updateNotificationSettings({
                          maxReminders: Number.isFinite(n)
                            ? Math.min(100, n)
                            : 0,
                        });
                      }}
                      keyboardType="number-pad"
                      placeholder="3"
                      placeholderTextColor="rgba(5, 45, 80, 0.45)"
                    />
                  </View>
                ) : null}

                {notificationSettings.remindUntilDone ? (
                  <View
                    style={[
                      styles.messageBox,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.inputLabel}>
                        {t("createTask.escalateToBossLabel")}
                      </Text>
                      <Text style={styles.allDayHint}>
                        {t("createTask.escalateToBossHint")}
                      </Text>
                    </View>
                    <Switch
                      value={Boolean(notificationSettings.escalateToBoss)}
                      onValueChange={(value) =>
                        updateNotificationSettings({ escalateToBoss: value })
                      }
                      trackColor={{
                        false: "#D9E3EC",
                        true: theme.colors.primary,
                      }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                ) : null}

                <View style={styles.messageBox}>
                  <Text style={styles.inputLabel}>
                    {t("createTask.customReminderLabel")}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.notificationMessageInput]}
                    value={notificationSettings.customMessage}
                    onChangeText={(value) =>
                      updateNotificationSettings({
                        customMessage: value,
                        autoReminder: !value.trim(),
                        customReminder: Boolean(value.trim()),
                      })
                    }
                    placeholder={t("createTask.customReminderPlaceholder")}
                    placeholderTextColor="rgba(5, 45, 80, 0.45)"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.sheetDoneButton}
              activeOpacity={0.85}
              onPress={closeNotificationsSheet}
            >
              <Icon name="check" size={18} color="#FFFFFF" />
              <Text style={styles.sheetDoneButtonText}>{t("common.done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
}
