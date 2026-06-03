import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import { chatService, projectService } from "../../../services";
import { isPdfDocument } from "../../../utils/documentPreview";
import { resolveUploadUrl } from "../../../utils/shifts";
import { sortByNewest } from "../../../utils/sortByNewest";
import { pickUploadAssets } from "../../../utils/uploadPicker";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.byggexp.se";

const formatDate = (value, withTime = false) => {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return withTime
    ? date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const formatFileSize = (value) => {
  const size = Number(value);

  if (!Number.isFinite(size) || size <= 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const resolveDocumentUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
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

export const ProjectScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const { theme } = useTheme();
  const { id, initialTab } = route.params || {};
  const [modal, setModal] = useState(
    initialTab || "Tasks",
  );
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatActionLoading, setChatActionLoading] = useState("");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const bottomSheetRef = useRef(null);

  const fetchProject = useCallback(async () => {
    if (!id) {
      setError("Project id is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await projectService.getPopulatedById(id);
      setProject(data);
    } catch (fetchError) {
      console.error("Failed to fetch project:", fetchError);
      setError("Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchProject();
    }, [fetchProject]),
  );

  useEffect(() => {
    setModal(initialTab || "Tasks");
  }, [initialTab, id]);

  const openWorkerModal = (worker) => {
    setSelectedWorker(worker);
    bottomSheetRef.current?.expand();
  };

  const renderBottomSheetBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.59}
        pressBehavior="close"
      />
    ),
    [],
  );

  const tasks = useMemo(
    () =>
      Array.isArray(project?.tasks)
        ? sortByNewest(
            project.tasks.filter((task) => task && typeof task === "object"),
            (task) => [
              task?.createdAt,
              task?.updatedAt,
              task?.startDate,
              task?.dueDate,
            ],
          )
        : [],
    [project?.tasks],
  );

  const documents = useMemo(
    () =>
      Array.isArray(project?.documents)
        ? sortByNewest(
            project.documents.map((document, index) => ({
              id: document?._id || document?.url || `${index}`,
              name: getDocumentName(document, index),
              url: resolveDocumentUrl(
                typeof document === "string" ? document : document?.url,
              ),
              mimeType:
                typeof document === "string" ? "" : document?.mimeType || "",
              size:
                typeof document === "string" ? null : (document?.size ?? null),
              uploadedAt:
                typeof document === "string"
                  ? null
                  : document?.uploadedAt ||
                    document?.createdAt ||
                    project?.createdAt ||
                    null,
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
    [project?.createdAt, project?.documents],
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
  const canCreateTasks = [
    "superadmin",
    "companyAdmin",
    "projectAdmin",
  ].includes(user?.role);
  const canManageDocuments = canCreateTasks;

  const handleOpenPersonalChat = async () => {
    const participantId = selectedWorker?._id || selectedWorker?.id;

    if (!participantId) {
      return;
    }

    try {
      setChatActionLoading("direct");
      const chat = await chatService.getOrCreateDirect(participantId);
      bottomSheetRef.current?.close();
      setSelectedWorker(null);
      navigation.navigate("SingleChat", {
        chatId: chat._id,
        initialChat: chat,
      });
    } catch (chatError) {
      console.error("Failed to open personal chat:", chatError);
      const message =
        chatError?.response?.data?.message || "Please try again later.";
      Alert.alert("Unable to open chat", message);
    } finally {
      setChatActionLoading("");
    }
  };

  const handleOpenProjectGroupChat = async () => {
    if (!id) {
      return;
    }

    try {
      setChatActionLoading("group");
      const chat = await chatService.getOrCreateProjectGroup(id, project?.name);
      bottomSheetRef.current?.close();
      setSelectedWorker(null);
      navigation.navigate("GroupChat", { chatId: chat._id, initialChat: chat });
    } catch (chatError) {
      console.error("Failed to open project chat:", chatError);
      const message =
        chatError?.response?.data?.message || "Please try again later.";
      Alert.alert("Unable to open group chat", message);
    } finally {
      setChatActionLoading("");
    }
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
    } catch (linkError) {
      console.error("Failed to open document:", linkError);
      Alert.alert("Unable to open document", "Please try again later.");
    }
  };

  const handleAddDocuments = async () => {
    if (!id) {
      Alert.alert("Project unavailable", "Project id is missing.");
      return;
    }

    try {
      const pickedAssets = await pickUploadAssets({
        fileNamePrefix: "project-document",
      });

      if (!pickedAssets.length) {
        return;
      }

      setUploadingDocuments(true);

      const formData = new FormData();
      pickedAssets.forEach((item, index) => {
        formData.append("documents", {
          uri: item.uri,
          name: item.name || `project-document-${index + 1}`,
          type: item.mimeType || "application/octet-stream",
        });
      });

      const updatedProject =
        await projectService.uploadDocuments(id, formData);

      if (updatedProject) {
        setProject(updatedProject);
      }

      setModal("Documents");
      showSuccess({
        title: "Documents added",
        message: `${pickedAssets.length} document${pickedAssets.length > 1 ? "s" : ""} added to the project.`,
      });
    } catch (uploadError) {
      console.error("Failed to upload project documents:", uploadError);
      Alert.alert(
        "Upload error",
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          "Unable to upload documents right now.",
      );
    } finally {
      setUploadingDocuments(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0785F4" />
        <Text style={styles.statusText}>Loading project...</Text>
      </View>
    );
  }

  const activeTabStyle = { borderColor: theme.colors.primary };
  const activeTabTextStyle = { color: theme.colors.primary };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text style={styles.projectName}>{project?.name || "Project"}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setModal("Tasks")}
          style={[
            styles.tabButton,
            modal === "Tasks" && styles.activeTab,
            modal === "Tasks" && activeTabStyle,
          ]}
        >
          <Text
            style={[styles.tabText, modal === "Tasks" && activeTabTextStyle]}
          >
            Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModal("Documents")}
          style={[
            styles.tabButton,
            modal === "Documents" && styles.activeTab,
            modal === "Documents" && activeTabStyle,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              modal === "Documents" && activeTabTextStyle,
            ]}
          >
            Documents
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModal("Workers")}
          style={[
            styles.tabButton,
            modal === "Workers" && styles.activeTab,
            modal === "Workers" && activeTabStyle,
          ]}
        >
          <Text
            style={[styles.tabText, modal === "Workers" && activeTabTextStyle]}
          >
            Workers
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Unable to load project</Text>
            <Text style={styles.emptyStateText}>{error}</Text>
          </View>
        ) : null}

        {modal === "Tasks" &&
          (tasks.length > 0 ? (
            tasks.map((task) => (
              <TouchableOpacity
                key={task._id || task.id || task.taskTitle}
                style={styles.taskItem}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Task", { task, project })}
              >
                <Text style={styles.taskTitle}>
                  {task.taskTitle || "Untitled task"}
                </Text>
                <Text style={styles.taskDescription}>
                  {task.taskDescription || "No description provided."}
                </Text>
                <View style={styles.taskFooter}>
                  <View style={styles.taskDate}>
                    <Image
                      style={styles.dateIcon}
                      source={require("../../../assets/TasksCalendar.png")}
                    />
                    <Text style={styles.dateText}>
                      {formatDate(task.dueDate, true)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No tasks yet</Text>
              <Text style={styles.emptyStateText}>
                There are no tasks assigned to this project.
              </Text>
            </View>
          ))}

        {modal === "Documents" &&
          (documents.length > 0 ? (
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
                    <Text style={styles.documentMeta}>
                      {`${formatFileSize(document.size)}   ${formatDate(document.uploadedAt)}`}
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
              <Text style={styles.emptyStateTitle}>No files uploaded</Text>
              <Text style={styles.emptyStateText}>
                Project files will appear here after upload.
              </Text>
            </View>
          ))}

        {modal === "Workers" &&
          (workers.length > 0 ? (
            workers.map((worker) => (
              <TouchableOpacity
                key={worker._id || worker.id}
                style={styles.workerItem}
                onPress={() => openWorkerModal(worker)}
              >
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
                <Image
                  style={styles.arrowIcon}
                  source={require("../../../assets/Arrow-right.png")}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No workers in project</Text>
              <Text style={styles.emptyStateText}>
                Assigned workers will appear in this list.
              </Text>
            </View>
          ))}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={
          (modal === "Tasks" && canCreateTasks) ||
          (modal === "Documents" && canManageDocuments)
        }
        onAddPress={() => {
          if (modal === "Documents") {
            handleAddDocuments();
            return;
          }

          navigation.navigate("CreateTask", {
            projectId: id,
            projectName: project?.name,
          });
        }}
        addDisabled={uploadingDocuments}
        renderAddContent={() =>
          uploadingDocuments ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Icon name="plus" size={22} color="#FFFFFF" />
          )
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["30%", "60%"]}
        enablePanDownToClose={true}
        onClose={() => setSelectedWorker(null)}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBottomSheetBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {selectedWorker && (
            <>
              <View style={styles.workerHeaderCard}>
                <Text style={styles.workerModalTitle}>
                  {selectedWorker.name}
                </Text>
                <Text style={styles.workerModalSubtitle}>
                  {selectedWorker.profession ||
                    selectedWorker.email ||
                    "Worker"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ShiftHistory", {
                    projectId: id,
                    workerId: selectedWorker._id || selectedWorker.id,
                    workerName: selectedWorker.name,
                    type: "history",
                  })
                }
                style={styles.modalOption}
              >
                <Text style={styles.optionText}>Shift history</Text>
                <Image
                  style={styles.optionArrow}
                  source={require("../../../assets/Arrow-right.png")}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenPersonalChat}
                style={styles.modalOption}
                disabled={chatActionLoading === "direct"}
              >
                <Text style={styles.optionText}>
                  {chatActionLoading === "direct"
                    ? "Opening personal chat..."
                    : "Personal chat"}
                </Text>
                <Image
                  style={styles.optionArrow}
                  source={require("../../../assets/Arrow-right.png")}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenProjectGroupChat}
                style={[styles.modalOption, styles.addGroupChat]}
                disabled={chatActionLoading === "group"}
              >
                <Text style={[styles.optionText, styles.addGroupChatText]}>
                  {chatActionLoading === "group"
                    ? "Opening group chat..."
                    : "Project group chat"}
                </Text>
                <Image
                  style={styles.optionArrow}
                  source={require("../../../assets/Arrow-right.png")}
                />
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    justifyContent: "space-between",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  statusText: {
    marginTop: 12,
    color: "#698196",
  },
  header: {
    ...standardScreenHeader,
  },
  backButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  projectName: {
    color: "#052D50",
    fontSize: 17,
    flex: 1,
    textAlign: "center",
    fontFamily: "DMSans-SemiBold",
  },
  headerPlaceholder: {
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
    paddingBottom: 120,
    width: "100%",
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
  taskItem: {
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
  },
  taskTitle: {
    color: "#052D50",
    fontSize: 22,
  },
  taskDescription: {
    color: "#052D5050",
  },
  taskFooter: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  taskDate: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 4,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: "#0177DE0D",
    borderRadius: 999,
  },
  dateIcon: {
    width: 14,
    height: 14,
  },
  dateText: {
    color: "#0785F4",
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
  documentMeta: {
    color: "#052D5050",
    marginTop: 4,
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
  workerName: {
    flex: 1,
    color: "#052D50",
  },
  workerInfo: {
    flex: 1,
  },
  workerSubtitle: {
    marginTop: 2,
    color: "#698196",
    fontSize: 12,
  },
  arrowIcon: {
    width: 16,
    height: 26,
    marginRight: 12,
  },
  bottomSheetBackground: {
    backgroundColor: "#EEEEEE",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: "#CCCCCC",
    width: 40,
    height: 4,
    borderRadius: 2,
    zIndex: 4,
    position: "relative",
  },
  bottomSheetContent: {
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  workerHeaderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  workerModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#052D50",
  },
  workerModalSubtitle: {
    color: "#698196",
    marginTop: 4,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    color: "#052D50",
  },
  optionArrow: {
    width: 10,
    height: 20,
    tintColor: "#052D50",
  },
  addGroupChat: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderColor: "#0091FF",
    borderWidth: 1,
  },
  addGroupChatText: {
    color: "#0091FF",
    fontWeight: "600",
  },
  floatingAddButton: {
    position: "absolute",
    right: 16,
    bottom: 32,
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
