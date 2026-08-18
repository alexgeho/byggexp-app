import React, { useCallback, useContext, useMemo, useState } from "react";
import { getDateLocale } from "../../utils/dateLocale";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../components/common/ListCard/ListCard";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { chatService, userService } from "../../services";
import { cardStyles } from "../../styles/cards";
import { standardScreenHeaderPlaceholder } from "../../styles/screenLayout";
import { createStyles } from "./EmployeeProfileScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import { getToolStatusMeta } from "../../constants/toolStatus";
import { getRoleLabel } from "../../utils/userRoles";
import {
  formatProjectStatus,
  getProjectStatusBadgeStyle,
} from "../../utils/projectStatus";
import { resolveUploadUrl } from "../../utils/shifts";

const formatPhone = (areaCode, phoneNumber, t) => {
  if (!areaCode || !phoneNumber) {
    return t("employeeProfile.noPhone");
  }

  return `+${areaCode} ${phoneNumber}`;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(getDateLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getWorkStatusLabel = (workPresence, t) => {
  if (!workPresence?.status) {
    return t("employeeProfile.offDuty");
  }

  if (workPresence.status === "working") {
    return workPresence.projectName
      ? t("employeeProfile.atWorkOn", { project: workPresence.projectName })
      : t("employeeProfile.atWork");
  }

  if (workPresence.status === "outside_project_area") {
    return t("employeeProfile.outsideArea");
  }

  return t("employeeProfile.offDuty");
};

const TOOL_STATUS_BADGE_STYLES = {
  available: cardStyles.cardBadgeAvailable,
  broken: cardStyles.cardBadgeBroken,
  in_repair: cardStyles.cardBadgeInRepair,
  occupied: cardStyles.cardBadgeOccupied,
};

function ActionButton({
  icon,
  label,
  onPress,
  tone = "primary",
  disabled = false,
  theme,
  styles,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        tone === "danger"
          ? styles.actionButtonDanger
          : styles.actionButtonPrimary,
        disabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Icon
        name={icon}
        size={15}
        color={tone === "danger" ? "#C62828" : theme.content.textPrimary}
      />
      <Text
        style={[
          styles.actionButtonText,
          tone === "danger" ? styles.actionButtonTextDanger : null,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value, isLast = false, styles }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.groupRowDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

export default function EmployeeProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { userId } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const employeeId =
    route.params?.employeeId || route.params?.workerId || userId;

  const [employee, setEmployee] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canEdit = Boolean(employee?.permissions?.canEdit);
  const canDelete = Boolean(employee?.permissions?.canDelete);
  const canComment = Boolean(employee?.permissions?.canComment);
  const canMessage = Boolean(
    employeeId && userId && String(employeeId) !== String(userId),
  );
  const employeeName = employee?.name || employee?.email || t("roles.user");

  const avatarSource = useMemo(() => {
    if (employee?.avatarUrl) {
      return { uri: resolveUploadUrl(employee.avatarUrl) };
    }

    return require("../../assets/TasksAva.png");
  }, [employee?.avatarUrl]);

  const loadProfile = useCallback(async () => {
    if (!employeeId) {
      setError(t("employeeProfile.idMissing"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [detail, workerNotes] = await Promise.all([
        userService.getDetail(employeeId),
        userService.getNotes(employeeId),
      ]);
      setEmployee(detail || null);
      setNotes(Array.isArray(workerNotes) ? workerNotes : []);
    } catch (loadError) {
      console.error("Failed to load employee profile:", loadError);
      const message =
        loadError?.response?.data?.message ||
        loadError?.message ||
        t("employeeProfile.loadError");
      setError(Array.isArray(message) ? message.join(", ") : message);
      setEmployee(null);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, t]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleMessage = async () => {
    if (!employeeId) {
      return;
    }

    try {
      setChatLoading(true);
      const chat = await chatService.getOrCreateDirect(employeeId);
      navigation.navigate("SingleChat", {
        chatId: chat._id,
        initialChat: chat,
      });
    } catch (chatError) {
      console.error("Failed to open direct chat:", chatError);
      Alert.alert(
        t("employeeProfile.chatErrorTitle"),
        chatError?.response?.data?.message ||
          chatError?.message ||
          t("project.openErrorMessage"),
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleDelete = () => {
    if (!employeeId || deleteLoading) {
      return;
    }

    Alert.alert(
      t("employeeProfile.deleteTitle"),
      t("employeeProfile.deleteConfirm", { name: employeeName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("employeeProfile.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setDeleteLoading(true);
              await userService.delete(employeeId);
              showSuccess({
                title: t("employeeProfile.deleted"),
                message: t("employeeProfile.deletedMessage", {
                  name: employeeName,
                }),
              });
              navigation.goBack();
            } catch (deleteError) {
              console.error("Failed to delete employee:", deleteError);
              Alert.alert(
                t("employeeProfile.deleteErrorTitle"),
                deleteError?.response?.data?.message ||
                  deleteError?.message ||
                  t("project.openErrorMessage"),
              );
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleSaveNote = async () => {
    const text = newNote.trim();
    if (!text || !employeeId) {
      return;
    }

    try {
      setSavingNote(true);
      const note = await userService.createNote(employeeId, text);
      setNotes((previous) => [note, ...previous]);
      setNewNote("");
    } catch (noteError) {
      console.error("Failed to save worker note:", noteError);
      Alert.alert(
        t("employeeProfile.saveCommentError"),
        noteError?.response?.data?.message ||
          noteError?.message ||
          t("project.openErrorMessage"),
      );
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = (noteId) => {
    if (!employeeId || !noteId) {
      return;
    }

    Alert.alert(
      t("employeeProfile.deleteCommentTitle"),
      t("employeeProfile.deleteCommentConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("employeeProfile.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await userService.deleteNote(employeeId, noteId);
              setNotes((previous) =>
                previous.filter((item) => item.id !== noteId),
              );
            } catch (noteError) {
              console.error("Failed to delete worker note:", noteError);
              Alert.alert(
                t("employeeProfile.deleteCommentError"),
                noteError?.response?.data?.message ||
                  noteError?.message ||
                  t("project.openErrorMessage"),
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.pageContainer}>
          <View style={styles.header}>
            <BackButton
              onPress={() => navigation.goBack()}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.headerTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("roles.worker")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !employee) {
    return (
      <View style={styles.screen}>
        <View style={styles.pageContainer}>
          <View style={styles.header}>
            <BackButton
              onPress={() => navigation.goBack()}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.headerTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("roles.worker")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {t("employeeProfile.loadWorkerErrorTitle")}
            </Text>
            <Text style={styles.emptySubtitle}>
              {error || t("project.openErrorMessage")}
            </Text>
            <ActionButton
              styles={styles}
              theme={theme}
              icon="refresh-cw"
              label={t("employeeProfile.retry")}
              onPress={loadProfile}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../assets/Arrow-left.png")}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {employeeName}
          </Text>
          <View style={standardScreenHeaderPlaceholder} />
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Image source={avatarSource} style={styles.avatar} />
            <Text style={styles.heroTitle}>{employeeName}</Text>
            <Text style={styles.heroSubtitle}>
              {employee.profession ||
                t(`roles.${employee.role}`, getRoleLabel(employee.role))}
            </Text>
            <Text style={styles.heroMeta}>
              {getWorkStatusLabel(employee.workPresence, t)}
            </Text>
          </View>

          <View style={styles.actionRow}>
            {canMessage ? (
              <ActionButton
                styles={styles}
                theme={theme}
                icon="message-circle"
                label={
                  chatLoading
                    ? t("employeeProfile.opening")
                    : t("employeeProfile.message")
                }
                onPress={handleMessage}
                disabled={chatLoading}
              />
            ) : null}
            {canEdit ? (
              <ActionButton
                styles={styles}
                theme={theme}
                icon="edit-2"
                label={t("employeeProfile.edit")}
                onPress={() =>
                  navigation.navigate("CreateEmployee", {
                    employeeId,
                  })
                }
              />
            ) : null}
            {canDelete ? (
              <ActionButton
                styles={styles}
                theme={theme}
                icon="trash-2"
                label={
                  deleteLoading
                    ? t("employeeProfile.deleting")
                    : t("employeeProfile.delete")
                }
                onPress={handleDelete}
                disabled={deleteLoading}
                tone="danger"
              />
            ) : null}
          </View>

          <View style={styles.groupCard}>
            <InfoRow
              styles={styles}
              label={t("myAccount.emailLabel")}
              value={employee.email}
            />
            <InfoRow
              styles={styles}
              label={t("myAccount.roleLabel")}
              value={t(`roles.${employee.role}`, getRoleLabel(employee.role))}
            />
            <InfoRow
              styles={styles}
              label={t("myAccount.professionLabel")}
              value={employee.profession || t("employees.noProfession")}
            />
            <InfoRow
              styles={styles}
              label={t("myAccount.phone")}
              value={formatPhone(
                employee.phoneAreaCode,
                employee.phoneNumber,
                t,
              )}
            />
            <InfoRow
              styles={styles}
              label={t("employeeProfile.company")}
              value={employee.company?.name || t("employeeProfile.noCompany")}
              isLast
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("menu.projects")}</Text>
            <Text style={styles.sectionCount}>
              {employee.projects?.length || 0}
            </Text>
          </View>
          {Array.isArray(employee.projects) && employee.projects.length > 0 ? (
            employee.projects.map((project) => (
              <ListCard
                key={project.id}
                title={project.name || t("createTask.untitledProject")}
                badgeLabel={t(
                  `projects.status.${project.status}`,
                  formatProjectStatus(project.status) ||
                    t("employeeProfile.unknownStatus"),
                )}
                badgeStyle={getProjectStatusBadgeStyle(project.status)}
                onPress={() =>
                  navigation.navigate("Project", {
                    id: project.id,
                  })
                }
              >
                <Text style={cardStyles.cardPrimaryText}>
                  {project.location || t("shiftHistory.noLocation")}
                </Text>
                <Text style={cardStyles.cardSecondaryText}>
                  {project.roles?.length
                    ? project.roles.join(", ")
                    : t("employeeProfile.noRole")}
                </Text>
              </ListCard>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                {t("employeeProfile.noProjects")}
              </Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("menu.instruments")}</Text>
            <Text style={styles.sectionCount}>
              {employee.tools?.length || 0}
            </Text>
          </View>
          {Array.isArray(employee.tools) && employee.tools.length > 0 ? (
            employee.tools.map((tool) => {
              const photoUrl = tool.photoUrl
                ? resolveUploadUrl(tool.photoUrl)
                : null;
              const statusMeta = getToolStatusMeta(tool.status);

              return (
                <ListCard
                  key={tool.id}
                  title={tool.name || t("createProject.unnamedInstrument")}
                  badgeLabel={t(
                    `tools.status.${statusMeta.value}`,
                    statusMeta.label,
                  )}
                  badgeStyle={
                    TOOL_STATUS_BADGE_STYLES[statusMeta.tone] ||
                    cardStyles.cardBadgeNeutral
                  }
                  leading={
                    photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.toolPhoto}
                      />
                    ) : (
                      <View style={styles.toolPhotoPlaceholder}>
                        <Icon
                          name="tool"
                          size={14}
                          color="rgba(5, 45, 80, 0.35)"
                        />
                      </View>
                    )
                  }
                >
                  <Text style={cardStyles.cardPrimaryText}>
                    {tool.notes || t("tools.noNotes")}
                  </Text>
                </ListCard>
              );
            })
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                {t("employeeProfile.noInstruments")}
              </Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("employeeProfile.comments")}
            </Text>
            <Text style={styles.sectionCount}>{notes.length}</Text>
          </View>
          {canComment ? (
            <View style={styles.noteComposer}>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder={t("employeeProfile.commentPlaceholder")}
                placeholderTextColor="rgba(5, 45, 80, 0.35)"
                multiline
                style={styles.noteInput}
              />
              <TouchableOpacity
                style={[
                  styles.noteSendButton,
                  (!newNote.trim() || savingNote) &&
                    styles.actionButtonDisabled,
                ]}
                onPress={handleSaveNote}
                disabled={!newNote.trim() || savingNote}
                activeOpacity={0.85}
              >
                {savingNote ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {notes.length > 0 ? (
            notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteMeta}>
                    <Text style={styles.noteAuthor}>
                      {note.authorName || t("roles.user")}
                    </Text>
                    <Text style={styles.noteSubtitle}>
                      {t(
                        `roles.${note.authorRole}`,
                        getRoleLabel(note.authorRole),
                      )}
                      {formatDate(note.createdAt)
                        ? `  ${formatDate(note.createdAt)}`
                        : ""}
                    </Text>
                  </View>
                  {canComment ? (
                    <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                      <Icon name="trash-2" size={16} color="#C62828" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <Text style={styles.noteText}>{note.text}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                {t("employeeProfile.noComments")}
              </Text>
            </View>
          )}
        </ScrollView>

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={false}
        />
      </View>
    </View>
  );
}
