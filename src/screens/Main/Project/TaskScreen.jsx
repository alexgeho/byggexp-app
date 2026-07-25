import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { taskService } from "../../../services";
import { isPdfDocument } from "../../../utils/documentPreview";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { resolveUploadUrl } from "../../../utils/shifts";
import { sortByNewest } from "../../../utils/sortByNewest";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import {
  canCompleteTasks,
  canManageDocuments,
  canReopenTasks,
} from "../../../utils/userRoles";

const GroupCard = ({ children }) => (
  <View style={styles.groupCard}>{children}</View>
);

const GroupRow = ({ children, isLast = false }) => (
  <View style={[styles.groupRow, isLast && styles.groupRowLast]}>
    {children}
  </View>
);

const formatDateParts = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
};

const resolveDocumentUrl = (url) => {
  if (!url) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return resolveUploadUrl(url);
};

const getDocumentName = (document, index) => {
  if (typeof document === "string") {
    const parts = document.split("/");
    return parts[parts.length - 1] || `Document ${index + 1}`;
  }

  return document?.name || `Document ${index + 1}`;
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

const getTaskDisplayStatus = (task) => {
  if (task?.status === "completed") {
    return {
      label: "Completed",
      tone: "completed",
    };
  }

  const dueTime = task?.dueDate ? new Date(task.dueDate).getTime() : null;

  if (dueTime && !Number.isNaN(dueTime) && dueTime < Date.now()) {
    return {
      label: "Overdue",
      tone: "overdue",
    };
  }

  return {
    label: "Open",
    tone: "open",
  };
};

export default function TaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { task, project, projectRouteKey, tasksRouteKey } = route.params || {};
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const [tab, setTab] = useState("Edit");
  const [currentTask, setCurrentTask] = useState(task || null);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const startDate = formatDateParts(currentTask?.startDate);
  const endDate = formatDateParts(currentTask?.dueDate);
  const taskStatus = getTaskDisplayStatus(currentTask);
  const canUploadDocuments = canManageDocuments(user?.role);
  const canComplete = canCompleteTasks(user?.role);
  const canReopen = canReopenTasks(user?.role);
  const canToggleCompletion =
    currentTask?.status === "completed" ? canReopen : canComplete;
  const visibleTabs = project ? ["Edit", "Documents", "Workers"] : ["Edit", "Documents"];

  const documents = useMemo(
    () =>
      Array.isArray(currentTask?.documents)
        ? sortByNewest(
            currentTask.documents.map((document, index) => ({
              id: document?._id || document?.url || `${index}`,
              name: getDocumentName(document, index),
              url: resolveDocumentUrl(
                typeof document === "string" ? document : document?.url,
              ),
              mimeType:
                typeof document === "string" ? "" : document?.mimeType || "",
              uploadedAt:
                typeof document === "string" ? null : document?.uploadedAt || null,
              createdAt:
                typeof document === "string" ? null : document?.createdAt || null,
              isImage: isImageDocument({
                name: getDocumentName(document, index),
                mimeType:
                  typeof document === "string" ? "" : document?.mimeType || "",
              }),
            })),
            (document) => [document?.uploadedAt, document?.createdAt],
          )
        : [],
    [currentTask?.documents],
  );

  const workers = useMemo(
    () =>
      Array.isArray(project?.workers)
        ? project.workers.filter(
            (worker) => worker && typeof worker === "object",
          )
        : [],
    [project?.workers],
  );

  const notifyProjectTaskUpdated = (updatedTask) => {
    if (!projectRouteKey || !project) {
      return;
    }

    navigation.navigate({
      name: "Project",
      key: projectRouteKey,
      params: {
        initialTab: "Tasks",
        refreshKey: `${updatedTask?._id || updatedTask?.id || task?._id || task?.id || Date.now()}-${Date.now()}`,
      },
      merge: true,
    });
  };

  const notifyTasksListUpdated = (updatedTask) => {
    if (!tasksRouteKey) {
      return;
    }

    navigation.navigate({
      name: "Tasks",
      key: tasksRouteKey,
      params: {
        refreshKey: `${updatedTask?._id || updatedTask?.id || task?._id || task?.id || Date.now()}-${Date.now()}`,
      },
      merge: true,
    });
  };

  const handleOpenDocument = async (document) => {
    if (!document?.url) {
      Alert.alert(
        "Document unavailable",
        "This file does not have a valid link.",
      );
      return;
    }

    try {
      if (document?.isImage || isPdfDocument(document)) {
        navigation.navigate("DocumentPreview", { document });
        return;
      }

      await Linking.openURL(document.url);
    } catch (error) {
      console.error("Failed to open document:", error);
      Alert.alert("Unable to open document", "Please try again later.");
    }
  };

  const handleAddDocuments = async () => {
    const taskId = currentTask?._id || currentTask?.id;

    if (!taskId) {
      Alert.alert("Task unavailable", "Task id is missing.");
      return;
    }

    try {
      const pickedAssets = await pickUploadAssets({
        fileNamePrefix: "task-document",
      });

      if (!pickedAssets.length) {
        return;
      }

      setUploadingDocuments(true);

      const formData = new FormData();
      pickedAssets.forEach((item, index) => {
        formData.append("documents", {
          uri: item.uri,
          name: item.name || `task-document-${index + 1}`,
          type: item.mimeType || "application/octet-stream",
        });
      });

      const updatedTask = await taskService.uploadDocuments(taskId, formData);
      if (updatedTask) {
        setCurrentTask(updatedTask);
      }

      showSuccess({
        title: "Documents added",
        message: `${pickedAssets.length} document${pickedAssets.length > 1 ? "s" : ""} added to the task.`,
      });
    } catch (error) {
      console.error("Failed to upload task documents:", error);
      Alert.alert(
        "Upload error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload documents right now.",
      );
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleToggleCompletion = async () => {
    const taskId = currentTask?._id || currentTask?.id;

    if (!taskId) {
      Alert.alert("Task unavailable", "Task id is missing.");
      return;
    }

    try {
      setUpdatingStatus(true);
      const updatedTask =
        currentTask?.status === "completed"
          ? await taskService.reopen(taskId)
          : await taskService.complete(taskId);

      setCurrentTask(updatedTask);
      notifyProjectTaskUpdated(updatedTask);
      notifyTasksListUpdated(updatedTask);
      showSuccess({
        title:
          updatedTask?.status === "completed"
            ? "Task completed"
            : "Task reopened",
        message:
          updatedTask?.status === "completed"
            ? "Task marked as completed."
            : "Task moved back to open.",
      });

      if (projectRouteKey || tasksRouteKey) {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      Alert.alert(
        "Task error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update task status right now.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

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
        <Text numberOfLines={1} style={styles.headerTitle}>
          {currentTask?.taskTitle || "Task"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        {visibleTabs.map((tabName) => (
          <TouchableOpacity
            key={tabName}
            onPress={() => setTab(tabName)}
            style={[styles.tabButton, tab === tabName && styles.activeTab]}
          >
            <Text style={styles.tabText}>{tabName}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {tab === "Edit" ? (
          <>
            <GroupCard>
              <GroupRow>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>Status</Text>
                  <View style={[styles.statusBadge, styles[`statusBadge_${taskStatus.tone}`]]}>
                    <Text style={[styles.statusBadgeText, styles[`statusBadgeText_${taskStatus.tone}`]]}>
                      {taskStatus.label}
                    </Text>
                  </View>
                </View>
              </GroupRow>
              <GroupRow>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>Title</Text>
                  <Text style={styles.rowValue}>
                    {currentTask?.taskTitle || "No title"}
                  </Text>
                </View>
              </GroupRow>
              <GroupRow>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>Description</Text>
                  <Text style={[styles.rowValue, styles.multilineValue]}>
                    {currentTask?.taskDescription || "No description provided"}
                  </Text>
                </View>
              </GroupRow>
              <GroupRow>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>
                    {project ? "Project" : "Assignee"}
                  </Text>
                  <Text style={styles.rowValue}>
                    {project?.name || currentTask?.assigneeUserName || "No assignee"}
                  </Text>
                </View>
              </GroupRow>
              <GroupRow>
                <View style={styles.scheduleRowContent}>
                  <Text style={styles.scheduleLabel}>Starts</Text>
                  {startDate ? (
                    <View style={styles.dateChips}>
                      <View style={styles.dateChip}>
                        <Text style={styles.dateChipText}>
                          {startDate.date}
                        </Text>
                      </View>
                      <View style={styles.dateChip}>
                        <Text style={styles.dateChipText}>
                          {startDate.time}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.rowValue}>No date</Text>
                  )}
                </View>
              </GroupRow>
              <GroupRow isLast={true}>
                <View style={styles.scheduleRowContent}>
                  <Text style={styles.scheduleLabel}>Ends</Text>
                  {endDate ? (
                    <View style={styles.dateChips}>
                      <View style={styles.dateChip}>
                        <Text style={styles.dateChipText}>{endDate.date}</Text>
                      </View>
                      <View style={styles.dateChip}>
                        <Text style={styles.dateChipText}>{endDate.time}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.rowValue}>No date</Text>
                  )}
                </View>
              </GroupRow>
            </GroupCard>
          </>
        ) : null}

        {tab === "Documents" ? (
          documents.length > 0 ? (
            documents.map((document) => {
              const typeMeta = getDocumentTypeMeta(document);

              return (
                <TouchableOpacity
                  key={document.id}
                  style={styles.documentItem}
                  onPress={() => handleOpenDocument(document)}
                  activeOpacity={0.85}
                >
                  <View style={styles.documentPreviewContainer}>
                    {document.isImage ? (
                      <Image
                        style={styles.documentPreviewImage}
                        source={{ uri: document.url }}
                      />
                    ) : (
                      <View style={styles.documentFilePreview}>
                        <Icon name={typeMeta.icon} size={24} color="#052D50" />
                        <Text style={styles.documentFileType}>
                          {typeMeta.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.documentInfo}>
                    <Text numberOfLines={2} style={styles.documentName}>
                      {document.name}
                    </Text>
                  </View>
                  <Image
                    style={styles.documentArrowIcon}
                    source={require("../../../assets/Arrow-right.png")}
                  />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No documents yet</Text>
              <Text style={styles.emptyStateText}>
                Task files will appear here.
              </Text>
            </View>
          )
        ) : null}

        {tab === "Workers" ? (
          workers.length > 0 ? (
            workers.map((worker) => (
              <View key={worker._id || worker.id} style={styles.workerItem}>
                <Image
                  style={styles.workerAvatar}
                  source={
                    worker.avatarUrl
                      ? { uri: resolveUploadUrl(worker.avatarUrl) }
                      : require("../../../assets/TasksAva.png")
                  }
                />
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>
                    {worker.name || "Unnamed worker"}
                  </Text>
                  <Text style={styles.workerSubtitle}>
                    {worker.profession || worker.email || "Worker"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No workers in project</Text>
              <Text style={styles.emptyStateText}>
                Project workers will appear here.
              </Text>
            </View>
          )
        ) : null}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={
          (tab === "Documents" && canUploadDocuments) ||
          (tab === "Edit" && canToggleCompletion)
        }
        onAddPress={tab === "Edit" ? handleToggleCompletion : handleAddDocuments}
        addDisabled={uploadingDocuments || updatingStatus}
        renderAddContent={() =>
          uploadingDocuments || updatingStatus ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : tab === "Edit" && currentTask?.status === "completed" ? (
            <Icon name="rotate-ccw" size={22} color="#FFFFFF" />
          ) : tab === "Edit" ? (
            <Icon name="check" size={22} color="#FFFFFF" />
          ) : (
            <Icon name="plus" size={22} color="#FFFFFF" />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    alignItems: "center",
    paddingBottom: 24,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    flex: 1,
    textAlign: "center",
    fontFamily: "DMSans-SemiBold",
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  tabContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  tabButton: {
    padding: 4,
    flex: 1,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  activeTab: {
    borderColor: "#0785F4",
  },
  tabText: {
    color: "#052D50",
    width: "100%",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    paddingBottom: 140,
  },
  groupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 12,
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
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    justifyContent: "center",
  },
  statusBadge_open: {
    backgroundColor: "rgba(7, 133, 244, 0.12)",
  },
  statusBadge_overdue: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
  },
  statusBadge_completed: {
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadgeText_open: {
    color: "#0785F4",
  },
  statusBadgeText_overdue: {
    color: "#FF3B30",
  },
  statusBadgeText_completed: {
    color: "#248A3D",
  },
  multilineValue: {
    lineHeight: 22,
  },
  dateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scheduleRowContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  scheduleLabel: {
    color: "#052D50",
    fontSize: 16,
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
  },
  documentItem: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  documentPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EFF3F8",
  },
  documentPreviewImage: {
    width: "100%",
    height: "100%",
  },
  documentFilePreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 8,
  },
  documentFileType: {
    color: "#052D50",
    fontSize: 11,
    fontWeight: "700",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    color: "#052D50",
    fontSize: 15,
  },
  documentArrowIcon: {
    width: 10,
    height: 20,
    tintColor: "#052D50",
  },
  workerItem: {
    width: "100%",
    padding: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    gap: 16,
    marginBottom: 12,
  },
  workerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 9999,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    color: "#052D50",
  },
  workerSubtitle: {
    marginTop: 2,
    color: "#698196",
    fontSize: 12,
  },
  emptyState: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyStateTitle: {
    color: "#052D50",
    fontSize: 18,
    marginBottom: 6,
  },
  emptyStateText: {
    color: "#698196",
  },
});
