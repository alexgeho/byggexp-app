import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../components/common/ListCard/ListCard";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { chatService, userService } from "../../services";
import { cardStyles } from "../../styles/cards";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";
import { getToolStatusMeta } from "../../constants/toolStatus";
import { getRoleLabel } from "../../utils/userRoles";
import {
  formatProjectStatus,
  getProjectStatusBadgeStyle,
} from "../../utils/projectStatus";
import { resolveUploadUrl } from "../../utils/shifts";

const formatPhone = (areaCode, phoneNumber) => {
  if (!areaCode || !phoneNumber) {
    return "No phone";
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

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getWorkStatusLabel = (workPresence) => {
  if (!workPresence?.status) {
    return "Off duty";
  }

  if (workPresence.status === "working") {
    return workPresence.projectName
      ? `At work on ${workPresence.projectName}`
      : "At work";
  }

  if (workPresence.status === "outside_project_area") {
    return "Outside project area";
  }

  return "Off duty";
};

const TOOL_STATUS_BADGE_STYLES = {
  available: cardStyles.cardBadgeAvailable,
  broken: cardStyles.cardBadgeBroken,
  in_repair: cardStyles.cardBadgeInRepair,
  occupied: cardStyles.cardBadgeOccupied,
};

function ActionButton({ icon, label, onPress, tone = "primary", disabled = false }) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        tone === "danger" ? styles.actionButtonDanger : styles.actionButtonPrimary,
        disabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Icon name={icon} size={16} color={tone === "danger" ? "#C62828" : "#052D50"} />
      <Text
        style={[
          styles.actionButtonText,
          tone === "danger" ? styles.actionButtonTextDanger : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value, isLast = false }) {
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
  const { theme } = useTheme();
  const { userId } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const employeeId = route.params?.employeeId || route.params?.workerId || userId;

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
  const canMessage = Boolean(employeeId && userId && String(employeeId) !== String(userId));
  const employeeName = employee?.name || employee?.email || "Employee";

  const avatarSource = useMemo(() => {
    if (employee?.avatarUrl) {
      return { uri: resolveUploadUrl(employee.avatarUrl) };
    }

    return require("../../assets/TasksAva.png");
  }, [employee?.avatarUrl]);

  const loadProfile = useCallback(async () => {
    if (!employeeId) {
      setError("Employee id is missing.");
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
        "Unable to load employee profile.";
      setError(Array.isArray(message) ? message.join(", ") : message);
      setEmployee(null);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

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
        "Unable to open chat",
        chatError?.response?.data?.message ||
          chatError?.message ||
          "Please try again later.",
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
      "Delete employee",
      `Delete ${employeeName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleteLoading(true);
              await userService.delete(employeeId);
              showSuccess({
                title: "Employee deleted",
                message: `${employeeName} deleted successfully.`,
              });
              navigation.goBack();
            } catch (deleteError) {
              console.error("Failed to delete employee:", deleteError);
              Alert.alert(
                "Unable to delete employee",
                deleteError?.response?.data?.message ||
                  deleteError?.message ||
                  "Please try again later.",
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
        "Unable to save comment",
        noteError?.response?.data?.message ||
          noteError?.message ||
          "Please try again later.",
      );
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = (noteId) => {
    if (!employeeId || !noteId) {
      return;
    }

    Alert.alert("Delete comment", "Remove this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await userService.deleteNote(employeeId, noteId);
            setNotes((previous) => previous.filter((item) => item.id !== noteId));
          } catch (noteError) {
            console.error("Failed to delete worker note:", noteError);
            Alert.alert(
              "Unable to delete comment",
              noteError?.response?.data?.message ||
                noteError?.message ||
                "Please try again later.",
            );
          }
        },
      },
    ]);
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
              Worker
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
              Worker
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Unable to load worker</Text>
            <Text style={styles.emptySubtitle}>{error || "Please try again later."}</Text>
            <ActionButton icon="refresh-cw" label="Retry" onPress={loadProfile} />
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
              {employee.profession || getRoleLabel(employee.role)}
            </Text>
            <Text style={styles.heroMeta}>{getWorkStatusLabel(employee.workPresence)}</Text>
          </View>

          <View style={styles.actionRow}>
            {canMessage ? (
              <ActionButton
                icon="message-circle"
                label={chatLoading ? "Opening..." : "Message"}
                onPress={handleMessage}
                disabled={chatLoading}
              />
            ) : null}
            {canEdit ? (
              <ActionButton
                icon="edit-2"
                label="Edit"
                onPress={() =>
                  navigation.navigate("CreateEmployee", {
                    employeeId,
                  })
                }
              />
            ) : null}
            {canDelete ? (
              <ActionButton
                icon="trash-2"
                label={deleteLoading ? "Deleting..." : "Delete"}
                onPress={handleDelete}
                disabled={deleteLoading}
                tone="danger"
              />
            ) : null}
          </View>

          <View style={styles.groupCard}>
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Role" value={getRoleLabel(employee.role)} />
            <InfoRow label="Profession" value={employee.profession || "No profession"} />
            <InfoRow
              label="Phone"
              value={formatPhone(employee.phoneAreaCode, employee.phoneNumber)}
            />
            <InfoRow label="Company" value={employee.company?.name || "No company"} isLast />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projects</Text>
            <Text style={styles.sectionCount}>{employee.projects?.length || 0}</Text>
          </View>
          {Array.isArray(employee.projects) && employee.projects.length > 0 ? (
            employee.projects.map((project) => (
              <ListCard
                key={project.id}
                title={project.name || "Unnamed project"}
                badgeLabel={formatProjectStatus(project.status) || "Unknown"}
                badgeStyle={getProjectStatusBadgeStyle(project.status)}
                onPress={() =>
                  navigation.navigate("Project", {
                    id: project.id,
                  })
                }
              >
                <Text style={cardStyles.cardPrimaryText}>
                  {project.location || "No location"}
                </Text>
                <Text style={cardStyles.cardSecondaryText}>
                  {project.roles?.length ? project.roles.join(", ") : "No role"}
                </Text>
              </ListCard>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No projects assigned.</Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instruments</Text>
            <Text style={styles.sectionCount}>{employee.tools?.length || 0}</Text>
          </View>
          {Array.isArray(employee.tools) && employee.tools.length > 0 ? (
            employee.tools.map((tool) => {
              const photoUrl = tool.photoUrl ? resolveUploadUrl(tool.photoUrl) : null;
              const statusMeta = getToolStatusMeta(tool.status);

              return (
                <ListCard
                  key={tool.id}
                  title={tool.name || "Unnamed instrument"}
                  badgeLabel={statusMeta.label}
                  badgeStyle={
                    TOOL_STATUS_BADGE_STYLES[statusMeta.tone] ||
                    cardStyles.cardBadgeNeutral
                  }
                  leading={
                    photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.toolPhoto} />
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
                    {tool.notes || "No notes"}
                  </Text>
                </ListCard>
              );
            })
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No instruments assigned.</Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <Text style={styles.sectionCount}>{notes.length}</Text>
          </View>
          {canComment ? (
            <View style={styles.noteComposer}>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Write a comment about this worker"
                placeholderTextColor="rgba(5, 45, 80, 0.35)"
                multiline
                style={styles.noteInput}
              />
              <TouchableOpacity
                style={[
                  styles.noteSendButton,
                  (!newNote.trim() || savingNote) && styles.actionButtonDisabled,
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
                    <Text style={styles.noteAuthor}>{note.authorName || "User"}</Text>
                    <Text style={styles.noteSubtitle}>
                      {getRoleLabel(note.authorRole)}
                      {formatDate(note.createdAt) ? `  ${formatDate(note.createdAt)}` : ""}
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
              <Text style={styles.emptySectionText}>No comments yet.</Text>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  pageContainer: {
    ...standardScreenContainer,
    paddingBottom: 0,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#052D50",
    fontSize: 17,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentContent: {
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 999,
  },
  heroTitle: {
    color: "#052D50",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  heroSubtitle: {
    color: "#698196",
    fontSize: 15,
    textAlign: "center",
  },
  heroMeta: {
    color: "#052D50",
    fontSize: 14,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  actionButtonPrimary: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderColor: "#FFFFFF",
  },
  actionButtonDanger: {
    backgroundColor: "rgba(198, 40, 40, 0.08)",
    borderColor: "rgba(198, 40, 40, 0.2)",
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonText: {
    color: "#052D50",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonTextDanger: {
    color: "#C62828",
  },
  groupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  groupRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  infoLabel: {
    fontSize: 12,
    color: "rgba(5, 45, 80, 0.55)",
  },
  infoValue: {
    fontSize: 16,
    color: "#052D50",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: "#052D50",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionCount: {
    color: "#698196",
    fontSize: 13,
  },
  emptySection: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 16,
  },
  emptySectionText: {
    color: "#698196",
    textAlign: "center",
  },
  noteComposer: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  noteInput: {
    minHeight: 96,
    color: "#052D50",
    fontSize: 15,
    textAlignVertical: "top",
  },
  noteSendButton: {
    alignSelf: "flex-end",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0091FF",
  },
  noteCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  noteMeta: {
    flex: 1,
    gap: 2,
  },
  noteAuthor: {
    color: "#052D50",
    fontSize: 15,
    fontWeight: "700",
  },
  noteSubtitle: {
    color: "#698196",
    fontSize: 12,
  },
  noteText: {
    color: "#052D50",
    fontSize: 15,
    lineHeight: 21,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    color: "#052D50",
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#698196",
    fontSize: 14,
    textAlign: "center",
  },
  toolPhoto: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  toolPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF3F8",
  },
});
