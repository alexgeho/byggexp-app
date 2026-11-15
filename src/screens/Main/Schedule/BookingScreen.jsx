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
  DeviceEventEmitter,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";

import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { clientService } from "../../../services/client.service";
import { projectService } from "../../../services/project.service";
import { taskService } from "../../../services/task.service";
import { userService } from "../../../services/user.service";
import {
  deleteBookingOrder,
  saveBooking,
} from "../../../services/booking.service";
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import {
  Button,
  ChoiceChips,
  FormFooter,
  FormHeader,
  FormScreen,
  SectionTitle,
} from "../../../components/common/ui";
import ArticlePickerModal from "../../Menu/Economy/ArticlePickerModal";
import ClientPickerModal from "../../Menu/Economy/ClientPickerModal";
import ProjectPickerModal from "../../Menu/Economy/ProjectPickerModal";
import { WorkersListModal } from "../Project/CreateProjectScreen.parts";
import { layout } from "../../../theme/spacing";
import { getApiErrorMessage } from "../../../utils/apiError";
import { clientDisplayName } from "../../../utils/clientName";
import { getDateLocale } from "../../../utils/dateLocale";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import { addDays, daysBetween, normalizeId } from "../../../utils/schedule";
import {
  DEFAULT_START,
  assignmentDayKey,
  clientHasName,
  endTimeFor,
  hoursBetween,
  parseDayKey,
  shiftEndTime,
  splitPhone,
  timeOf,
  toDayKey,
  withTime,
} from "../../../utils/scheduleBooking";

export const BOOKING_TASK_ADDED = "booking:taskAdded";

const EMPTY_CLIENT = {
  clientType: "private",
  firstName: "",
  lastName: "",
  companyName: "",
  orgNumber: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};
const EMPTY_EMPLOYEE = { name: "", phone: "", email: "" };
const STATUSES = ["planning", "in_progress", "completed", "on_hold"];
const EMAIL = /\S+@\S+\.\S+/;
const IS_IOS = Platform.OS === "ios";

const isImage = (file) =>
  String(file?.mimeType || "").startsWith("image/") ||
  /\.(jpe?g|png|gif|webp|heic)$/i.test(file?.name || "");

