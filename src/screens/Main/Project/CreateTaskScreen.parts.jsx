import { useState, useEffect, useMemo } from "react";
import { getDateLocale } from "../../../utils/dateLocale";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { createStyles } from "./CreateTaskScreen.styles";
import { useTheme } from "../../../theme/ThemeContext";

const useThemedStyles = () => {
  const { theme } = useTheme();
  return useMemo(() => createStyles(theme.content), [theme.content]);
};

const DATETIME_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "default";
const DEFAULT_ALL_DAY_START_TIME = "08:00";
const DEFAULT_ALL_DAY_DURATION_MINUTES = 8 * 60;

export const FieldIcon = ({
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

export const isImageDocument = (document) => {
  const mimeType = document?.mimeType || "";
  const extension = getFileExtension(document?.name || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"].includes(extension)
  );
};

export const getDocumentTypeMeta = (document) => {
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

export const SectionLabel = () => null;

export const GroupCard = ({ children }) => {
  const styles = useThemedStyles();
  return <View style={styles.groupCard}>{children}</View>;
};

export const GroupRow = ({ children, isLast = false }) => {
  const styles = useThemedStyles();
  return (
    <View style={[styles.groupRow, isLast && styles.groupRowLast]}>
      {children}
    </View>
  );
};

const formatScheduleDate = (date) =>
  date.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatScheduleTime = (date) =>
  date.toLocaleTimeString(getDateLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const parseScheduleTimeToMinutes = (time) => {
  const [hours, minutes] = String(time || "")
    .split(":")
    .map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const createDateAtMinutes = (baseDate, minutes) => {
  const date = new Date(baseDate);
  const dayOffset = Math.floor(minutes / (24 * 60));
  const minutesOfDay = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);

  date.setDate(date.getDate() + dayOffset);
  date.setHours(Math.floor(minutesOfDay / 60), minutesOfDay % 60, 0, 0);

  return date;
};

export const buildAllDayRange = (project, baseDate = new Date()) => {
  const shiftSchedule = project?.shiftSchedule;
  const hasProjectWorkday =
    shiftSchedule?.enabled &&
    shiftSchedule?.workDayStartTime &&
    shiftSchedule?.workDayEndTime;
  const fallbackStartMinutes =
    parseScheduleTimeToMinutes(DEFAULT_ALL_DAY_START_TIME) || 0;
  let startMinutes = hasProjectWorkday
    ? parseScheduleTimeToMinutes(shiftSchedule.workDayStartTime)
    : fallbackStartMinutes;
  let endMinutes = hasProjectWorkday
    ? parseScheduleTimeToMinutes(shiftSchedule.workDayEndTime)
    : fallbackStartMinutes + DEFAULT_ALL_DAY_DURATION_MINUTES;

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    startMinutes = startMinutes ?? fallbackStartMinutes;
    endMinutes = startMinutes + DEFAULT_ALL_DAY_DURATION_MINUTES;
  }

  return {
    start: createDateAtMinutes(baseDate, startMinutes),
    end: createDateAtMinutes(baseDate, endMinutes),
  };
};

export const DateTimeFieldModal = ({
  visible,
  title,
  value,
  onChange,
  onClose,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  const [draftDate, setDraftDate] = useState(value || new Date());

  useEffect(() => {
    if (visible) {
      setDraftDate(value || new Date());
    }
  }, [visible, value]);

  const handleDone = () => {
    onChange(draftDate);
    onClose();
  };

  const handleDateChange = (_event, date) => {
    if (!date) {
      return;
    }

    if (Platform.OS === "android") {
      setDraftDate((previousDate) => {
        const nextDate = new Date(date);
        nextDate.setHours(
          previousDate.getHours(),
          previousDate.getMinutes(),
          0,
          0,
        );
        return nextDate;
      });
      return;
    }

    setDraftDate(date);
  };

  const handleTimeChange = (_event, date) => {
    if (!date) {
      return;
    }

    setDraftDate((previousDate) => {
      const nextDate = new Date(previousDate);
      nextDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      return nextDate;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>{title}</Text>
          {Platform.OS === "android" ? (
            <>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="calendar"
                onChange={handleDateChange}
              />
              <DateTimePicker
                value={draftDate}
                mode="time"
                display="clock"
                onChange={handleTimeChange}
              />
            </>
          ) : (
            <DateTimePicker
              value={draftDate}
              mode="datetime"
              display={DATETIME_PICKER_DISPLAY}
              onChange={(_event, date) => {
                if (date) {
                  setDraftDate(date);
                }
              }}
            />
          )}
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={handleDone}
          >
            <Text style={styles.datePickerButtonText}>{t("common.done")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const ScheduleDateRow = ({ label, value, onPress, isLast = false }) => {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  return (
    <View style={[styles.scheduleRow, isLast && styles.groupRowLast]}>
      <Text style={styles.scheduleLabel}>{label}</Text>
      <View style={styles.dateChips}>
        <TouchableOpacity
          style={styles.dateChip}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.dateChipText, !value && styles.dateChipPlaceholder]}
          >
            {value ? formatScheduleDate(value) : t("createTask.selectDate")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateChip}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.dateChipText, !value && styles.dateChipPlaceholder]}
          >
            {value ? formatScheduleTime(value) : t("createTask.selectTime")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const getProjectId = (project) => project?._id || project?.id;

export const getUserId = (user) => user?._id || user?.id;

export const parseDraftDate = (date) => {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const ProjectPickerModal = ({
  visible,
  projects,
  selectedProjectId,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.projectPickerOverlay}>
        <View style={styles.projectPickerCard}>
          <View style={styles.projectPickerHeader}>
            <Text style={styles.projectPickerTitle}>
              {t("createTask.selectProjectTitle")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.projectPickerClose}
            >
              <Icon name="x" size={20} color="#8A97A6" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.projectPickerList}
            contentContainerStyle={styles.projectPickerListContent}
          >
            {projects.length === 0 ? (
              <Text style={styles.projectPickerEmpty}>
                {t("projects.notFound")}
              </Text>
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
                        {project.name || t("createTask.untitledProject")}
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
};

export const UserPickerModal = ({
  visible,
  users,
  selectedUserId,
  onSelect,
  onClose,
  multiple = false,
  selectedUserIds = [],
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.projectPickerOverlay}>
        <View style={styles.projectPickerCard}>
          <View style={styles.projectPickerHeader}>
            <Text style={styles.projectPickerTitle}>
              {t("createTask.selectUserTitle")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.projectPickerClose}
            >
              <Icon name="x" size={20} color="#8A97A6" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.projectPickerList}
            contentContainerStyle={styles.projectPickerListContent}
          >
            {users.length === 0 ? (
              <Text style={styles.projectPickerEmpty}>
                {t("createTask.noUsers")}
              </Text>
            ) : (
              users.map((item) => {
                const id = getUserId(item);
                const isSelected = multiple
                  ? selectedUserIds.includes(id)
                  : id === selectedUserId;

                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.projectPickerItem,
                      isSelected && styles.projectPickerItemSelected,
                    ]}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.projectPickerItemText}>
                      <Text style={styles.projectPickerItemTitle}>
                        {item.name || item.email || t("createTask.unnamedUser")}
                      </Text>
                      <Text style={styles.projectPickerItemSubtitle}>
                        {item.profession || item.role || t("roles.user")}
                      </Text>
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
};
