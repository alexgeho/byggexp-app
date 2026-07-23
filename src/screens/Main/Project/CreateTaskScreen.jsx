import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import FloatingActionButton from "../../../components/common2/FloatingActionButton/FloatingActionButton";
import { useFeedback } from "../../../contexts/FeedbackContext";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";
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
import {
  defaultRepeatIntervalMinutes,
} from "../../../theme/settings";
import { canCreateTasks } from "../../../utils/userRoles";

const DATETIME_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "default";
const DEFAULT_ALL_DAY_START_TIME = "08:00";
const DEFAULT_ALL_DAY_DURATION_MINUTES = 8 * 60;

const FieldIcon = ({
  library = "feather",
  name,
  size = 20,
  color = "#052D50",
}) => {
  if (library === "material-community") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Icon name={name} size={size} color={color} />;
};

const getFileExtension = (fileName = "") => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "";
};

const isImageDocument = (document) => {
  const mimeType = document?.mimeType || "";
  const extension = getFileExtension(document?.name || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"].includes(extension)
  );
};

const getDocumentTypeMeta = (document) => {
  const extension = getFileExtension(document?.name || "");
  const mimeType = document?.mimeType || "";

  if (isImageDocument(document)) {
    return { icon: "image", label: extension || "IMAGE" };
  }

  if (mimeType.includes("pdf") || extension === "PDF") {
    return { icon: "file-text", label: "PDF" };
  }

  if (["DOC", "DOCX", "TXT", "RTF"].includes(extension)) {
    return { icon: "file-text", label: extension || "DOC" };
  }

  if (["XLS", "XLSX", "CSV"].includes(extension)) {
    return { icon: "grid", label: extension || "XLS" };
  }

  return { icon: "file", label: extension || "FILE" };
};

const SectionLabel = () => null;

const GroupCard = ({ children }) => (
  <View style={styles.groupCard}>{children}</View>
);

const GroupRow = ({ children, isLast = false }) => (
  <View style={[styles.groupRow, isLast && styles.groupRowLast]}>
    {children}
  </View>
);

const getUserInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
};

const formatScheduleDate = (date) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatScheduleTime = (date) =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const parseScheduleTimeToMinutes = (time) => {
  const [hours, minutes] = String(time || "").split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const createDateAtMinutes = (baseDate, minutes) => {
  const date = new Date(baseDate);
  const dayOffset = Math.floor(minutes / (24 * 60));
  const minutesOfDay = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);

  date.setDate(date.getDate() + dayOffset);
  date.setHours(Math.floor(minutesOfDay / 60), minutesOfDay % 60, 0, 0);

  return date;
};

const buildAllDayRange = (project, baseDate = new Date()) => {
  const shiftSchedule = project?.shiftSchedule;
  const hasProjectWorkday =
    shiftSchedule?.enabled &&
    shiftSchedule?.workDayStartTime &&
    shiftSchedule?.workDayEndTime;
  const fallbackStartMinutes =
    parseScheduleTimeToMinutes(DEFAULT_ALL_DAY_START_TIME) || 0;
  let startMinutes = hasProjectWorkday
    ? parseScheduleTimeToMinutes(shiftSchedule.workDayStartTime)
    : fallbackStartMinutes;
  let endMinutes = hasProjectWorkday
    ? parseScheduleTimeToMinutes(shiftSchedule.workDayEndTime)
    : fallbackStartMinutes + DEFAULT_ALL_DAY_DURATION_MINUTES;

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    startMinutes = startMinutes ?? fallbackStartMinutes;
    endMinutes = startMinutes + DEFAULT_ALL_DAY_DURATION_MINUTES;
  }

  return {
    start: createDateAtMinutes(baseDate, startMinutes),
    end: createDateAtMinutes(baseDate, endMinutes),
  };
};

