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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { createStyles } from "./ProjectScreen.styles";
import {
  ProjectPhotosTab,
  ProjectTabBar,
  ProjectWorkersTab,
} from "./ProjectScreen.parts";
import { useTranslation } from "react-i18next";
import { Screen } from "../../../components/common/Screen/Screen";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { ImagePreviewModal } from "../../../components/common/ImagePreviewModal/ImagePreviewModal";
import {
  Card,
  SectionTitle,
  FieldInput,
  KeyValueRow,
  Button,
} from "../../../components/common/ui";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import {
  projectService,
  shiftService,
  expenseService,
  projectFinanceService,
  toolService,
} from "../../../services";
import { formatMoney } from "../../../utils/billingTotals";
import {
  getDocumentName,
  getDocumentTypeMeta,
  isImageDocument,
  isPdfDocument,
} from "../../../utils/documentPreview";
import { sortByNewest } from "../../../utils/sortByNewest";
import { normalizeRefId } from "../../../utils/entityId";
import { getTaskDisplayStatus } from "../../../utils/taskStatus";
import { cardStyles } from "../../../styles/cards";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import {
  canCreateTasks,
  canManageDocuments,
  canManageWorkers,
  shouldShowAccountStatus,
} from "../../../utils/userRoles";
import { resolveUploadUrl } from "../../../utils/shifts";

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

const taskBadgeStyles = {
  open: cardStyles.cardBadgeOpen,
  overdue: cardStyles.cardBadgeOverdue,
  completed: cardStyles.cardBadgeCompleted,
};

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

export const ProjectScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, hasPermission } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
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
              url: resolveUploadUrl(
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

  const themedAccentTextStyle = { color: theme.colors.primary };

  return (
    <Screen
      title={project?.name || t("project.fallbackName")}
      onBack={() => navigation.goBack()}
      style={styles.screenExtra}
    >
      <ProjectTabBar
        active={modal}
        onSelect={setModal}
        canSeeFinance={canSeeFinance}
        styles={styles}
        activeColor={theme.colors.primary}
        t={t}
      />

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

        {modal === "Workers" ? (
          <ProjectWorkersTab
            workers={workers}
            projectId={id}
            onOpenWorker={(employeeId) =>
              navigation.navigate("Employee", { employeeId })
            }
            styles={styles}
            t={t}
          />
        ) : null}

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

        {modal === "Photos" ? (
          <ProjectPhotosTab
            loading={loadingPhotos}
            photoSections={photoSections}
            onPreview={setPreviewPhoto}
            styles={styles}
            primaryColor={theme.colors.primary}
            t={t}
          />
        ) : null}

        {modal === "Economy" &&
          canSeeFinance &&
          (loadingEconomy || !economy ? (
            <View style={styles.tabLoading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <View>
              {/* Hourly rates (editable) */}
              <Card style={styles.ecoCardPad}>
                <SectionTitle style={styles.ecoSectionTitle}>
                  {t("projectEconomy.hourlyRates")}
                </SectionTitle>
                <View style={styles.ecoRateRow}>
                  <FieldInput
                    half
                    keyboardType="numeric"
                    label={t("projectEconomy.costRate")}
                    value={costRateInput}
                    onChangeText={setCostRateInput}
                    placeholder="0"
                  />
                  <FieldInput
                    half
                    keyboardType="numeric"
                    label={t("projectEconomy.billRate")}
                    value={billRateInput}
                    onChangeText={setBillRateInput}
                    placeholder="0"
                  />
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
                  <Button
                    size="sm"
                    title={t("common.save")}
                    loading={savingRates}
                    onPress={handleSaveRates}
                  />
                </View>
              </Card>

              {/* Labour */}
              <Card style={styles.ecoCardPad}>
                <SectionTitle style={styles.ecoSectionTitle}>
                  {t("projectEconomy.labour")}
                </SectionTitle>
                <KeyValueRow
                  label={t("projectEconomy.hoursWorked")}
                  value={`${economy.hoursWorked} h`}
                />
                <KeyValueRow
                  tone="cost"
                  label={t("projectEconomy.labourCost")}
                  value={formatMoney(economy.laborCost)}
                />
                <KeyValueRow
                  tone="bill"
                  label={t("projectEconomy.labourBilled")}
                  value={formatMoney(economy.laborBilled)}
                />
              </Card>

              {/* Cost breakdown */}
              <Card style={styles.ecoCardPad}>
                <SectionTitle style={styles.ecoSectionTitle}>
                  {t("projectEconomy.costs")}
                </SectionTitle>
                <KeyValueRow
                  label={t("projectEconomy.supplierInvoices")}
                  value={formatMoney(economy.supplier)}
                />
                <KeyValueRow
                  label={t("projectEconomy.expenses")}
                  value={formatMoney(economy.expenses)}
                />
                <KeyValueRow
                  label={t("projectEconomy.labour")}
                  value={formatMoney(economy.laborCost)}
                />
                <KeyValueRow
                  total
                  label={t("projectEconomy.totalCost")}
                  value={formatMoney(economy.totalCost)}
                />
              </Card>

              {/* Result */}
              <Card style={styles.ecoCardPad}>
                <SectionTitle style={styles.ecoSectionTitle}>
                  {t("projectEconomy.result")}
                </SectionTitle>
                <KeyValueRow
                  label={t("projectEconomy.invoiced")}
                  value={formatMoney(economy.invoiced)}
                />
                <KeyValueRow
                  label={t("projectEconomy.totalCost")}
                  value={formatMoney(economy.totalCost)}
                />
                <KeyValueRow
                  total
                  tone={economy.margin >= 0 ? "bill" : "cost"}
                  label={`${t("projectEconomy.margin")} (${economy.marginPct}%)`}
                  value={formatMoney(economy.margin)}
                />
              </Card>
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

      <ImagePreviewModal
        uri={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />
    </Screen>
  );
};