// «Ny bokning» from the planning calendar — the same window as the web admin:
// Arbetsorder (article → description, add to an existing order, order
// reference, documents, task), Kund (new by default or an existing one), Tid
// (from / to) and Personal (existing people, a new one, a comment).
// Opened with `projectId` it edits that order and its bookings.
export default function BookingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const params = useRoute().params || {};
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();

  const editingId = params.projectId || null;
  const editing = Boolean(editingId);
  const [project, setProject] = useState(null);
  const [ready, setReady] = useState(!editing);

  const [title, setTitle] = useState("");
  const [littera, setLittera] = useState("");
  const [status, setStatus] = useState("planning");
  const [rows, setRows] = useState([]);
  const [existingOrder, setExistingOrder] = useState(null);
  const [files, setFiles] = useState([]);
  const [addedTasks, setAddedTasks] = useState([]);

  // Client: a new one typed here, or one picked from the register.
  const [client, setClient] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [newClient, setNewClient] = useState(EMPTY_CLIENT);

  const [fromDay, setFromDay] = useState(() =>
    params.date ? parseDayKey(params.date) : parseDayKey(toDayKey(new Date())),
  );
  // Several days picked by a drag in the calendar come as date → dateTo.
  const [toDay, setToDay] = useState(() =>
    params.dateTo ? parseDayKey(params.dateTo) : fromDay,
  );
  // A tap on the hour grid brings its own time; "+" keeps 08:00–10:00.
  const [start, setStart] = useState(params.start || "08:00");
  const [end, setEnd] = useState(params.end || "10:00");
  const [weekdaysOnly, setWeekdaysOnly] = useState(!params.dateTo);
  const [androidPicker, setAndroidPicker] = useState(null); // { field, mode }

  const [people, setPeople] = useState([]);
  const [workerIds, setWorkerIds] = useState(
    params.workerId ? [String(params.workerId)] : [],
  );
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [newEmployee, setNewEmployee] = useState(EMPTY_EMPLOYEE);
  const [note, setNote] = useState("");

  const [picker, setPicker] = useState(null); // 'article' | 'order' | 'client' | 'workers'
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const request =
      user?.role === "superadmin"
        ? userService.getAll()
        : userService.getMyCompanyUsers();
    request
      .then((list) => setPeople(Array.isArray(list) ? list : []))
      .catch(() => setPeople([]));
  }, [user?.role]);

  // Editing: the order itself, plus the bookings the calendar already loaded.
  useEffect(() => {
    if (!editing) return;
    const bookings = params.assignments || [];
    const days = bookings.map(assignmentDayKey).sort();
    if (days.length) {
      setFromDay(parseDayKey(days[0]));
      setToDay(parseDayKey(days[days.length - 1]));
    }
    const focus = params.focus || bookings[0] || {};
    const startTime = focus.startTime || DEFAULT_START;
    setStart(startTime);
    setEnd(endTimeFor(startTime, focus.hours));
    setNote(focus.note || "");
    setWorkerIds([
      ...new Set(bookings.map((a) => normalizeId(a.userId)).filter(Boolean)),
    ]);
    projectService
      .getById(editingId)
      .then((loaded) => {
        setProject(loaded);
        setTitle(loaded?.name || "");
        setLittera(loaded?.littera || "");
        setStatus(loaded?.status || "planning");
        setRows(loaded?.orderRows || []);
        setClientId(normalizeId(loaded?.clientId));
      })
      .then(() => setReady(true))
      .catch((error) => {
        showError({ message: getApiErrorMessage(error, t("common.error")) });
        navigation.goBack();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // The client shown read-only: the edited order's, or the picked order's.
  const lockedClientId = existingOrder
    ? normalizeId(existingOrder.clientId)
    : clientId;
  useEffect(() => {
    if (!lockedClientId) {
      setClient(null);
      return undefined;
    }
    if (normalizeId(client) === lockedClientId) return undefined;
    let active = true;
    clientService
      .getById(lockedClientId)
      .then((loaded) => active && setClient(loaded))
      .catch(() => active && setClient(null));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedClientId]);

  // Tasks created from here are listed under the task row.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(BOOKING_TASK_ADDED, (task) =>
      setAddedTasks((prev) => [...prev, task]),
    );
    return () => sub.remove();
  }, []);

  const readOnlyOrder = Boolean(existingOrder);
  const lockClient = readOnlyOrder || Boolean(clientId);
  const shownClient = lockClient
    ? { ...EMPTY_CLIENT, ...(client || {}) }
    : newClient;
  const isCompany = (shownClient.clientType || "private") === "company";
  const multiDay = toDay.getTime() > fromDay.getTime();
  const hours = hoursBetween(start, end);

  const setC = (key) => (value) =>
    setNewClient((prev) => ({ ...prev, [key]: value }));
  const setE = (key) => (value) =>
    setNewEmployee((prev) => ({ ...prev, [key]: value }));

  // One article per booking; its name goes into Beskrivning (still editable).
  const pickArticle = (article) => {
    setPicker(null);
    const row = {
      articleId: String(article._id || article.id),
      articleNumber: article.articleNumber || "",
      name: article.name || "",
      unit: article.unit || "st",
      quantity: 1,
      price: Number(article.priceExclMoms) || 0,
    };
    setRows((prev) => [row, ...prev.slice(1)]);
    if (article.name && !readOnlyOrder) setTitle(article.name);
  };
  const articleLabel = rows[0]?.articleId
    ? [rows[0].articleNumber, rows[0].name].filter(Boolean).join(" · ")
    : "";

  const pickOrder = (order) => {
    setPicker(null);
    setExistingOrder(order || null);
    setLittera(order?.littera || "");
  };

  const pickClient = (picked) => {
    setPicker(null);
    setClient(picked);
    setClientId(normalizeId(picked));
  };
  const changeClientMode = (mode) => {
    if (mode === "existing") {
      setPicker("client");
      return;
    }
    setClient(null);
    setClientId(null);
  };

  // Moving the start keeps the length, like Google Calendar.
  const changeFromDay = (date) => {
    const next = parseDayKey(toDayKey(date));
    const shift = daysBetween(fromDay, next);
    setFromDay(next);
    setToDay((prev) => addDays(prev, shift));
  };
  const changeStart = (date) => {
    const next = timeOf(date);
    setEnd(shiftEndTime(start, end, next));
    setStart(next);
  };
  const applyPicked = (field, mode, date) => {
    if (!date) return;
    if (field === "from" && mode === "date") changeFromDay(date);
    else if (field === "from") changeStart(date);
    else if (mode === "date") setToDay(parseDayKey(toDayKey(date)));
    else setEnd(timeOf(date));
  };

  const pickFiles = async () => {
    try {
      const picked = await pickUploadAssets({
        fileNamePrefix: "booking-document",
      });
      if (!picked.length) return;
      setFiles((prev) => {
        const have = new Set(prev.map((file) => file.uri));
        return [...prev, ...picked.filter((file) => !have.has(file.uri))];
      });
    } catch {
      Alert.alert(
        t("createTask.documentsErrorTitle"),
        t("createTask.documentsErrorMessage"),
      );
    }
  };

  // Task with reminders: the usual task form, tied to the order when there
  // is one, due when the booking starts.
  const openTask = () => {
    const orderForTask = editing ? project : existingOrder;
    const due = withTime(fromDay, start).toISOString();
    navigation.navigate("CreateTask", {
      taskDraft: {
        selectedProjectId: normalizeId(orderForTask) || "",
        projectName: orderForTask?.name || "",
        startDate: due,
        dueDate: due,
        returnTarget: "booking",
      },
    });
  };
  const removeTask = (index) => {
    const task = addedTasks[index];
    setAddedTasks((prev) => prev.filter((_, i) => i !== index));
    if (task?.id) taskService.remove(task.id).catch(() => null);
  };

  // Staff picker: the company's workers, plus whoever is already booked.
  const staff = useMemo(
    () =>
      people.filter(
        (person) =>
          person?.role === "worker" ||
          workerIds.includes(String(normalizeId(person))),
      ),
    [people, workerIds],
  );
  const filteredStaff = useMemo(() => {
    const query = workerSearch.trim().toLowerCase();
    if (!query) return staff;
    return staff.filter((person) =>
      [person.name, person.email, person.profession]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [staff, workerSearch]);
  const staffLabel = workerIds
    .map(
      (id) => people.find((person) => String(normalizeId(person)) === id)?.name,
    )
    .filter(Boolean)
    .join(", ");
  const openWorkers = () => {
    setPendingWorkers(workerIds);
    setWorkerSearch("");
    setPicker("workers");
  };
  const togglePending = useCallback(
    (id) =>
      setPendingWorkers((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );

  const handleSave = async () => {
    if (saving) return;
    if (!readOnlyOrder && !title.trim()) {
      showError({ message: t("booking.descriptionRequired") });
      return;
    }
    if (toDay.getTime() < fromDay.getTime()) {
      showError({ message: t("schedule.invalidDates") });
      return;
    }
    if (hours <= 0) {
      showError({ message: t("booking.invalidTime") });
      return;
    }
    setSaving(true);
    try {
      // A new worker typed here is invited first, then booked with the rest.
      let ids = workerIds;
      if (newEmployee.name.trim() && EMAIL.test(newEmployee.email)) {
        const created = await userService.create({
          name: newEmployee.name.trim(),
          email: newEmployee.email.trim(),
          role: "worker",
          inviteViaEmail: true,
          ...splitPhone(newEmployee.phone),
          ...(user?.companyId ? { companyId: user.companyId } : {}),
        });
        const id = normalizeId(created?.user || created);
        if (id) ids = [...ids, id];
        setNewEmployee(EMPTY_EMPLOYEE);
        setWorkerIds(ids);
      }
      const typedClient =
        !readOnlyOrder && !clientId && clientHasName(newClient)
          ? newClient
          : null;
      const address =
        (typedClient ? newClient.address : client?.address) ||
        project?.location ||
        "";
      const dayCount = Math.max(1, daysBetween(fromDay, toDay) + 1);
      const result = await saveBooking({
        editing: editing
          ? { projectId: editingId, assignments: params.assignments || [] }
          : null,
        existingOrder,
        title: readOnlyOrder ? existingOrder.name : title.trim(),
        order: {
          littera: littera.trim(),
          ...(editing ? { status } : {}),
          projectManagerId: editing
            ? normalizeId(project?.projectManagerId)
            : user?._id || user?.id,
          plannedHours: Math.round(hours * dayCount * 10) / 10,
        },
        clientId: clientId || null,
        newClient: typedClient,
        address: String(address).trim(),
        from: toDayKey(fromDay),
        to: toDayKey(toDay),
        weekdaysOnly: multiDay ? weekdaysOnly : false,
        start,
        hours,
        workerIds: ids,
        note: note.trim(),
        rows,
        files,
      });
      if (result.filesSaved) {
        showSuccess({
          title: t(editing ? "booking.saved" : "booking.created"),
        });
      } else {
        showError({ message: t("booking.filesFailed") });
      }
      navigation.goBack();
    } catch (error) {
      showError({ message: getApiErrorMessage(error, t("common.error")) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t("booking.deleteOrderTitle"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBookingOrder(editingId);
            navigation.goBack();
          } catch (error) {
            showError({
              message: getApiErrorMessage(error, t("common.error")),
            });
          }
        },
      },
    ]);
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const saveLabel = editing ? t("common.save") : t("booking.create");
  const input = (label, value, onChangeText, extra = {}) => (
    <FieldRow
      variant="input"
      floating
      label={label}
      value={value}
      onChangeText={onChangeText}
      {...extra}
    />
  );
  // Things to add (files, a task): blue = it does something.
  const actionRow = (icon, text, onPress) => (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Icon name={icon} size={20} color={theme.colors.primary} />
      <Text style={[styles.actionText, { color: theme.colors.primary }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
  // A client that is already in the register is shown, not edited here.
  const clientField = (key, label, extra = {}) =>
    lockClient ? (
      <FieldRow
        label={label}
        value={String(shownClient[key] || "") || "—"}
        isLast={extra.isLast}
      />
    ) : (
      input(label, newClient[key], setC(key), extra)
    );

  const dateText = (day) =>
    day.toLocaleDateString(getDateLocale(), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const timeRow = (field, label, day, time) => (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      {IS_IOS ? (
        <View style={styles.timePickers}>
          <DateTimePicker
            value={day}
            mode="date"
            display="compact"
            locale={getDateLocale()}
            onChange={(_event, date) => applyPicked(field, "date", date)}
          />
          <DateTimePicker
            value={withTime(day, time)}
            mode="time"
            display="compact"
            locale={getDateLocale()}
            minuteInterval={15}
            onChange={(_event, date) => applyPicked(field, "time", date)}
          />
        </View>
      ) : (
        <View style={styles.timePickers}>
          <TouchableOpacity
            style={styles.timePill}
            onPress={() => setAndroidPicker({ field, mode: "date" })}
          >
            <Text style={styles.timePillText}>{dateText(day)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timePill}
            onPress={() => setAndroidPicker({ field, mode: "time" })}
          >
            <Text style={styles.timePillText}>{time}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <FormScreen style={styles.safe} edges={["top"]}>
      <FormHeader
        title={editing ? title || t("booking.workOrder") : t("booking.title")}
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        saving={saving}
        saveLabel={saveLabel}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={IS_IOS ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <SectionTitle inset>{t("booking.workOrder")}</SectionTitle>
            <FieldCard>
              <FieldRow
                variant="select"
                floating
                label={t("booking.article")}
                value={articleLabel}
                onPress={() => setPicker("article")}
              />
              {editing ? (
                <FieldRow label={t("task.statusLabel")}>
                  <ChoiceChips
                    tone="soft"
                    scroll
                    values={STATUSES}
                    value={status}
                    onChange={setStatus}
                    format={(value) => t(`projects.status.${value}`)}
                  />
                </FieldRow>
              ) : (
                <FieldRow
                  variant="select"
                  floating
                  label={t("booking.addToExisting")}
                  value={existingOrder?.name || ""}
                  onPress={() => setPicker("order")}
                />
              )}
              {readOnlyOrder ? (
                <FieldRow
                  label={t("booking.description")}
                  value={existingOrder.name || "—"}
                />
              ) : (
                input(t("booking.description"), title, setTitle)
              )}
              {input(t("booking.orderReference"), littera, setLittera)}
              {actionRow("paperclip", t("booking.files"), pickFiles)}
              {files.length ? (
                <View style={styles.tiles}>
                  {files.map((file, index) => (
                    <View key={file.uri} style={styles.tile}>
                      {isImage(file) ? (
                        <Image
                          source={{ uri: file.uri }}
                          style={styles.tileImage}
                        />
                      ) : (
                        <>
                          <Icon
                            name="file-text"
                            size={22}
                            color={theme.content.textSecondary}
                          />
                          <Text style={styles.tileName} numberOfLines={2}>
                            {file.name}
                          </Text>
                        </>
                      )}
                      <TouchableOpacity
                        style={styles.tileRemove}
                        hitSlop={8}
                        onPress={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        accessibilityRole="button"
                        accessibilityLabel={t("common.delete")}
                      >
                        <Icon name="x" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.separator} />
              {actionRow("plus", t("booking.task"), openTask)}
              {addedTasks.map((task, index) => (
                <View
                  key={task.id || `${task.title}-${index}`}
                  style={styles.taskRow}
                >
                  <View style={styles.flex}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    {task.due ? (
                      <Text style={styles.taskMeta} numberOfLines={1}>
                        {new Date(task.due).toLocaleString(getDateLocale(), {
                          day: "numeric",
                          month: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.taskRemove}
                    onPress={() => removeTask(index)}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.delete")}
                  >
                    <Icon name="x" size={18} color={theme.content.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </FieldCard>
          </View>

          <View>
            <SectionTitle inset>{t("booking.client")}</SectionTitle>
            <FieldCard>
              {readOnlyOrder ? null : (
                <FieldRow>
                  <ChoiceChips
                    tone="soft"
                    values={["new", "existing"]}
                    value={clientId ? "existing" : "new"}
                    onChange={changeClientMode}
                    format={(value) =>
                      value === "new"
                        ? t("billing.newClient")
                        : t("booking.existingClient")
                    }
                  />
                </FieldRow>
              )}
              {lockClient ? (
                <FieldRow
                  variant={readOnlyOrder ? "readonly" : "select"}
                  label={t("booking.client")}
                  value={clientDisplayName(client) || "—"}
                  onPress={
                    readOnlyOrder ? undefined : () => setPicker("client")
                  }
                />
              ) : (
                <FieldRow label={t("clientForm.clientType")}>
                  <ChoiceChips
                    tone="soft"
                    values={["private", "company"]}
                    value={newClient.clientType}
                    onChange={setC("clientType")}
                    format={(value) =>
                      value === "company"
                        ? t("clientForm.business")
                        : t("clientForm.private")
                    }
                  />
                </FieldRow>
              )}
              {isCompany ? (
                <>
                  {clientField("companyName", t("clientForm.companyName"))}
                  {clientField("orgNumber", t("clientForm.orgNumber"))}
                  {clientField("contactPerson", t("clientForm.contactPerson"))}
                </>
              ) : (
                <>
                  {clientField("firstName", t("clientForm.firstName"))}
                  {clientField("lastName", t("clientForm.lastName"))}
                </>
              )}
              {clientField("phone", t("clientForm.phone"), {
                keyboardType: "phone-pad",
              })}
              {clientField("email", t("clientForm.email"), {
                keyboardType: "email-address",
                autoCapitalize: "none",
              })}
              {clientField("address", t("clientForm.address"))}
              {clientField("notes", t("booking.comment"), { isLast: true })}
            </FieldCard>
          </View>

          <View>
            <SectionTitle inset>{t("booking.time")}</SectionTitle>
            <FieldCard>
              {timeRow("from", t("booking.from"), fromDay, start)}
              <View style={styles.separator} />
              {timeRow("to", t("booking.to"), toDay, end)}
              {multiDay ? (
                <>
                  <View style={styles.separator} />
                  <FieldRow
                    variant="toggle"
                    floating
                    label={t("booking.weekdaysOnly")}
                    switchValue={weekdaysOnly}
                    onSwitchChange={setWeekdaysOnly}
                    isLast
                  />
                </>
              ) : null}
            </FieldCard>
          </View>

          <View>
            <SectionTitle inset>{t("booking.staff")}</SectionTitle>
            <FieldCard>
              <FieldRow
                variant="select"
                floating
                label={t("booking.chooseStaff")}
                value={staffLabel}
                onPress={openWorkers}
              />
              {input(t("booking.name"), newEmployee.name, setE("name"))}
              {input(t("clientForm.phone"), newEmployee.phone, setE("phone"), {
                keyboardType: "phone-pad",
              })}
              {input(t("clientForm.email"), newEmployee.email, setE("email"), {
                keyboardType: "email-address",
                autoCapitalize: "none",
              })}
              {input(t("booking.comment"), note, setNote, { isLast: true })}
            </FieldCard>
          </View>

          {editing ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="trash-2" size={18} color={theme.content.danger} />
              <Text style={styles.deleteText}>{t("booking.deleteOrder")}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {androidPicker ? (
        <DateTimePicker
          value={
            androidPicker.field === "from"
              ? withTime(fromDay, start)
              : withTime(toDay, end)
          }
          mode={androidPicker.mode}
          is24Hour
          onChange={(_event, date) => {
            const { field, mode } = androidPicker;
            setAndroidPicker(null);
            applyPicked(field, mode, date);
          }}
        />
      ) : null}

      <FormFooter>
        <Button title={saveLabel} onPress={handleSave} loading={saving} />
      </FormFooter>

      <ArticlePickerModal
        visible={picker === "article"}
        onClose={() => setPicker(null)}
        onSelect={pickArticle}
      />
      <ProjectPickerModal
        visible={picker === "order"}
        onClose={() => setPicker(null)}
        onSelect={pickOrder}
      />
      <ClientPickerModal
        visible={picker === "client"}
        onClose={() => setPicker(null)}
        onSelect={pickClient}
      />
      <WorkersListModal
        visible={picker === "workers"}
        onClose={() => setPicker(null)}
        onSave={() => {
          setWorkerIds(pendingWorkers);
          setPicker(null);
        }}
        selectedWorkers={pendingWorkers}
        toggleSelection={togglePending}
        workerSearch={workerSearch}
        onWorkerSearchChange={setWorkerSearch}
        filteredWorkers={filteredStaff}
      />
    </FormScreen>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
      gap: layout.betweenCards * 2,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 16,
    },
    // Label left, date and time right — like a Settings row.
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 62,
      paddingLeft: 16,
      paddingRight: 8,
    },
    timeLabel: { fontSize: 14, color: c.textPrimary },
    timePickers: { flexDirection: "row", alignItems: "center", gap: 8 },
    timePill: {
      height: 36,
      justifyContent: "center",
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: c.inputSurface,
    },
    timePillText: {
      fontSize: 16,
      color: c.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
    },
    actionText: { fontSize: 16 },
    tiles: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    tile: {
      width: 72,
      height: 72,
      borderRadius: 8,
      backgroundColor: c.inputSurface,
      alignItems: "center",
      justifyContent: "center",
      padding: 4,
    },
    tileImage: { width: 72, height: 72, borderRadius: 8 },
    tileName: {
      fontSize: 10,
      lineHeight: 12,
      color: c.textSecondary,
      textAlign: "center",
      marginTop: 2,
    },
    tileRemove: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 56,
      paddingLeft: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
    },
    taskTitle: { fontSize: 14, color: c.textPrimary },
    taskMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    taskRemove: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 48,
    },
    deleteText: { fontSize: 16, color: c.danger },
  });
}
