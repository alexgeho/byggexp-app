import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import AuthContext from "../../../contexts/AuthContext";
import { taskService } from "../../../services";
import { useScheduleData } from "../../../hooks/useScheduleData";
import {
  addDays,
  addMonths,
  buildEmployeeItems,
  buildEmployeeOptions,
  buildLeaveItems,
  buildProjectMap,
  buildProjectOptions,
  buildProjectSpanItem,
  daysBetween,
  DAY_MS,
  formatMonthLabel,
  formatWeekdayLabel,
  getMonthKey,
  getWeekNumber,
  normalizeId,
  parseMonthKey,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../../../utils/schedule";
import { getDateLocale } from "../../../utils/dateLocale";
import { createStyles, ROW_HEIGHT } from "./ScheduleScreen.styles";
import { useTheme } from "../../../theme/ThemeContext";

const RANGE_DAYS = 42; // 6 weeks — covers any month with week alignment
const BASE_DAY_WIDTH = 72;
const MIN_DAY_WIDTH = 18; // zoom out far enough to see the whole range
const MAX_DAY_WIDTH = 200; // zoom in to a single day comfortably
const ZOOM_STEP = 1.3;
const BAR_RADIUS = 16;
const DONE_STATUSES = new Set(["done", "completed", "closed"]);
const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "spinner" : "default";

// Bar/lane geometry. A single-lane row keeps the original 64px height
// (8 + 48 + 8). When a row's items overlap in time they are stacked into
// separate lanes and the row grows, so overlapping bars never draw on top of
// each other.
const LANE_VPAD = 8;
const BAR_HEIGHT = ROW_HEIGHT - LANE_VPAD * 2; // 48
const LANE_GAP = 8;
const LANE_STRIDE = BAR_HEIGHT + LANE_GAP;
const rowHeightForLanes = (laneCount) =>
  LANE_VPAD * 2 +
  laneCount * BAR_HEIGHT +
  Math.max(0, laneCount - 1) * LANE_GAP;

// Greedy interval partitioning: place each item in the first lane whose last
// bar has already ended, otherwise open a new lane. Returns the items tagged
// with a `lane` index and the total lane count for the row.
const assignLanes = (items) => {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const laneEnds = [];
  const laid = sorted.map((item) => {
    let lane = laneEnds.findIndex((end) => item.start >= end);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    return { ...item, lane };
  });
  return { items: laid, laneCount: Math.max(1, laneEnds.length) };
};

const formatFullDate = (date) =>
  new Intl.DateTimeFormat(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const toNoonIso = (date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
  ).toISOString();
// Dev-only preview with fake, varied data. Never true in production
// (guarded by __DEV__ at the call site); flip to preview colors locally.
const SCHEDULE_DEMO = false;

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState("employees");
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  // Month shown in the header — follows the horizontal scroll position so it
  // reflects the dates currently in view (not just the selected month).
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  const [dayWidth, setDayWidth] = useState(BASE_DAY_WIDTH);
  const [bodyHeight, setBodyHeight] = useState(0);
  const {
    loading,
    tasks,
    projects,
    workers,
    leaves,
    reload: loadData,
  } = useScheduleData(user, SCHEDULE_DEMO);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null); // 'project' | 'status'
  const [reschedule, setReschedule] = useState(null); // { taskId, title, start, due }
  const [datePickerTarget, setDatePickerTarget] = useState(null); // 'start' | 'due'
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Frozen header (horizontal) and sidebar (vertical) are driven by the
  // timeline body's scroll so the three panes stay aligned.
  const headerScrollRef = useRef(null);
  const sidebarScrollRef = useRef(null);
  const bodyHScrollRef = useRef(null);
  const bodyVScrollRef = useRef(null);

  const projectMap = useMemo(() => buildProjectMap(projects), [projects]);

  // Filter options.
  const projectFilterOptions = useMemo(
    () => buildProjectOptions(projects),
    [projects],
  );
  const statusOptions = useMemo(() => {
    const set = new Set();
    tasks.forEach((task) => {
      if (task?.status) {
        set.add(String(task.status));
      }
    });
    return Array.from(set).map((key) => ({
      id: key,
      name: t(`task.status.${key}`, key),
    }));
  }, [tasks, t]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const projectOk =
          !selectedProjectIds.length ||
          selectedProjectIds.includes(normalizeId(task.projectId));
        const statusOk =
          !selectedStatuses.length ||
          selectedStatuses.includes(String(task.status));
        return projectOk && statusOk;
      }),
    [tasks, selectedProjectIds, selectedStatuses],
  );

  const rows = useMemo(() => {
    if (mode === "employees") {
      return buildEmployeeOptions(projects, workers);
    }
    let options = buildProjectOptions(projects);
    if (selectedProjectIds.length) {
      options = options.filter((option) =>
        selectedProjectIds.includes(option.id),
      );
    }
    if (selectedStatuses.length) {
      options = options.filter((option) =>
        selectedStatuses.includes(String(projectMap[option.id]?.status)),
      );
    }
    return options;
  }, [
    mode,
    projects,
    workers,
    selectedProjectIds,
    selectedStatuses,
    projectMap,
  ]);

  // rowId -> array of bars for that row.
  const itemsByRow = useMemo(() => {
    const map = {};
    rows.forEach((row, index) => {
      if (mode === "employees") {
        map[row.id] = [
          ...buildEmployeeItems(filteredTasks, projectMap, row.id),
          ...buildLeaveItems(leaves, row.id),
        ];
      } else {
        const spanItem = buildProjectSpanItem(projectMap[row.id], index);
        map[row.id] = spanItem ? [spanItem] : [];
      }
    });
    return map;
  }, [mode, rows, filteredTasks, projectMap, leaves]);

  // Stack overlapping items into lanes and give each row a height that fits its
  // lane count, so bars in the same row never overlap.
  const rowLayout = useMemo(() => {
    const out = {};
    rows.forEach((row) => {
      const { items, laneCount } = assignLanes(itemsByRow[row.id] || []);
      out[row.id] = { items, laneCount, height: rowHeightForLanes(laneCount) };
    });
    return out;
  }, [rows, itemsByRow]);

  const rangeStart = useMemo(
    () => startOfWeek(startOfMonth(currentMonth)),
    [currentMonth],
  );
  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = useMemo(
    () => addDays(rangeStart, RANGE_DAYS).getTime(),
    [rangeStart],
  );
  const timelineWidth = RANGE_DAYS * dayWidth;

  const days = useMemo(
    () =>
      Array.from({ length: RANGE_DAYS }, (_, index) =>
        addDays(rangeStart, index),
      ),
    [rangeStart],
  );

  const weeks = useMemo(() => {
    const result = [];
    for (let index = 0; index < RANGE_DAYS; index += 7) {
      result.push({
        key: `week-${index}`,
        label: t("schedule.week", { number: getWeekNumber(days[index]) }),
      });
    }
    return result;
  }, [days, t]);

  const todayStart = startOfDay(new Date()).getTime();
  const todayInRange = todayStart >= rangeStartMs && todayStart < rangeEndMs;
  const todayX = todayInRange
    ? daysBetween(rangeStart, new Date()) * dayWidth
    : null;

  const goToday = () => setCurrentMonth(startOfMonth(new Date()));

  const zoom = (factor) =>
    setDayWidth((prev) =>
      Math.round(
        Math.min(MAX_DAY_WIDTH, Math.max(MIN_DAY_WIDTH, prev * factor)),
      ),
    );
  const zoomPercent = Math.round((dayWidth / BASE_DAY_WIDTH) * 100);

  const monthOptions = useMemo(() => {
    const base = startOfMonth(new Date());
    const options = [];
    for (let offset = -24; offset <= 12; offset += 1) {
      const date = addMonths(base, offset);
      options.push({ key: getMonthKey(date), label: formatMonthLabel(date) });
    }
    return options;
  }, []);

  const contentHeight = Math.max(
    rows.reduce(
      (sum, row) => sum + (rowLayout[row.id]?.height || ROW_HEIGHT),
      0,
    ),
    ROW_HEIGHT,
  );

  const filterOptions =
    activeFilter === "project" ? projectFilterOptions : statusOptions;
  const filterSelected =
    activeFilter === "project" ? selectedProjectIds : selectedStatuses;
  const setFilterSelected =
    activeFilter === "project" ? setSelectedProjectIds : setSelectedStatuses;

  const toggleFilterValue = (id) =>
    setFilterSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );

  const projectChipLabel = selectedProjectIds.length
    ? `${t("menu.projects")} · ${selectedProjectIds.length}`
    : t("projects.all");
  const statusChipLabel = selectedStatuses.length
    ? `${t("task.statusLabel")} · ${selectedStatuses.length}`
    : t("schedule.allStatuses");

  const onBodyHorizontalScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x, animated: false });

    // Switch the header month to the month at the centre of what's visible.
    if (timelineViewportWidth > 0 && dayWidth > 0) {
      const centerDayIndex = Math.floor(
        (x + timelineViewportWidth / 2) / dayWidth,
      );
      const dateAtCenter = addDays(rangeStart, centerDayIndex);
      setVisibleMonth((prev) =>
        getMonthKey(prev) === getMonthKey(dateAtCenter)
          ? prev
          : startOfMonth(dateAtCenter),
      );
    }
  };

  const onBodyVerticalScroll = (event) => {
    sidebarScrollRef.current?.scrollTo({
      y: event.nativeEvent.contentOffset.y,
      animated: false,
    });
  };

  // When the selected month changes (picker / arrows), reset the header label
  // and jump the timeline back to the start of the range.
  useEffect(() => {
    setVisibleMonth(currentMonth);
    bodyHScrollRef.current?.scrollTo({ x: 0, animated: false });
    headerScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [currentMonth]);

  const openItem = (item) => {
    if (item.type === "task") {
      const task = tasks.find((entry) => normalizeId(entry) === item.taskId);
      if (task) {
        navigation.navigate("Task", {
          task,
          project: projectMap[item.projectId] || null,
        });
      }
    } else if (item.type === "project" && item.projectId) {
      navigation.navigate("Project", { id: item.projectId });
    }
  };

  // Long-press a task bar to reschedule it (change start/due dates).
  const openReschedule = (item) => {
    if (item.type !== "task" || !item.taskId) {
      return;
    }
    const task = tasks.find((entry) => normalizeId(entry) === item.taskId);
    if (!task) {
      return;
    }
    const start = task.startDate ? new Date(task.startDate) : new Date();
    const validStart = Number.isNaN(start.getTime()) ? new Date() : start;
    const due = task.dueDate ? new Date(task.dueDate) : validStart;
    const validDue = Number.isNaN(due.getTime()) ? validStart : due;
    setReschedule({
      taskId: item.taskId,
      title: item.title,
      start: validStart,
      due: validDue,
    });
  };

  const handleRescheduleDateChange = (_event, date) => {
    if (!date || !datePickerTarget) {
      return;
    }
    setReschedule((prev) =>
      prev ? { ...prev, [datePickerTarget]: date } : prev,
    );
    if (Platform.OS !== "ios") {
      setDatePickerTarget(null);
    }
  };

  const handleSaveReschedule = async () => {
    if (!reschedule || savingReschedule) {
      return;
    }
    if (
      startOfDay(reschedule.due).getTime() <
      startOfDay(reschedule.start).getTime()
    ) {
      Alert.alert(t("schedule.invalidDatesTitle"), t("schedule.invalidDates"));
      return;
    }
    try {
      setSavingReschedule(true);
      await taskService.update(reschedule.taskId, {
        startDate: toNoonIso(reschedule.start),
        dueDate: toNoonIso(reschedule.due),
      });
      setReschedule(null);
      setDatePickerTarget(null);
      await loadData();
    } catch {
      Alert.alert(t("schedule.saveFailedTitle"), t("common.tryAgain"));
    } finally {
      setSavingReschedule(false);
    }
  };

  const renderBar = (item) => {
    const clampedStart = Math.max(item.start, rangeStartMs);
    const clampedEnd = Math.min(item.end, rangeEndMs);
    if (clampedEnd <= clampedStart) {
      return null;
    }

    const left = ((clampedStart - rangeStartMs) / DAY_MS) * dayWidth;
    const width = ((clampedEnd - clampedStart) / DAY_MS) * dayWidth;
    const clippedLeft = item.start < rangeStartMs;
    const clippedRight = item.end > rangeEndMs;

    const done = DONE_STATUSES.has(String(item.status || "").toLowerCase());
    const overdue = !done && item.type === "task" && item.end <= todayStart;
    const isLeave = item.type === "leave";
    const label = isLeave
      ? t(`schedule.leaveTypes.${item.leaveType}`, item.leaveType)
      : item.title;

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.85}
        onPress={() => openItem(item)}
        onLongPress={() => openReschedule(item)}
        style={[
          styles.bar,
          {
            left,
            width: Math.max(width, 8),
            top: LANE_VPAD + (item.lane || 0) * LANE_STRIDE,
            height: BAR_HEIGHT,
            backgroundColor: isLeave ? "#E7E3D5" : item.color,
            opacity: done ? 0.55 : 1,
            borderTopLeftRadius: clippedLeft ? 0 : BAR_RADIUS,
            borderBottomLeftRadius: clippedLeft ? 0 : BAR_RADIUS,
            borderTopRightRadius: clippedRight ? 0 : BAR_RADIUS,
            borderBottomRightRadius: clippedRight ? 0 : BAR_RADIUS,
          },
          overdue && styles.barOverdue,
        ]}
      >
        <View style={styles.barTitleRow}>
          <Text
            numberOfLines={1}
            style={isLeave ? styles.barTitleMuted : styles.barTitle}
          >
            {label}
          </Text>
          {done ? <Icon name="check" size={13} color="#FFFFFF" /> : null}
        </View>
        {item.location || item.assigneeCount ? (
          <View style={styles.barMetaRow}>
            {item.location ? (
              <View style={styles.barMetaItem}>
                <Icon
                  name="map-pin"
                  size={11}
                  color="rgba(255, 255, 255, 0.9)"
                />
                <Text numberOfLines={1} style={styles.barMeta}>
                  {item.location}
                </Text>
              </View>
            ) : null}
            {item.assigneeCount ? (
              <View style={styles.barMetaItemFixed}>
                <Icon name="users" size={11} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.barMeta}>{item.assigneeCount}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
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
        <TouchableOpacity
          style={styles.monthSelector}
          onPress={() => setMonthPickerOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.monthLabel}>
            {formatMonthLabel(visibleMonth)}
          </Text>
          <Icon name="chevron-down" size={18} color="#052D50" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.todayButton}
          onPress={goToday}
          activeOpacity={0.85}
        >
          <Icon name="calendar" size={20} color="#052D50" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.segmented}>
          {["employees", "projects"].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.segment, mode === value && styles.segmentActive]}
              onPress={() => setMode(value)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === value && styles.segmentTextActive,
                ]}
              >
                {t(`schedule.${value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setActiveFilter("project")}
          activeOpacity={0.85}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.filterChipText,
              selectedProjectIds.length === 0 && styles.filterChipPlaceholder,
            ]}
          >
            {projectChipLabel}
          </Text>
          <Icon name="chevron-down" size={16} color="#052D50" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setActiveFilter("status")}
          activeOpacity={0.85}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.filterChipText,
              selectedStatuses.length === 0 && styles.filterChipPlaceholder,
            ]}
          >
            {statusChipLabel}
          </Text>
          <Icon name="chevron-down" size={16} color="#052D50" />
        </TouchableOpacity>
      </View>

      <View style={styles.timelineCard}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0091FF" />
          </View>
        ) : !rows.length ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{t("schedule.noResources")}</Text>
          </View>
        ) : (
          <>
            {/* Frozen top: corner + day/week header (driven horizontally) */}
            <View style={styles.headerRow}>
              <View style={styles.corner}>
                <Text style={styles.cornerText}>
                  {t(
                    mode === "employees"
                      ? "schedule.employees"
                      : "schedule.projects",
                  )}
                </Text>
              </View>
              <ScrollView
                ref={headerScrollRef}
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
              >
                <View style={{ width: timelineWidth }}>
                  <View style={styles.weekHeaderRow}>
                    {weeks.map((week) => (
                      <View
                        key={week.key}
                        style={[styles.weekHeaderCell, { width: 7 * dayWidth }]}
                      >
                        <Text style={styles.weekHeaderText}>{week.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.dayHeaderRow}>
                    {days.map((day) => {
                      const isToday = startOfDay(day).getTime() === todayStart;
                      return (
                        <View
                          key={day.getTime()}
                          style={[styles.dayHeaderCell, { width: dayWidth }]}
                        >
                          <View style={isToday ? styles.dayTodayPill : null}>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.dayLabel,
                                isToday && styles.dayTodayLabel,
                              ]}
                            >
                              {dayWidth >= 48
                                ? `${formatWeekdayLabel(day)} ${day.getDate()}`
                                : day.getDate()}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Body: frozen sidebar + scrollable timeline */}
            <View
              style={styles.bodyRow}
              onLayout={(event) =>
                setBodyHeight(event.nativeEvent.layout.height)
              }
            >
              <ScrollView
                ref={sidebarScrollRef}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                style={[
                  styles.sidebar,
                  bodyHeight ? { height: bodyHeight } : null,
                ]}
              >
                {rows.map((row) => (
                  <View
                    key={row.id}
                    style={[
                      styles.sidebarCell,
                      { height: rowLayout[row.id]?.height || ROW_HEIGHT },
                    ]}
                  >
                    <Text numberOfLines={1} style={styles.sidebarName}>
                      {row.name}
                    </Text>
                    {row.subtitle ? (
                      <Text numberOfLines={1} style={styles.sidebarSubtitle}>
                        {row.subtitle}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>

              <ScrollView
                ref={bodyHScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={onBodyHorizontalScroll}
                onLayout={(e) =>
                  setTimelineViewportWidth(e.nativeEvent.layout.width)
                }
              >
                <ScrollView
                  ref={bodyVScrollRef}
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={onBodyVerticalScroll}
                  style={bodyHeight ? { height: bodyHeight } : null}
                >
                  <View style={{ width: timelineWidth, height: contentHeight }}>
                    {/* Day grid lines */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      {days.map((day, index) => (
                        <View
                          key={`grid-${day.getTime()}`}
                          style={[
                            styles.gridLine,
                            { left: index * dayWidth, height: contentHeight },
                          ]}
                        />
                      ))}
                    </View>

                    {/* Rows */}
                    {rows.map((row) => (
                      <View
                        key={row.id}
                        style={[
                          styles.timelineRow,
                          { height: rowLayout[row.id]?.height || ROW_HEIGHT },
                        ]}
                      >
                        {(rowLayout[row.id]?.items || []).map(renderBar)}
                      </View>
                    ))}

                    {/* Today marker */}
                    {todayX !== null ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.todayLine,
                          {
                            left: todayX + dayWidth / 2,
                            height: contentHeight,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                </ScrollView>
              </ScrollView>
            </View>
          </>
        )}
      </View>

      {/* Zoom — floats above the bottom bar, matching the design */}
      <View style={styles.zoomFloating} pointerEvents="box-none">
        <View style={styles.zoomGroup}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => zoom(1 / ZOOM_STEP)}
            disabled={dayWidth <= MIN_DAY_WIDTH}
            activeOpacity={0.85}
          >
            <Icon name="minus" size={20} color="#052D50" />
          </TouchableOpacity>
          <View style={styles.zoomValueBox}>
            <Text style={styles.zoomValueText}>{zoomPercent}%</Text>
          </View>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => zoom(ZOOM_STEP)}
            disabled={dayWidth >= MAX_DAY_WIDTH}
            activeOpacity={0.85}
          >
            <Icon name="plus" size={20} color="#052D50" />
          </TouchableOpacity>
        </View>
      </View>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />

      {/* Filter (projects / statuses) */}
      <Modal
        visible={activeFilter !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveFilter(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveFilter(null)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {t(
                  activeFilter === "project"
                    ? "schedule.filterProjects"
                    : "schedule.filterStatuses",
                )}
              </Text>
              {filterSelected.length ? (
                <TouchableOpacity onPress={() => setFilterSelected([])}>
                  <Text style={styles.clearText}>{t("schedule.clear")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <FlatList
              data={filterOptions}
              keyExtractor={(option) => option.id}
              renderItem={({ item: option }) => {
                const checked = filterSelected.includes(option.id);
                return (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => toggleFilterValue(option.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.optionName}>{option.name}</Text>
                    <View
                      style={[
                        styles.checkbox,
                        checked && styles.checkboxChecked,
                      ]}
                    >
                      {checked ? (
                        <Icon name="check" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reschedule task */}
      <Modal
        visible={reschedule !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setReschedule(null);
          setDatePickerTarget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {t("schedule.rescheduleTitle")}
            </Text>
            {reschedule ? (
              <>
                <Text numberOfLines={1} style={styles.rescheduleTaskName}>
                  {reschedule.title}
                </Text>

                <TouchableOpacity
                  style={styles.dateRow}
                  onPress={() => setDatePickerTarget("start")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dateRowLabel}>
                    {t("schedule.startDate")}
                  </Text>
                  <Text
                    style={[
                      styles.dateRowValue,
                      datePickerTarget === "start" && styles.dateRowValueActive,
                    ]}
                  >
                    {formatFullDate(reschedule.start)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateRow}
                  onPress={() => setDatePickerTarget("due")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dateRowLabel}>
                    {t("schedule.dueDate")}
                  </Text>
                  <Text
                    style={[
                      styles.dateRowValue,
                      datePickerTarget === "due" && styles.dateRowValueActive,
                    ]}
                  >
                    {formatFullDate(reschedule.due)}
                  </Text>
                </TouchableOpacity>

                {datePickerTarget ? (
                  <>
                    <DateTimePicker
                      value={
                        datePickerTarget === "start"
                          ? reschedule.start
                          : reschedule.due
                      }
                      mode="date"
                      display={DATE_PICKER_DISPLAY}
                      onChange={handleRescheduleDateChange}
                    />
                    {Platform.OS === "ios" ? (
                      <TouchableOpacity
                        style={styles.pickerDone}
                        onPress={() => setDatePickerTarget(null)}
                      >
                        <Text style={styles.pickerDoneText}>
                          {t("common.done")}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    savingReschedule && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveReschedule}
                  disabled={savingReschedule}
                  activeOpacity={0.85}
                >
                  {savingReschedule ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {t("common.save")}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Month picker */}
      <Modal
        visible={monthPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMonthPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("schedule.selectMonth")}</Text>
            <FlatList
              data={monthOptions}
              keyExtractor={(option) => option.key}
              initialScrollIndex={24}
              getItemLayout={(_, index) => ({
                length: 52,
                offset: 52 * index,
                index,
              })}
              renderItem={({ item: option }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    setCurrentMonth(parseMonthKey(option.key));
                    setMonthPickerOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionName}>{option.label}</Text>
                  {option.key === getMonthKey(currentMonth) ? (
                    <Icon name="check" size={20} color="#0091FF" />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
