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
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { PersonListItem } from "../../../components/common/PersonListItem/PersonListItem";
import { getWorkerStatusBadge } from "../../../utils/workerStatusBadge";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import {
  projectService,
  shiftService,
  expenseService,
  projectFinanceService,
  toolService,
} from "../../../services";
import { formatMoney } from "../../../utils/billingTotals";
import { isPdfDocument } from "../../../utils/documentPreview";
import { formatShiftDayLabel, resolveUploadUrl } from "../../../utils/shifts";
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

const PHOTO_GAP = 10;
const PHOTO_COLS = 3;
const PHOTO_THUMB = Math.floor(
  (Dimensions.get("window").width - 12 * 2 - PHOTO_GAP * (PHOTO_COLS - 1)) /
    PHOTO_COLS,
);

// Group project photo items ({ url, date, isReceipt }) by day, newest first.
const groupPhotoItemsByDate = (items) => {
  const byDate = new Map();
  for (const item of items) {
    if (!item.url) {
      continue;
    }
    const date = item.date || "";
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date).push(item);
  }
  return [...byDate.entries()]
    .map(([date, photos]) => ({ date, count: photos.length, photos }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};

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
  const { user, hasPermission } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const { theme } = useTheme();
  const { id, initialTab, refreshKey } = route.params || {};
  const [modal, setModal] = useState(initialTab || "Tasks");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [photoSections, setPhotoSections] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Economy tab (gated by finance.manage, like the admin Finance tab).
  const canSeeFinance = hasPermission ? hasPermission("finance.manage") : false;
  const [economy, setEconomy] = useState(null);
  const [loadingEconomy, setLoadingEconomy] = useState(false);
  const [costRateInput, setCostRateInput] = useState("");
  const [billRateInput, setBillRateInput] = useState("");
  const [savingRates, setSavingRates] = useState(false);

  // Tools tab (tools carry a projectIds[] pointing back at this project).
  const [projectTools, setProjectTools] = useState(null);
  const [loadingTools, setLoadingTools] = useState(false);

  // The project photo gallery = every shift photo + every scanned receipt for
  // the project, so both a plain site photo and a receipt end up "in the
  // project". Receipts additionally live as expenses (project economy).
  const loadProjectPhotos = useCallback(async () => {
    if (!id) {
      return;
    }
    const [shiftsRes, expensesRes] = await Promise.allSettled([
      shiftService.list({ projectId: id }),
      expenseService.list({ projectId: id }),
    ]);

    const days =
      shiftsRes.status === "fulfilled" ? shiftsRes.value?.days || [] : [];
    const shiftPhotos = days.flatMap((day) =>
      (day.shifts || []).flatMap((shift) =>
        (shift.photos || []).map((photo) => ({
          url: photo.url,
          date: day.date,
          isReceipt: false,
        })),
      ),
    );

    const expensesRaw =
      expensesRes.status === "fulfilled" ? expensesRes.value : [];
    const expenses = Array.isArray(expensesRaw)
      ? expensesRaw
      : expensesRaw?.items || [];
    const receiptPhotos = expenses
      .filter((expense) => expense.receiptUrl)
      .map((expense) => ({
        url: expense.receiptUrl,
        date: String(expense.date || expense.createdAt || "").slice(0, 10),
        isReceipt: true,
      }));

    setPhotoSections(groupPhotoItemsByDate([...shiftPhotos, ...receiptPhotos]));
  }, [id]);

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
      // Refresh the tools list on focus (e.g. after attaching tools).
      setProjectTools(null);
    }, [fetchProject]),
  );

  useEffect(() => {
    setModal(initialTab || "Tasks");
    // Reset the lazily-loaded Photos/Economy/Tools tabs when switching projects.
    setPhotoSections(null);
    setEconomy(null);
    setProjectTools(null);
  }, [initialTab, id]);

  // Lazy-load the tools assigned to this project when its tab is first opened.
  const loadProjectTools = useCallback(async () => {
    const all = await toolService.getAll().catch(() => []);
    const mine = (all || []).filter(
      (tool) =>
        Array.isArray(tool.projectIds) &&
        tool.projectIds.map(String).includes(String(id)),
    );
    setProjectTools(mine);
  }, [id]);

  useEffect(() => {
    if (modal !== "Tools" || projectTools !== null || loadingTools) {
      return;
    }
    setLoadingTools(true);
    loadProjectTools().finally(() => setLoadingTools(false));
  }, [modal, projectTools, loadingTools, loadProjectTools]);

  // Lazy-load the project photo gallery when its tab is first opened.
  useEffect(() => {
    if (modal !== "Photos" || photoSections !== null || loadingPhotos) {
      return;
    }
    setLoadingPhotos(true);
    loadProjectPhotos().finally(() => setLoadingPhotos(false));
  }, [modal, photoSections, loadingPhotos, loadProjectPhotos]);

  // Assemble the project economy (mirrors the admin Finance tab) — total hours
  // from the project's shifts feed the same margin/cost math as the web.
  const loadEconomy = useCallback(async () => {
    const shiftsData = await shiftService
      .list({ projectId: id })
      .catch(() => ({ days: [] }));
    const days = shiftsData?.days || [];
    const totalMs = days.reduce(
      (sum, day) =>
        sum +
        (day.shifts || []).reduce(
          (daySum, shift) => daySum + (Number(shift.durationMs) || 0),
          0,
        ),
      0,
    );
    const hoursWorked = totalMs / (1000 * 60 * 60);
    const result = await projectFinanceService.getEconomy(id, {
      project: project || {},
      hoursWorked,
    });
    setEconomy(result);
    setCostRateInput(
      project?.costRatePerHour != null ? String(project.costRatePerHour) : "",
    );
    setBillRateInput(
      project?.billRatePerHour != null ? String(project.billRatePerHour) : "",
    );
  }, [id, project]);

  // Lazy-load the economy when its tab is first opened (finance users only).
  useEffect(() => {
    if (
      modal !== "Economy" ||
      !canSeeFinance ||
      economy !== null ||
      loadingEconomy
    ) {
      return;
    }
    setLoadingEconomy(true);
    loadEconomy().finally(() => setLoadingEconomy(false));
  }, [modal, canSeeFinance, economy, loadingEconomy, loadEconomy]);

  const handleSaveRates = async () => {
    try {
      setSavingRates(true);
      await projectService.update(id, {
        costRatePerHour: Number(costRateInput) || 0,
        billRatePerHour: Number(billRateInput) || 0,
      });
      await fetchProject();
      // Force the economy to recompute against the new rates.
      setEconomy(null);
      showSuccess({ title: t("projectEconomy.ratesSaved") });
    } catch (saveError) {
      console.error("Failed to save project rates:", saveError);
      Alert.alert(t("common.error"), t("projectEconomy.ratesSaveError"));
    } finally {
      setSavingRates(false);
    }
  };

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
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
        <TouchableOpacity
          onPress={() => setModal("Tools")}
          style={[
            styles.tabButton,
            modal === "Tools" && styles.activeTab,
            modal === "Tools" && activeTabStyle,
          ]}
        >
          <Text
            style={[styles.tabText, modal === "Tools" && activeTabTextStyle]}
          >
            {t("project.tabs.tools")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModal("Photos")}
          style={[
            styles.tabButton,
            modal === "Photos" && styles.activeTab,
            modal === "Photos" && activeTabStyle,
          ]}
        >
          <Text
            style={[styles.tabText, modal === "Photos" && activeTabTextStyle]}
          >
            {t("project.tabs.photos")}
          </Text>
        </TouchableOpacity>
        {canSeeFinance ? (
          <TouchableOpacity
            onPress={() => setModal("Economy")}
            style={[
              styles.tabButton,
              modal === "Economy" && styles.activeTab,
              modal === "Economy" && activeTabStyle,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                modal === "Economy" && activeTabTextStyle,
              ]}
            >
              {t("project.tabs.economy")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

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
                    resizeMode="contain"
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
            workers.map((worker) => (
              <PersonListItem
                key={worker._id || worker.id}
                person={worker}
                subtitle={
                  worker.profession ||
                  worker.email ||
                  t("employees.noProfession")
                }
                statusBadge={getWorkerStatusBadge(worker, id, t)}
                onPress={() =>
                  navigation.navigate("Employee", {
                    employeeId: worker._id || worker.id,
                  })
                }
              />
            ))
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

        {modal === "Tools" &&
          (loadingTools || projectTools === null ? (
            <View style={styles.tabLoading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : projectTools.length > 0 ? (
            projectTools.map((tool) => (
              <ListCard
                key={tool._id || tool.id}
                title={tool.name || t("common.noName")}
              >
                <Text
                  style={[cardStyles.cardPrimaryText, themedAccentTextStyle]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tool.location || tool.status || t("project.tabs.tools")}
                </Text>
              </ListCard>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {t("project.noToolsTitle")}
              </Text>
              <Text style={styles.emptyStateText}>
                {t("project.noToolsText")}
              </Text>
            </View>
          ))}

        {modal === "Photos" &&
          (loadingPhotos ? (
            <View style={styles.tabLoading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : photoSections && photoSections.length ? (
            photoSections.map((section) => (
              <View key={section.date} style={styles.photoSection}>
                <View style={styles.photoSectionHeader}>
                  <Text style={styles.photoSectionDate}>
                    {formatShiftDayLabel(section.date)}
                  </Text>
                  <Text style={styles.photoSectionCount}>
                    {t("camera.photoCount", { count: section.count })}
                  </Text>
                </View>
                <View style={styles.photoGrid}>
                  {section.photos.map((photo, index) => (
                    <TouchableOpacity
                      key={`${photo.url}-${index}`}
                      activeOpacity={0.85}
                      onPress={() =>
                        setPreviewPhoto(resolveUploadUrl(photo.url))
                      }
                    >
                      <Image
                        source={{ uri: resolveUploadUrl(photo.url) }}
                        style={styles.photoThumb}
                      />
                      {photo.isReceipt ? (
                        <View style={styles.receiptTag}>
                          <Icon name="file-text" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {t("project.noPhotosTitle")}
              </Text>
              <Text style={styles.emptyStateText}>
                {t("project.noPhotosText")}
              </Text>
            </View>
          ))}

        {modal === "Economy" &&
          canSeeFinance &&
          (loadingEconomy || !economy ? (
            <View style={styles.tabLoading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <View>
              {/* Hourly rates (editable) */}
              <View style={styles.ecoCard}>
                <Text style={styles.ecoCardTitle}>
                  {t("projectEconomy.hourlyRates")}
                </Text>
                <View style={styles.ecoRateRow}>
                  <View style={styles.ecoRateField}>
                    <Text style={styles.ecoRateLabel}>
                      {t("projectEconomy.costRate")}
                    </Text>
                    <TextInput
                      style={styles.ecoRateInput}
                      value={costRateInput}
                      onChangeText={setCostRateInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#A7B3C2"
                    />
                  </View>
                  <View style={styles.ecoRateField}>
                    <Text style={styles.ecoRateLabel}>
                      {t("projectEconomy.billRate")}
                    </Text>
                    <TextInput
                      style={styles.ecoRateInput}
                      value={billRateInput}
                      onChangeText={setBillRateInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#A7B3C2"
                    />
                  </View>
                </View>
                <View style={styles.ecoRateFoot}>
                  <Text style={styles.ecoMutedText}>
                    {t("projectEconomy.marginPerHour")}:{" "}
                    <Text style={styles.ecoStrong}>
                      {formatMoney(
                        (Number(billRateInput) || 0) -
                          (Number(costRateInput) || 0),
                      )}
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.ecoSaveButton,
                      savingRates && styles.ecoSaveButtonDisabled,
                    ]}
                    onPress={handleSaveRates}
                    disabled={savingRates}
                  >
                    {savingRates ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.ecoSaveText}>{t("common.save")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Labour */}
              <View style={styles.ecoCard}>
                <Text style={styles.ecoCardTitle}>
                  {t("projectEconomy.labour")}
                </Text>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.hoursWorked")}
                  </Text>
                  <Text style={styles.ecoRowValue}>
                    {economy.hoursWorked} h
                  </Text>
                </View>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.labourCost")}
                  </Text>
                  <Text style={[styles.ecoRowValue, styles.ecoCostTone]}>
                    {formatMoney(economy.laborCost)}
                  </Text>
                </View>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.labourBilled")}
                  </Text>
                  <Text style={[styles.ecoRowValue, styles.ecoBillTone]}>
                    {formatMoney(economy.laborBilled)}
                  </Text>
                </View>
              </View>

              {/* Cost breakdown */}
              <View style={styles.ecoCard}>
                <Text style={styles.ecoCardTitle}>
                  {t("projectEconomy.costs")}
                </Text>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.materials")}
                  </Text>
                  <Text style={styles.ecoRowValue}>
                    {formatMoney(economy.materials)}
                  </Text>
                </View>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.supplierInvoices")}
                  </Text>
                  <Text style={styles.ecoRowValue}>
                    {formatMoney(economy.supplier)}
                  </Text>
                </View>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.expenses")}
                  </Text>
                  <Text style={styles.ecoRowValue}>
                    {formatMoney(economy.expenses)}
                  </Text>
                </View>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.labour")}
                  </Text>
                  <Text style={styles.ecoRowValue}>
                    {formatMoney(economy.laborCost)}
                  </Text>
                </View>
                <View style={[styles.ecoRow, styles.ecoRowTotal]}>
                  <Text style={styles.ecoRowLabelStrong}>
                    {t("projectEconomy.totalCost")}
                  </Text>
                  <Text style={styles.ecoRowValueStrong}>
                    {formatMoney(economy.totalCost)}
                  </Text>
                </View>
              </View>

              {/* Result */}
              <View style={styles.ecoCard}>
                <Text style={styles.ecoCardTitle}>
                  {t("projectEconomy.result")}
                </Text>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.invoiced")}
                  </Text>
                  <Text style={styles.ecoRowValue}>
                    {formatMoney(economy.invoiced)}
                  </Text>
                </View>
                <View style={styles.ecoRow}>
                  <Text style={styles.ecoRowLabel}>
                    {t("projectEconomy.totalCost")}
                  </Text>
                  <Text style={styles.ecoRowValue}>
                    {formatMoney(economy.totalCost)}
                  </Text>
                </View>
                <View style={[styles.ecoRow, styles.ecoRowTotal]}>
                  <Text style={styles.ecoRowLabelStrong}>
                    {t("projectEconomy.margin")} ({economy.marginPct}%)
                  </Text>
                  <Text
                    style={[
                      styles.ecoRowValueStrong,
                      economy.margin >= 0
                        ? styles.ecoBillTone
                        : styles.ecoOverTone,
                    ]}
                  >
                    {formatMoney(economy.margin)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={
          (modal === "Tasks" && canCreateProjectTasks) ||
          (modal === "Documents" && canUploadDocuments) ||
          (modal === "Workers" && canEditWorkers) ||
          (modal === "Tools" && canEditWorkers)
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

          if (modal === "Tools") {
            navigation.navigate("SelectTools", {
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
            <Icon name="plus" size={33} color="#FFFFFF" />
          )
        }
      />

      <Modal
        visible={!!previewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewPhoto(null)}
        >
          {previewPhoto ? (
            <Image
              source={{ uri: previewPhoto }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
        </TouchableOpacity>
      </Modal>
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
  tabScroll: {
    width: "100%",
    flexGrow: 0,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 12,
  },
  tabButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
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
    textAlign: "center",
  },
  tabLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },

  // Economy tab
  ecoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  ecoCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#687898",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  ecoRateRow: {
    flexDirection: "row",
    gap: 12,
  },
  ecoRateField: {
    flex: 1,
  },
  ecoRateLabel: {
    fontSize: 12,
    color: "#687898",
    marginBottom: 6,
  },
  ecoRateInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e7ecf0",
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#052d50",
    backgroundColor: "#FFFFFF",
  },
  ecoRateFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  ecoSaveButton: {
    backgroundColor: "#3183ff",
    borderRadius: 20,
    paddingHorizontal: 22,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 88,
  },
  ecoSaveButtonDisabled: {
    opacity: 0.7,
  },
  ecoSaveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  ecoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  ecoRowTotal: {
    borderTopWidth: 1,
    borderTopColor: "#e9e9e9",
    marginTop: 4,
    paddingTop: 11,
  },
  ecoRowLabel: {
    fontSize: 14,
    color: "#5b6b80",
    flex: 1,
  },
  ecoRowLabelStrong: {
    fontSize: 14,
    color: "#052d50",
    fontWeight: "700",
    flex: 1,
  },
  ecoRowValue: {
    fontSize: 14,
    color: "#052d50",
    fontWeight: "500",
  },
  ecoRowValueStrong: {
    fontSize: 15,
    color: "#052d50",
    fontWeight: "700",
  },
  ecoCostTone: {
    color: "#c0392b",
  },
  ecoBillTone: {
    color: "#1e8e4e",
  },
  ecoOverTone: {
    color: "#c0392b",
  },
  ecoMutedText: {
    fontSize: 13,
    color: "#687898",
    flex: 1,
  },
  ecoStrong: {
    color: "#052d50",
    fontWeight: "700",
  },

  // Photos grid
  photoSection: {
    gap: 12,
    marginBottom: 12,
  },
  photoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photoSectionDate: {
    color: "#052D50",
    fontSize: 16,
    fontWeight: "500",
  },
  photoSectionCount: {
    color: "#698196",
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
  },
  photoThumb: {
    width: PHOTO_THUMB,
    height: PHOTO_THUMB,
    borderRadius: 14,
    backgroundColor: "#E5E9ED",
  },
  receiptTag: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },

  // Full-screen photo preview
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
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