const DateTimeFieldModal = ({ visible, title, value, onChange, onClose }) => {
  const [draftDate, setDraftDate] = useState(value || new Date());

  useEffect(() => {
    if (visible) {
      setDraftDate(value || new Date());
    }
  }, [visible, value]);

  const handleDone = () => {
    onChange(draftDate);
    onClose();
  };

  const handleDateChange = (_event, date) => {
    if (!date) {
      return;
    }

    if (Platform.OS === "android") {
      setDraftDate((previousDate) => {
        const nextDate = new Date(date);
        nextDate.setHours(
          previousDate.getHours(),
          previousDate.getMinutes(),
          0,
          0,
        );
        return nextDate;
      });
      return;
    }

    setDraftDate(date);
  };

  const handleTimeChange = (_event, date) => {
    if (!date) {
      return;
    }

    setDraftDate((previousDate) => {
      const nextDate = new Date(previousDate);
      nextDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      return nextDate;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>{title}</Text>
          {Platform.OS === "android" ? (
            <>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="calendar"
                onChange={handleDateChange}
              />
              <DateTimePicker
                value={draftDate}
                mode="time"
                display="clock"
                onChange={handleTimeChange}
              />
            </>
          ) : (
            <DateTimePicker
              value={draftDate}
              mode="datetime"
              display={DATETIME_PICKER_DISPLAY}
              onChange={(_event, date) => {
                if (date) {
                  setDraftDate(date);
                }
              }}
            />
          )}
          <TouchableOpacity style={styles.datePickerButton} onPress={handleDone}>
            <Text style={styles.datePickerButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ScheduleDateRow = ({ label, value, onPress, isLast = false }) => (
  <View style={[styles.scheduleRow, isLast && styles.groupRowLast]}>
    <Text style={styles.scheduleLabel}>{label}</Text>
    <View style={styles.dateChips}>
      <TouchableOpacity
        style={styles.dateChip}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.dateChipText,
            !value && styles.dateChipPlaceholder,
          ]}
        >
          {value ? formatScheduleDate(value) : "Select date"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dateChip}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.dateChipText,
            !value && styles.dateChipPlaceholder,
          ]}
        >
          {value ? formatScheduleTime(value) : "Select time"}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const getProjectId = (project) => project?._id || project?.id;

const getUserId = (user) => user?._id || user?.id;

const parseDraftDate = (date) => {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const ProjectPickerModal = ({
  visible,
  projects,
  selectedProjectId,
  onSelect,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.projectPickerOverlay}>
      <View style={styles.projectPickerCard}>
        <View style={styles.projectPickerHeader}>
          <Text style={styles.projectPickerTitle}>Select project</Text>
          <TouchableOpacity onPress={onClose} style={styles.projectPickerClose}>
            <Icon name="x" size={20} color="#052D50" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.projectPickerList}
          contentContainerStyle={styles.projectPickerListContent}
        >
          {projects.length === 0 ? (
            <Text style={styles.projectPickerEmpty}>No projects found.</Text>
          ) : (
            projects.map((project) => {
              const id = getProjectId(project);
              const isSelected = id === selectedProjectId;

              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.projectPickerItem,
                    isSelected && styles.projectPickerItemSelected,
                  ]}
                  onPress={() => onSelect(project)}
                  activeOpacity={0.85}
                >
                  <View style={styles.projectPickerItemText}>
                    <Text style={styles.projectPickerItemTitle}>
                      {project.name || "Untitled project"}
                    </Text>
                    {!!project.location && (
                      <Text style={styles.projectPickerItemSubtitle}>
                        {project.location}
                      </Text>
                    )}
                  </View>

                  {isSelected ? (
                    <Icon name="check" size={18} color="#0091FF" />
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const UserPickerModal = ({
  visible,
  users,
  selectedUserId,
  onSelect,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.projectPickerOverlay}>
      <View style={styles.projectPickerCard}>
        <View style={styles.projectPickerHeader}>
          <Text style={styles.projectPickerTitle}>Select user</Text>
          <TouchableOpacity onPress={onClose} style={styles.projectPickerClose}>
            <Icon name="x" size={20} color="#052D50" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.projectPickerList}
          contentContainerStyle={styles.projectPickerListContent}
        >
          {users.length === 0 ? (
            <Text style={styles.projectPickerEmpty}>No users found.</Text>
          ) : (
            users.map((item) => {
              const id = getUserId(item);
              const isSelected = id === selectedUserId;

              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.projectPickerItem,
                    isSelected && styles.projectPickerItemSelected,
                  ]}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.projectPickerItemText}>
                    <Text style={styles.projectPickerItemTitle}>
                      {item.name || item.email || "Unnamed user"}
                    </Text>
                    <Text style={styles.projectPickerItemSubtitle}>
                      {item.profession || item.role || "User"}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Icon name="check" size={18} color="#0091FF" />
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export default function CreateTaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const { user } = useContext(AuthContext);
  const { projectId: initialProjectId, projectName: initialProjectName } =
    route.params || {};
  const initialTaskDraft = route.params?.taskDraft || {};
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
            ? await projectService.getAll()
            : await projectService.getMyProjects();

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

    const project = projects.find((item) => getProjectId(item) === selectedProjectId);

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

    setNotificationSettings(
      normalizeTaskNotificationSettings(route.params.notificationSettings),
    );
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

  const notificationsSummary = useMemo(
    () => getTaskNotificationSummary(notificationSettings),
    [notificationSettings],
  );

  const effectiveSelectedProject = useMemo(() => {
    if (selectedProject && getProjectId(selectedProject) === selectedProjectId) {
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
    const normalizedInterval =
      normalizeRepeatIntervalMinutes(notificationRepeatInput);

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
      Alert.alert("Documents error", "Unable to select documents right now.");
    }
  };

  const selectProject = (project) => {
    setSelectedProjectId(getProjectId(project) || "");
    setSelectedProject(project || null);
    setProjectName(project?.name || "");
    setSelectedAssigneeUserId("");
    setSelectedAssigneeName("");
    setSelectedAssigneeRole("");
    setShowProjectPicker(false);
    updateNotificationSettings(createDefaultTaskNotificationSettings());

    if (allDay) {
      applyAllDayRange(project);
    }
  };

  const selectUser = (nextUser) => {
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
    setSelectedAssigneeUserId("");
    setSelectedAssigneeName("");
    setSelectedAssigneeRole("");
  };

  const createTask = async () => {
    if (!selectedProjectId && !selectedAssigneeUserId) {
      Alert.alert(
        "Validation error",
        "Select a project or one user to create a task.",
      );
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert("Validation error", "Task title is required.");
      return;
    }

    try {
      setSaving(true);
      const taskData = new FormData();
      const effectiveNotificationSettings = selectedAssigneeUserId
        ? {
            ...deriveNotificationReminderFlags(notificationSettings),
            allMembersNotification: false,
            assignees: [
              {
                id: selectedAssigneeUserId,
                name: selectedAssigneeName,
                profession: selectedAssigneeRole,
              },
            ],
          }
        : deriveNotificationReminderFlags(notificationSettings);
      const notifications = buildTaskNotificationsPayload({
        settings: effectiveNotificationSettings,
        dueDate,
      });

      if (selectedAssigneeUserId) {
        taskData.append("assigneeUserId", selectedAssigneeUserId);
      } else {
        taskData.append("projectId", selectedProjectId);
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
        title: "Task created",
        message: "Task created successfully.",
      });

      if (returnTarget === "project" && !selectedAssigneeUserId) {
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
      Alert.alert("Error", error?.message || "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProject) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  if (!allowedToCreate) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>Access denied</Text>
        <Text style={styles.accessDeniedSubtext}>
          Only project admins can create tasks
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fieldIconBadgeStyle = { backgroundColor: theme.colors.primaryIconBadge };

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
          <Text style={styles.headerTitle}>Create task</Text>
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
              selectedAssigneeUserId && styles.groupRowDisabled,
            ]}
            onPress={() => setShowProjectPicker(true)}
            activeOpacity={0.85}
            disabled={loadingProjects || Boolean(selectedAssigneeUserId)}
          >
            <View style={styles.rowContent}>
              <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                <FieldIcon name="folder" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowLabel}>Project</Text>
                <Text
                  style={[
                    styles.rowValue,
                    !projectName && styles.rowPlaceholder,
                  ]}
                >
                  {loadingProjects
                    ? "Loading projects..."
                    : projectName || "Select project"}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => setShowUserPicker(true)}
            activeOpacity={0.85}
            disabled={loadingUsers}
          >
            <View style={styles.rowContent}>
              <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                <FieldIcon name="user" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowLabel}>Personal task user</Text>
                <Text
                  style={[
                    styles.rowValue,
                    !selectedAssigneeName && styles.rowPlaceholder,
                  ]}
                >
                  {loadingUsers
                    ? "Loading users..."
                    : selectedAssigneeName || "Select worker or foreman"}
                </Text>
              </View>
            </View>
            {selectedAssigneeUserId ? (
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
          <GroupRow isLast={true}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Task title *</Text>
              <TextInput
                style={styles.input}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Enter task title"
                placeholderTextColor="rgba(5, 45, 80, 0.45)"
              />
            </View>
          </GroupRow>
        </GroupCard>

        <SectionLabel>Schedule</SectionLabel>
        <GroupCard>
          <GroupRow>
            <View style={styles.allDayTextContainer}>
              <Text style={styles.scheduleLabel}>All day</Text>
              <Text style={styles.allDayHint}>
                Use project workday or default 8 hours
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
            label="Starts"
            value={startDate}
            onPress={() => setShowStartDatePicker(true)}
          />
          <ScheduleDateRow
            label="Ends"
            value={dueDate}
            onPress={() => setShowDueDatePicker(true)}
            isLast={true}
          />
        </GroupCard>

        <SectionLabel>Details</SectionLabel>
        <GroupCard>
          <GroupRow>
            <View style={styles.textAreaWrapper}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                multiline={true}
                style={[styles.input, styles.textArea]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Add task description"
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
                <Text style={styles.rowLabel}>Notifications</Text>
                <Text
                  style={[
                    styles.rowValue,
                    notificationsSummary === "Off" &&
                      styles.rowPlaceholder,
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
                <Text style={styles.rowLabel}>Documents</Text>
                <Text
                  style={[
                    styles.rowValue,
                    selectedDocuments.length === 0 && styles.rowPlaceholder,
                  ]}
                >
                  {selectedDocuments.length > 0
                    ? `${selectedDocuments.length} file${selectedDocuments.length > 1 ? "s" : ""}`
                    : "Add files"}
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
              <Text style={styles.inputLabel}>Internal notes</Text>
              <TextInput
                multiline={true}
                style={[styles.input, styles.textAreaLarge]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes"
                placeholderTextColor="rgba(5, 45, 80, 0.45)"
              />
            </View>
          </GroupRow>
        </GroupCard>

        <DateTimeFieldModal
          visible={showStartDatePicker}
          title="Starts"
          value={startDate}
          onChange={(date) => {
            setAllDay(false);
            setStartDate(date);
          }}
          onClose={() => setShowStartDatePicker(false)}
        />
        <DateTimeFieldModal
          visible={showDueDatePicker}
          title="Ends"
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
              <Text style={styles.sheetTitle}>Notifications</Text>
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
                <Text style={styles.sheetSectionTitle}>When to notify</Text>
                <View style={styles.repeatCard}>
                  {REPEAT_OPTIONS.map((option, index) => {
                    const optionState = getRepeatOptionState({
                      repeatKey: option.key,
                      dueDate,
                      settings: notificationSettings,
                    });
                    const isSelected = notificationSettings.repeat === option.key;

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
                              : option.label}
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
                          {isSelected ? <View style={styles.radioInner} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {notificationSettings.repeat === "minutes" ? (
                  <View style={styles.intervalBox}>
                    <Text style={styles.inputLabel}>Interval (minutes)</Text>
                    <TextInput
                      style={styles.intervalInput}
                      value={notificationRepeatInput}
                      onChangeText={setNotificationRepeatInput}
                      onBlur={() => {
                        const normalized =
                          normalizeRepeatIntervalMinutes(notificationRepeatInput);
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

                <View style={styles.messageBox}>
                  <Text style={styles.inputLabel}>Custom reminder</Text>
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
                    placeholder="Leave empty for auto reminder"
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
              <Text style={styles.sheetDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={createTask}
        addDisabled={saving}
        renderAddContent={() =>
          saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="check" size={28} color="#FFFFFF" />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  pageContainer: {
    ...standardScreenContainer,
    paddingBottom: 0,
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    paddingBottom: 140,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEEEEE",
  },
  loadingText: {
    marginTop: 12,
    color: "#698196",
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#EEEEEE",
  },
  accessDeniedText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#052D50",
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 15,
    color: "#698196",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#0091FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    fontFamily: "DMSans-SemiBold",
  },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    color: "#698196",
    fontSize: 13,
    fontWeight: "600",
  },
  groupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  groupRow: {
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupRowLast: {
    borderBottomWidth: 0,
  },
  groupRowDisabled: {
    opacity: 0.45,
  },
  rowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 27,
    height: 27,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    color: "#698196",
    fontSize: 12,
    marginBottom: 2,
  },
  rowValue: {
    color: "#052D50",
    fontSize: 16,
  },
  rowPlaceholder: {
    color: "rgba(5, 45, 80, 0.45)",
  },
  rowHint: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 18,
  },
  clearInlineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 45, 80, 0.06)",
  },
  inputWrapper: {
    width: "100%",
  },
  textAreaWrapper: {
    width: "100%",
  },
  inputLabel: {
    color: "#698196",
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    color: "#052D50",
    fontSize: 16,
    paddingVertical: 0,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
    paddingTop: 6,
  },
  textAreaLarge: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 6,
  },
  documentsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  documentCard: {
    width: "23%",
    height: 84,
    backgroundColor: "#EFEFF0",
    borderRadius: 12,
    overflow: "hidden",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  documentFileContent: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
  },
  documentName: {
    color: "#052D50",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "500",
  },
  documentTypeBadge: {
    color: "#052D50",
    fontSize: 10,
    fontWeight: "700",
  },
  projectPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 45, 80, 0.28)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  projectPickerCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "75%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  projectPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  projectPickerTitle: {
    color: "#052D50",
    fontSize: 18,
    fontWeight: "600",
  },
  projectPickerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 45, 80, 0.06)",
  },
  projectPickerList: {
    width: "100%",
  },
  projectPickerListContent: {
    gap: 8,
  },
  projectPickerEmpty: {
    color: "#698196",
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 20,
  },
  projectPickerItem: {
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(5, 45, 80, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  projectPickerItemSelected: {
    borderColor: "#0091FF",
    backgroundColor: "rgba(0, 145, 255, 0.08)",
  },
  projectPickerItemText: {
    flex: 1,
  },
  projectPickerItemTitle: {
    color: "#052D50",
    fontSize: 16,
    fontWeight: "600",
  },
  projectPickerItemSubtitle: {
    color: "#698196",
    fontSize: 13,
    marginTop: 2,
  },
  createButton: {
    height: 56,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
    boxShadow: "0px 2px 7px 0px rgba(0, 0, 0, 0.25)",
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 45, 80, 0.28)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  datePickerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  datePickerTitle: {
    color: "#052D50",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  datePickerButton: {
    marginTop: 12,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#0091FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
    boxShadow: "0px 2px 7px 0px rgba(0, 0, 0, 0.25)",
  },
  datePickerButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scheduleRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  scheduleLabel: {
    color: "#052D50",
    fontSize: 16,
    fontFamily: "DMSans-Regular",
  },
  allDayTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  allDayHint: {
    color: "#698196",
    fontSize: 12,
    marginTop: 2,
  },
  dateChips: {
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
  },
  dateChip: {
    backgroundColor: "#7676801F",
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
  },
  dateChipText: {
    color: "#052D50",
    fontSize: 14,
    fontFamily: "DMSans-Regular",
  },
  dateChipPlaceholder: {
    color: "rgba(5, 45, 80, 0.45)",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 45, 80, 0.32)",
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetCard: {
    maxHeight: "88%",
    backgroundColor: "#EEF5FB",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(5, 45, 80, 0.22)",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: {
    color: "#052D50",
    fontSize: 20,
    fontFamily: "DMSans-SemiBold",
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 45, 80, 0.06)",
  },
  sheetScroll: {
    width: "100%",
  },
  sheetContent: {
    paddingBottom: 16,
  },
  sheetSection: {
    marginBottom: 16,
  },
  sheetSectionTitle: {
    color: "#052D50",
    fontSize: 16,
    fontFamily: "DMSans-SemiBold",
    marginBottom: 8,
  },
  sheetGroupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  notificationRow: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetSearchBar: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  sheetSearchInput: {
    flex: 1,
    color: "#052D50",
    fontSize: 15,
  },
  sheetLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  sheetLoadingText: {
    color: "#698196",
    fontSize: 13,
  },
  sheetEmptyText: {
    color: "#698196",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 18,
  },
  workerPickerList: {
    gap: 8,
    marginTop: 10,
  },
  workerPickerItem: {
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  workerAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D9E8F5",
    alignItems: "center",
    justifyContent: "center",
  },
  workerAvatarInitials: {
    color: "#052D50",
    fontSize: 13,
    fontFamily: "DMSans-SemiBold",
  },
  workerPickerText: {
    flex: 1,
  },
  workerName: {
    color: "#052D50",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
    marginBottom: 2,
  },
  workerRole: {
    color: "#698196",
    fontSize: 13,
  },
  workerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(5, 45, 80, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  workerCheckboxSelected: {
    backgroundColor: "#0091FF",
    borderColor: "#0091FF",
  },
  messageBox: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 22,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  notificationMessageInput: {
    minHeight: 44,
  },
  repeatDescription: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  repeatCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  repeatOptionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  repeatOptionTitle: {
    color: "#052D50",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
    marginBottom: 4,
  },
  repeatOptionTitleDisabled: {
    color: "rgba(5, 45, 80, 0.45)",
  },
  repeatOptionHint: {
    color: "#698196",
    fontSize: 12,
    lineHeight: 17,
  },
  repeatOptionHintDisabled: {
    color: "rgba(105, 129, 150, 0.8)",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#C5D4E2",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#0091FF",
  },
  radioOuterDisabled: {
    opacity: 0.55,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#0091FF",
  },
  intervalBox: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 22,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    gap: 8,
  },
  intervalInput: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.12)",
    paddingHorizontal: 14,
    color: "#052D50",
    fontSize: 16,
    fontFamily: "DMSans-Medium",
  },
  sheetDoneButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sheetDoneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans-SemiBold",
  },
});
