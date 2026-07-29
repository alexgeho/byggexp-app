import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import AuthContext from "../../../contexts/AuthContext";
import { taskService, projectService, userService } from "../../../services";
import {
  addDays,
  addMonths,
  buildEmployeeItems,
  buildEmployeeOptions,
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
import { getScheduleDemoData } from "../../../utils/scheduleDemo";

const RANGE_DAYS = 42; // 6 weeks — covers any month with week alignment
const ROW_HEIGHT = 64;
const WEEK_HEADER_HEIGHT = 32;
const DAY_HEADER_HEIGHT = 48;
const HEADER_HEIGHT = WEEK_HEADER_HEIGHT + DAY_HEADER_HEIGHT;
const SIDEBAR_WIDTH = 150;
const BASE_DAY_WIDTH = 72;
const MIN_DAY_WIDTH = 18; // zoom out far enough to see the whole range
const MAX_DAY_WIDTH = 200; // zoom in to a single day comfortably
const ZOOM_STEP = 1.3;
const BAR_RADIUS = 16;
// Dev-only preview with fake, varied data. Never true in production
// (guarded by __DEV__ at the call site); flip to preview colors locally.
const SCHEDULE_DEMO = false;

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState("employees");
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [dayWidth, setDayWidth] = useState(BASE_DAY_WIDTH);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null); // 'project' | 'status'

  // Frozen header (horizontal) and sidebar (vertical) are driven by the
  // timeline body's scroll so the three panes stay aligned.
  const headerScrollRef = useRef(null);
  const sidebarScrollRef = useRef(null);
  const bodyHScrollRef = useRef(null);
  const bodyVScrollRef = useRef(null);

  const loadData = useCallback(async () => {
    if (__DEV__ && SCHEDULE_DEMO) {
      const demo = getScheduleDemoData();
      setTasks(demo.tasks);
      setProjects(demo.projects);
      setWorkers(demo.workers);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const role = user?.role;
      const companyId = user?.companyId;

      const projectRequest =
        role === "superadmin"
          ? projectService.getAll()
          : role === "companyAdmin" && companyId
            ? projectService.getByCompany(companyId)
            : projectService.getMyProjects();

      // Company users (with names) so worker rows resolve to real names.
      const userRequest =
        role === "superadmin"
          ? userService.getAll()
          : userService.getMyCompanyUsers();

      const [taskData, projectData, workerData] = await Promise.all([
        taskService.getAll().catch(() => []),
        projectRequest.catch(() => []),
        userRequest.catch(() => []),
      ]);

      setTasks(Array.isArray(taskData) ? taskData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);
      setWorkers(Array.isArray(workerData) ? workerData : []);
    } catch (error) {
      console.error("Failed to load schedule data:", error);
      setTasks([]);
      setProjects([]);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

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
        map[row.id] = buildEmployeeItems(filteredTasks, projectMap, row.id);
      } else {
        const spanItem = buildProjectSpanItem(projectMap[row.id], index);
        map[row.id] = spanItem ? [spanItem] : [];
      }
    });
    return map;
  }, [mode, rows, filteredTasks, projectMap]);

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

  const contentHeight = Math.max(rows.length, 1) * ROW_HEIGHT;

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
    headerScrollRef.current?.scrollTo({
      x: event.nativeEvent.contentOffset.x,
      animated: false,
    });
  };

  const onBodyVerticalScroll = (event) => {
    sidebarScrollRef.current?.scrollTo({
      y: event.nativeEvent.contentOffset.y,
      animated: false,
    });
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

    return (
      <View
        key={item.id}
        style={[
          styles.bar,
          {
            left,
            width: Math.max(width, 8),
            backgroundColor: item.color,
            borderTopLeftRadius: clippedLeft ? 0 : BAR_RADIUS,
            borderBottomLeftRadius: clippedLeft ? 0 : BAR_RADIUS,
            borderTopRightRadius: clippedRight ? 0 : BAR_RADIUS,
            borderBottomRightRadius: clippedRight ? 0 : BAR_RADIUS,
          },
        ]}
      >
        <Text numberOfLines={1} style={styles.barTitle}>
          {item.title}
        </Text>
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
      </View>
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
            {formatMonthLabel(currentMonth)}
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
          style={[
            styles.filterChip,
            selectedProjectIds.length > 0 && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter("project")}
          activeOpacity={0.85}
        >
          <Text numberOfLines={1} style={styles.filterChipText}>
            {projectChipLabel}
          </Text>
          <Icon name="chevron-down" size={16} color="#052D50" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedStatuses.length > 0 && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter("status")}
          activeOpacity={0.85}
        >
          <Text numberOfLines={1} style={styles.filterChipText}>
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
                  <View key={row.id} style={styles.sidebarCell}>
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
                      <View key={row.id} style={styles.timelineRow}>
                        {(itemsByRow[row.id] || []).map(renderBar)}
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

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    backgroundColor: "#EEEEEE",
  },
  header: {
    ...standardScreenHeader,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthLabel: {
    color: "#052D50",
    fontSize: 19,
    fontFamily: "DMSans-SemiBold",
  },
  todayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF50",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    marginTop: 12,
  },
  segmented: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: 8,
  },
  segment: {
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.12)",
  },
  segmentActive: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  segmentText: {
    fontSize: 16,
    color: "#052D50",
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontFamily: "DMSans-SemiBold",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#ECECEC",
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.12)",
  },
  filterChipActive: {
    borderColor: "#0091FF",
    backgroundColor: "rgba(0, 145, 255, 0.08)",
  },
  filterChipText: {
    flex: 1,
    color: "#052D50",
    fontSize: 14,
    fontFamily: "DMSans-Medium",
  },
  timelineCard: {
    flex: 1,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    color: "#698196",
    fontSize: 15,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  corner: {
    width: SIDEBAR_WIDTH,
    height: HEADER_HEIGHT,
    justifyContent: "flex-end",
    paddingLeft: 12,
    paddingBottom: 8,
    borderRightWidth: 1,
    borderRightColor: "rgba(5, 45, 80, 0.08)",
  },
  cornerText: {
    color: "#052D50",
    fontSize: 13,
    fontFamily: "DMSans-SemiBold",
  },
  weekHeaderRow: {
    flexDirection: "row",
    height: WEEK_HEADER_HEIGHT,
    alignItems: "center",
  },
  weekHeaderCell: {
    justifyContent: "center",
    paddingLeft: 8,
  },
  weekHeaderText: {
    color: "#052D50",
    fontSize: 13,
    fontFamily: "DMSans-SemiBold",
  },
  dayHeaderRow: {
    flexDirection: "row",
    height: DAY_HEADER_HEIGHT,
    alignItems: "center",
  },
  dayHeaderCell: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dayLabel: {
    color: "#698196",
    fontSize: 13,
    fontFamily: "DMSans-Medium",
  },
  dayTodayPill: {
    backgroundColor: "#1877F2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayTodayLabel: {
    color: "#FFFFFF",
  },
  bodyRow: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    borderRightColor: "rgba(5, 45, 80, 0.08)",
  },
  sidebarCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.05)",
  },
  sidebarName: {
    color: "#052D50",
    fontSize: 14,
    fontFamily: "DMSans-SemiBold",
  },
  sidebarSubtitle: {
    color: "#698196",
    fontSize: 12,
    marginTop: 1,
  },
  timelineRow: {
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.05)",
  },
  bar: {
    position: "absolute",
    top: 8,
    height: ROW_HEIGHT - 16,
    paddingHorizontal: 12,
    justifyContent: "center",
    overflow: "hidden",
  },
  barTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "DMSans-SemiBold",
  },
  barMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 3,
  },
  barMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 1,
  },
  barMetaItemFixed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  barMeta: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    flexShrink: 1,
  },
  gridLine: {
    position: "absolute",
    top: 0,
    width: 1,
    backgroundColor: "rgba(5, 45, 80, 0.05)",
  },
  todayLine: {
    position: "absolute",
    top: 0,
    width: 2,
    backgroundColor: "#1877F2",
  },
  zoomFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 128,
    alignItems: "center",
  },
  zoomGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(237, 237, 237, 0.96)",
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomValueBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.1)",
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  zoomValueText: {
    color: "#052D50",
    fontSize: 15,
    fontFamily: "DMSans-Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  modalTitle: {
    color: "#052D50",
    fontSize: 18,
    fontFamily: "DMSans-SemiBold",
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearText: {
    color: "#0091FF",
    fontSize: 15,
    fontFamily: "DMSans-Medium",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(5, 45, 80, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#0091FF",
    borderColor: "#0091FF",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.06)",
  },
  optionName: {
    color: "#052D50",
    fontSize: 16,
  },
});
