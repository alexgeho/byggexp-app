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
    date: date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
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

export default function TaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { task, project } = route.params || {};
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const [tab, setTab] = useState("Edit");
  const [currentTask, setCurrentTask] = useState(task || null);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const startDate = formatDateParts(currentTask?.startDate);
  const endDate = formatDateParts(currentTask?.dueDate);
  const canManageDocuments = [
    "superadmin",
    "companyAdmin",
    "projectAdmin",
  ].includes(user?.role);

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
        {["Edit", "Documents", "Workers"].map((tabName) => (
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
                  <Text style={styles.rowLabel}>Project</Text>
                  <Text style={styles.rowValue}>
                    {project?.name || "No project"}
                  </Text>
                </View>
              </GroupRow>
              <GroupRow>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>Start date</Text>
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
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowLabel}>End date</Text>
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
        showAddButton={tab === "Documents" && canManageDocuments}
        onAddPress={handleAddDocuments}
        addDisabled={uploadingDocuments}
        renderAddContent={() =>
          uploadingDocuments ? (
            <ActivityIndicator color="#FFFFFF" />
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
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
  multilineValue: {
    lineHeight: 22,
  },
  dateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  dateChip: {
    backgroundColor: "#7676801F",
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 6,
    justifyContent: "center",
  },
  dateChipText: {
    color: "#052D50",
    lineHeight: 34,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
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
