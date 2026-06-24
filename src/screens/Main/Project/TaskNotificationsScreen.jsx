import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
  standardScreenScrollContent,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import { projectService } from "../../../services";
import {
  createDefaultTaskNotificationSettings,
  getRepeatLabel,
  normalizeTaskNotificationSettings,
} from "../../../utils/taskNotifications";

const getUserInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
};

export default function TaskNotificationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const projectId = route.params?.projectId;
  const dueDate = route.params?.dueDate || null;
  const taskDraft = route.params?.taskDraft;

  const [settings, setSettings] = useState(() =>
    normalizeTaskNotificationSettings(route.params?.notificationSettings),
  );
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");
  const [pendingAssignees, setPendingAssignees] = useState([]);
  const themedCheckboxStyle = {
    borderColor: `${theme.colors.primary}66`,
  };
  const themedCheckboxSelectedStyle = {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  };

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let mounted = true;

    const fetchWorkers = async () => {
      try {
        setLoadingWorkers(true);
        const project = await projectService.getPopulatedById(projectId);
        if (!mounted) {
          return;
        }

        const projectWorkers = Array.isArray(project?.workers)
          ? project.workers
              .filter((user) => user && typeof user === "object")
              .map((user) => ({
                id: user._id,
                name: user.name || "Unnamed worker",
                profession: user.profession || "",
              }))
          : [];

        setWorkers(projectWorkers);
      } catch (error) {
        console.error(
          "Failed to load project workers for task notifications:",
          error,
        );
      } finally {
        if (mounted) {
          setLoadingWorkers(false);
        }
      }
    };

    fetchWorkers();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!route.params?.notificationSettings) {
      return;
    }

    setSettings(
      normalizeTaskNotificationSettings(route.params.notificationSettings),
    );
  }, [route.params?.notificationSettings]);

  useEffect(() => {
    if (route.params?.repeatSelection === undefined) {
      return;
    }

    setSettings((previous) => ({
      ...previous,
      repeat: route.params.repeatSelection || "none",
      ...(route.params?.repeatIntervalMinutes !== undefined
        ? { repeatIntervalMinutes: route.params.repeatIntervalMinutes }
        : {}),
    }));
  }, [route.params?.repeatIntervalMinutes, route.params?.repeatSelection]);

  const filteredWorkers = useMemo(() => {
    const normalizedSearch = workerSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return workers;
    }

    return workers.filter((worker) =>
      [worker.name, worker.profession]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [workerSearch, workers]);

  const assigneesLabel = useMemo(() => {
    if (settings.allMembersNotification && settings.assignees.length === 0) {
      return "All project members";
    }

    if (settings.assignees.length === 0) {
      return "Choose workers";
    }

    if (settings.assignees.length === 1) {
      return settings.assignees[0].name;
    }

    return `${settings.assignees.length} workers selected`;
  }, [settings.allMembersNotification, settings.assignees]);

  const openWorkersModal = () => {
    setPendingAssignees(settings.assignees);
    setWorkerSearch("");
    setShowWorkersModal(true);
  };

  const closeWorkersModal = () => {
    setPendingAssignees([]);
    setWorkerSearch("");
    setShowWorkersModal(false);
  };

  const togglePendingAssignee = (worker) => {
    setPendingAssignees((previous) => {
      if (previous.some((item) => item.id === worker.id)) {
        return previous.filter((item) => item.id !== worker.id);
      }

      return [...previous, worker];
    });
  };

  const saveWorkersSelection = () => {
    setSettings((previous) => ({
      ...previous,
      assignees: pendingAssignees,
    }));
    closeWorkersModal();
  };

  const handleSave = () => {
    const nextSettings = {
      ...createDefaultTaskNotificationSettings(),
      ...settings,
      customMessage: settings.customMessage.trim(),
    };

    navigation.navigate({
      name: "CreateTask",
      params: {
        notificationSettings: nextSettings,
        taskDraft,
      },
      merge: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint="light"
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.groupCard}>
          <TouchableOpacity
            style={styles.groupRow}
            onPress={openWorkersModal}
            activeOpacity={0.85}
          >
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Assign to</Text>
              <Text
                style={[
                  styles.rowValue,
                  settings.assignees.length === 0 &&
                    !settings.allMembersNotification &&
                    styles.rowPlaceholder,
                ]}
              >
                {assigneesLabel}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>

          <View style={styles.groupRow}>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Auto Reminder</Text>
              <Text style={styles.rowHint}>
                Uses the default reminder text for the team.
              </Text>
            </View>
            <Switch
              value={settings.autoReminder}
              onValueChange={(value) =>
                setSettings((previous) => ({
                  ...previous,
                  autoReminder: value,
                }))
              }
              trackColor={{ false: "#D9E3EC", true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D9E3EC"
            />
          </View>

          <View style={styles.groupRow}>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Custom Reminder</Text>
              <Text style={styles.rowHint}>
                Lets you send your own reminder text.
              </Text>
            </View>
            <Switch
              value={settings.customReminder}
              onValueChange={(value) =>
                setSettings((previous) => ({
                  ...previous,
                  customReminder: value,
                }))
              }
              trackColor={{ false: "#D9E3EC", true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D9E3EC"
            />
          </View>

          <TouchableOpacity
            style={[styles.groupRow, styles.groupRowLast]}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("TaskNotificationRepeat", {
                dueDate,
                selectedRepeat: settings.repeat,
                repeatIntervalMinutes: settings.repeatIntervalMinutes,
                notificationSettings: settings,
                taskDraft,
              })
            }
          >
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Repeat</Text>
              <Text style={styles.rowValue}>
                {getRepeatLabel(
                  settings.repeat,
                  settings.repeatIntervalMinutes,
                )}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>
        </View>

        {settings.customReminder ? (
          <View style={styles.groupCard}>
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Reminder text</Text>
              <TextInput
                multiline={true}
                style={styles.messageInput}
                value={settings.customMessage}
                onChangeText={(value) =>
                  setSettings((previous) => ({
                    ...previous,
                    customMessage: value,
                  }))
                }
                placeholder="Write your own reminder for the team."
                placeholderTextColor="rgba(5, 45, 80, 0.45)"
              />
            </View>
          </View>
        ) : null}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <Icon name="check" size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save notifications</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={showWorkersModal}
        onRequestClose={closeWorkersModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <BackButton
              backgroundColor={"rgba(255, 255, 255, 0.6)"}
              tint="light"
              borderColor="#FFFFFF50"
              onPress={closeWorkersModal}
              iconSource={require("../../../assets/Arrow-left.png")}
            />
            <Text style={styles.headerTitle}>Assign to</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchBar}>
            <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
            <TextInput
              value={workerSearch}
              onChangeText={setWorkerSearch}
              placeholder="Search workers"
              placeholderTextColor="rgba(5, 45, 80, 0.5)"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.groupCard}>
            <View style={[styles.groupRow, styles.groupRowLast]}>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowLabel}>All Members Notification</Text>
                <Text style={styles.rowHint}>
                  Send reminders to everyone in the project team.
                </Text>
              </View>
              <Switch
                value={settings.allMembersNotification}
                onValueChange={(value) =>
                  setSettings((previous) => ({
                    ...previous,
                    allMembersNotification: value,
                  }))
                }
                trackColor={{ false: "#D9E3EC", true: theme.colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D9E3EC"
              />
            </View>
          </View>

          {loadingWorkers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0091FF" />
              <Text style={styles.loadingText}>Loading workers...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredWorkers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.workersListContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = pendingAssignees.some(
                  (worker) => worker.id === item.id,
                );

                return (
                  <TouchableOpacity
                    style={styles.workerCard}
                    onPress={() => togglePendingAssignee(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.workerAvatarPlaceholder}>
                      <Text style={styles.workerAvatarInitials}>
                        {getUserInitials(item.name)}
                      </Text>
                    </View>
                    <View style={styles.workerCardInfo}>
                      <Text numberOfLines={1} style={styles.workerCardName}>
                        {item.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={styles.workerCardProfession}
                      >
                        {item.profession || "Profession not set"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.workerCheckbox,
                        themedCheckboxStyle,
                        isSelected && styles.workerCheckboxSelected,
                        isSelected && themedCheckboxSelectedStyle,
                      ]}
                    >
                      {isSelected ? (
                        <Icon name="check" size={12} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No workers available for notifications
                  </Text>
                </View>
              }
            />
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalSaveButton}
              activeOpacity={0.85}
              onPress={saveWorkersSelection}
            >
              <Text style={styles.modalSaveButtonText}>
                {pendingAssignees.length > 0
                  ? `Save (${pendingAssignees.length})`
                  : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  groupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  groupRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
    marginBottom: 4,
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
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  messageLabel: {
    color: "#698196",
    fontSize: 12,
    marginBottom: 8,
  },
  messageInput: {
    minHeight: 110,
    color: "#052D50",
    fontSize: 16,
    textAlignVertical: "top",
    paddingTop: 4,
  },
  messageInputDisabled: {
    color: "rgba(5, 45, 80, 0.45)",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "rgba(238, 245, 251, 0.96)",
  },
  saveButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
  },
  modalContainer: {
    ...standardScreenContainer,
    paddingBottom: 24,
  },
  searchBar: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    color: "#052D50",
    fontSize: 15,
  },
  workersListContent: {
    paddingBottom: 16,
  },
  workerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  workerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D9E8F5",
    alignItems: "center",
    justifyContent: "center",
  },
  workerAvatarInitials: {
    color: "#052D50",
    fontSize: 14,
    fontFamily: "DMSans-SemiBold",
  },
  workerCardInfo: {
    flex: 1,
  },
  workerCardName: {
    color: "#052D50",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
    marginBottom: 2,
  },
  workerCardProfession: {
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
    borderColor: "#FFFFFF",
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  workerCheckboxSelected: {
    backgroundColor: "#FFFFFF",
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#698196",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    color: "#698196",
  },
  modalFooter: {
    paddingTop: 8,
  },
  modalSaveButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans-SemiBold",
  },
});
