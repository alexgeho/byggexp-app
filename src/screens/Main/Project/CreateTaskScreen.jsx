import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
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
import { useFeedback } from "../../../contexts/FeedbackContext";
import {
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
  standardScreenScrollContent,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import { projectService, taskService } from "../../../services";
import AuthContext from "../../../contexts/AuthContext";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import {
  buildTaskNotificationsPayload,
  createDefaultTaskNotificationSettings,
  getTaskNotificationSummary,
  normalizeTaskNotificationSettings,
} from "../../../utils/taskNotifications";

const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "calendar";

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

const DateFieldModal = ({ visible, title, value, onChange, onClose }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.datePickerOverlay}>
      <View style={styles.datePickerCard}>
        <Text style={styles.datePickerTitle}>{title}</Text>
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={DATE_PICKER_DISPLAY}
          onChange={(_event, date) => {
            if (date) {
              onChange(date);
            }
          }}
        />
        <TouchableOpacity style={styles.datePickerButton} onPress={onClose}>
          <Text style={styles.datePickerButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const getProjectId = (project) => project?._id || project?.id;

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

export default function CreateTaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const { user, userId } = useContext(AuthContext);
  const { projectId: initialProjectId, projectName: initialProjectName } =
    route.params || {};
  const initialTaskDraft = route.params?.taskDraft || {};

  const [selectedProjectId, setSelectedProjectId] = useState(
    initialTaskDraft.selectedProjectId || initialProjectId || "",
  );
  const [projectName, setProjectName] = useState(
    initialTaskDraft.projectName || initialProjectName || "",
  );
  const [projects, setProjects] = useState([]);
  const [taskTitle, setTaskTitle] = useState(initialTaskDraft.taskTitle || "");
  const [taskDescription, setTaskDescription] = useState(
    initialTaskDraft.taskDescription || "",
  );
  const [notes, setNotes] = useState(initialTaskDraft.notes || "");
  const [notificationSettings, setNotificationSettings] = useState(() =>
    createDefaultTaskNotificationSettings(),
  );
  const [selectedDocuments, setSelectedDocuments] = useState(
    initialTaskDraft.selectedDocuments || [],
  );
  const [startDate, setStartDate] = useState(
    parseDraftDate(initialTaskDraft.startDate),
  );
  const [dueDate, setDueDate] = useState(
    parseDraftDate(initialTaskDraft.dueDate),
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedProjectId || projectName) {
      return;
    }

    const fetchProject = async () => {
      try {
        setLoadingProject(true);
        const project = await projectService.getById(selectedProjectId);
        setProjectName(project?.name || "");
      } catch (error) {
        console.error("Failed to load project for task creation:", error);
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [selectedProjectId, projectName]);

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
        const userProjects =
          user.role === "worker" || user.role === "projectAdmin"
            ? data.filter((project) => {
                if (!project.workers?.length) {
                  return false;
                }

                return project.workers.some((worker) => {
                  const workerId =
                    typeof worker === "string"
                      ? worker
                      : worker?._id || worker?.id;
                  return workerId === userId;
                });
              })
            : data;

        setProjects(userProjects);
      } catch (error) {
        console.error("Failed to load projects for task creation:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user?.role, userId]);

  useEffect(() => {
    if (!route.params?.notificationSettings) {
      return;
    }

    setNotificationSettings(
      normalizeTaskNotificationSettings(route.params.notificationSettings),
    );
  }, [route.params?.notificationSettings]);

  useEffect(() => {
    const taskDraft = route.params?.taskDraft;

    if (!taskDraft) {
      return;
    }

    setSelectedProjectId(taskDraft.selectedProjectId || "");
    setProjectName(taskDraft.projectName || "");
    setTaskTitle(taskDraft.taskTitle || "");
    setTaskDescription(taskDraft.taskDescription || "");
    setNotes(taskDraft.notes || "");
    setSelectedDocuments(taskDraft.selectedDocuments || []);
    setStartDate(parseDraftDate(taskDraft.startDate));
    setDueDate(parseDraftDate(taskDraft.dueDate));
  }, [route.params?.taskDraft]);

  const notificationsSummary = useMemo(
    () => getTaskNotificationSummary(notificationSettings),
    [notificationSettings],
  );

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
    setProjectName(project?.name || "");
    setShowProjectPicker(false);
  };

  const buildTaskDraft = () => ({
    selectedProjectId,
    projectName,
    taskTitle,
    taskDescription,
    notes,
    selectedDocuments,
    startDate: startDate ? startDate.toISOString() : null,
    dueDate: dueDate ? dueDate.toISOString() : null,
  });

  const createTask = async () => {
    if (!selectedProjectId) {
      Alert.alert("Validation error", "Project is required to create a task.");
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert("Validation error", "Task title is required.");
      return;
    }

    try {
      setSaving(true);
      const taskData = new FormData();
      const notifications = buildTaskNotificationsPayload({
        settings: notificationSettings,
        dueDate,
      });

      taskData.append("projectId", selectedProjectId);
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
        JSON.stringify(notificationSettings),
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

      await taskService.create(taskData);
      showSuccess({
        title: "Task created",
        message: "Task created successfully.",
      });
      navigation.goBack();
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

  const fieldIconBadgeStyle = { backgroundColor: theme.colors.primaryIconBadge };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint="light"
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>Create task</Text>
          <View style={styles.placeholder} />
        </View>

        <SectionLabel>General</SectionLabel>
        <GroupCard>
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => setShowProjectPicker(true)}
            activeOpacity={0.85}
            disabled={loadingProjects}
          >
            <View style={styles.rowContent}>
              <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                <FieldIcon name="folder" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowLabel}>Project *</Text>
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
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => setShowStartDatePicker(true)}
            activeOpacity={0.85}
          >
            <View style={styles.rowContent}>
              <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                <FieldIcon name="calendar" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowLabel}>Start date</Text>
                <Text
                  style={[styles.rowValue, !startDate && styles.rowPlaceholder]}
                >
                  {startDate ? startDate.toLocaleDateString() : "Select date"}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.groupRow, styles.groupRowLast]}
            onPress={() => setShowDueDatePicker(true)}
            activeOpacity={0.85}
          >
            <View style={styles.rowContent}>
              <View style={[styles.rowIcon, fieldIconBadgeStyle]}>
                <FieldIcon name="clock" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowLabel}>Due date</Text>
                <Text
                  style={[styles.rowValue, !dueDate && styles.rowPlaceholder]}
                >
                  {dueDate ? dueDate.toLocaleDateString() : "Select date"}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>
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
            onPress={() =>
              navigation.navigate("TaskNotifications", {
                projectId: selectedProjectId,
                startDate: startDate ? startDate.toISOString() : null,
                dueDate: dueDate ? dueDate.toISOString() : null,
                notificationSettings,
                taskDraft: buildTaskDraft(),
              })
            }
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
                    notificationsSummary === "Set notifications" &&
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

        <DateFieldModal
          visible={showStartDatePicker}
          title="Start date"
          value={startDate}
          onChange={setStartDate}
          onClose={() => setShowStartDatePicker(false)}
        />
        <DateFieldModal
          visible={showDueDatePicker}
          title="Due date"
          value={dueDate}
          onChange={setDueDate}
          onClose={() => setShowDueDatePicker(false)}
        />
        <ProjectPickerModal
          visible={showProjectPicker}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelect={selectProject}
          onClose={() => setShowProjectPicker(false)}
        />
      </ScrollView>
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
  contentContainer: {
    ...standardScreenScrollContent,
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
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    fontFamily: "DMSans-SemiBold",
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
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
});
