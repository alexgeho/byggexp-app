import { getDateLocale } from "../../../utils/dateLocale";
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
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import { projectService } from "../../../services";
import { isPdfDocument } from "../../../utils/documentPreview";
import { resolveUploadUrl } from "../../../utils/shifts";
import { sortByNewest } from "../../../utils/sortByNewest";
import { cardStyles } from "../../../styles/cards";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import {
  canCreateTasks,
  canManageDocuments,
  canManageWorkers,
  shouldShowAccountStatus,
} from "../../../utils/userRoles";
import { API_BASE_URL } from "../../../config/env";

const formatDate = (value, withTime = false, t = null) => {
  const noDate = t ? t("project.noDate") : "No date";
  if (!value) return noDate;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return noDate;

  return withTime
    ? date.toLocaleString(getDateLocale(), {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString(getDateLocale(), {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
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

const taskBadgeStyles = {
  open: cardStyles.cardBadgeOpen,
  overdue: cardStyles.cardBadgeOverdue,
  completed: cardStyles.cardBadgeCompleted,
};

const normalizeRefId = (value) =>
  String(value?._id || value?.id || value || "");

// A worker counts as "at work" when their live status is working on this
// project.
const isWorkerAtWork = (worker, projectId) =>
  worker?.workStatus === "working" &&
  (!projectId ||
    normalizeRefId(worker?.workStatusProjectId) === String(projectId));

// Match the Employees list ordering: not-yet-confirmed accounts first (when
// that field is available), then people who are away, and those at work last.
const getWorkerSortPriority = (worker, projectId) => {
  if (shouldShowAccountStatus(worker?.accountStatus)) {
    return 0;
  }
  return isWorkerAtWork(worker, projectId) ? 2 : 1;
};

const formatFileSize = (value, t = null) => {
  const size = Number(value);

  if (!Number.isFinite(size) || size <= 0) {
    return t ? t("project.unknownSize") : "Unknown size";
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
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const { theme } = useTheme();
  const { id, initialTab, refreshKey } = route.params || {};
  const [modal, setModal] = useState(initialTab || "Tasks");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!id) {
      setError(t("project.idMissing"));
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
      setError(t("project.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      fetchProject();
    }, [fetchProject]),
  );

  useEffect(() => {
    setModal(initialTab || "Tasks");
  }, [initialTab, id]);

  useEffect(() => {
    if (!refreshKey) {
      return;
    }

    fetchProject();
  }, [fetchProject, refreshKey]);

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
                typeof document === "string"
                  ? null
                  : document?.createdAt || null,
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
        ? project.workers
            .filter((worker) => worker && typeof worker === "object")
            .sort(
              (left, right) =>
                getWorkerSortPriority(left, id) -
                getWorkerSortPriority(right, id),
            )
        : [],
    [project?.workers, id],
  );
  const canCreateProjectTasks = canCreateTasks(user?.role);
  const canUploadDocuments = canManageDocuments(user?.role);
  const canEditWorkers = canManageWorkers(user?.role);

  const handleOpenDocument = async (document) => {
    if (!document?.url) {
      Alert.alert(
        t("project.documentUnavailableTitle"),
        t("project.documentUnavailableMessage"),
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
      Alert.alert(t("project.openErrorTitle"), t("project.openErrorMessage"));
    }
  };

  const handleAddDocuments = async () => {
    if (!id) {
      Alert.alert(
        t("project.projectUnavailableTitle"),
        t("project.projectUnavailableMessage"),
      );
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

      const updatedProject = await projectService.uploadDocuments(id, formData);

      if (updatedProject) {
        setProject(updatedProject);
      }

      setModal("Documents");
      showSuccess({
        title: t("project.documentsAddedTitle"),
        message: t("project.documentsAddedMessage", {
          count: pickedAssets.length,
        }),
      });
    } catch (uploadError) {
      console.error("Failed to upload project documents:", uploadError);
      Alert.alert(
        t("project.uploadErrorTitle"),
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          t("project.uploadErrorMessage"),
      );
    } finally {
      setUploadingDocuments(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0785F4" />
        <Text style={styles.statusText}>{t("project.loading")}</Text>
      </View>
    );
  }

  const activeTabStyle = { borderColor: theme.colors.primary };
  const activeTabTextStyle = { color: theme.colors.primary };
  const themedAccentTextStyle = { color: theme.colors.primary };

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
        <Text style={styles.projectName}>
          {project?.name || t("project.fallbackName")}
        </Text>
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
            {t("project.tabs.tasks")}
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
            {t("project.tabs.documents")}
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
            {t("project.tabs.workers")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {t("project.loadErrorTitle")}
            </Text>
            <Text style={styles.emptyStateText}>{error}</Text>
          </View>
        ) : null}

        {modal === "Tasks" &&
          (tasks.length > 0 ? (
            tasks.map((task) => {
              const status = getTaskDisplayStatus(task);

              return (
                <ListCard
                  key={task._id || task.id || task.taskTitle}
                  onPress={() =>
                    navigation.navigate("Task", {
                      task,
                      project,
                      projectRouteKey: route.key,
                    })
                  }
                  title={task.taskTitle || t("task.untitled")}
                  badgeLabel={t(`task.status.${status.tone}`, status.label)}
                  badgeStyle={taskBadgeStyles[status.tone]}
                >
                  <Text
                    style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
                  >
                    {formatDate(task.dueDate, true, t)}
                  </Text>
                  <Text
                    style={cardStyles.cardSecondaryText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {task.taskDescription ||
                      task.assigneeUserName ||
                      t("task.noDescription")}
                  </Text>
                </ListCard>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {t("project.noTasksTitle")}
              </Text>
              <Text style={styles.emptyStateText}>
                {t("project.noTasksText")}
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
                      {`${formatFileSize(document.size, t)}   ${formatDate(document.uploadedAt, false, t)}`}
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
              <Text style={styles.emptyStateTitle}>
                {t("project.noFilesTitle")}
              </Text>
              <Text style={styles.emptyStateText}>
                {t("project.noFilesText")}
              </Text>
            </View>
          ))}

        {modal === "Workers" &&
          (workers.length > 0 ? (
            workers.map((worker) => {
              const showAccountStatus = shouldShowAccountStatus(
                worker.accountStatus,
              );
              const atWork = isWorkerAtWork(worker, id);
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
                  key={worker._id || worker.id}
                  title={worker.name || t("project.unnamedWorker")}
                  badgeLabel={badgeLabel}
                  badgeStyle={badgeStyle}
                  onPress={() =>
                    navigation.navigate("Employee", {
                      employeeId: worker._id || worker.id,
                    })
                  }
                >
                  <Text
                    style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {worker.profession ||
                      worker.email ||
                      t("project.workerRole")}
                  </Text>
                </ListCard>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {t("project.noWorkersTitle")}
              </Text>
              <Text style={styles.emptyStateText}>
                {t("project.noWorkersText")}
              </Text>
            </View>
          ))}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={
          (modal === "Tasks" && canCreateProjectTasks) ||
          (modal === "Documents" && canUploadDocuments) ||
          (modal === "Workers" && canEditWorkers)
        }
        onAddPress={() => {
          if (modal === "Documents") {
            handleAddDocuments();
            return;
          }

          if (modal === "Workers") {
            navigation.navigate("SelectWorkers", {
              projectId: id,
            });
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
    gap: 12,
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
    padding: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    // Same admin card look as the Employees / Chat lists.
    borderColor: "#E6EAF1",
    shadowColor: "#0B2545",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
});
