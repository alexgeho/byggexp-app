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
  Image,
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
import { API_BASE_URL } from "../../../services/api";
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
  parseMonthKey,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../../../utils/schedule";

const RANGE_DAYS = 42; // 6 weeks — covers any month with week alignment
const ROW_HEIGHT = 64;
const WEEK_HEADER_HEIGHT = 32;
const DAY_HEADER_HEIGHT = 48;
const HEADER_HEIGHT = WEEK_HEADER_HEIGHT + DAY_HEADER_HEIGHT;
const SIDEBAR_WIDTH = 120;
const BASE_DAY_WIDTH = 72;
const MIN_DAY_WIDTH = 40;
const MAX_DAY_WIDTH = 160;
const ZOOM_STEP = 1.25;
const BAR_RADIUS = 12;

const resolveAvatarUrl = (value) => {
  if (!value) {
    return null;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

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

  // Frozen header (horizontal) and sidebar (vertical) are driven by the
  // timeline body's scroll so the three panes stay aligned.
  const headerScrollRef = useRef(null);
  const sidebarScrollRef = useRef(null);
  const bodyHScrollRef = useRef(null);
  const bodyVScrollRef = useRef(null);

  const loadData = useCallback(async () => {
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

  const rows = useMemo(
    () =>
      mode === "employees"
        ? buildEmployeeOptions(projects, workers)
        : buildProjectOptions(projects),
    [mode, projects, workers],
  );

  // rowId -> array of bars for that row.
  const itemsByRow = useMemo(() => {
    const map = {};
    rows.forEach((row, index) => {
      if (mode === "employees") {
        map[row.id] = buildEmployeeItems(tasks, projectMap, row.id);
      } else {
        const spanItem = buildProjectSpanItem(projectMap[row.id], index);
        map[row.id] = spanItem ? [spanItem] : [];
      }
    });
    return map;
  }, [mode, rows, tasks, projectMap]);

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
      Array.from({ length: RANGE_DAYS }, (_, index) => addDays(rangeStart, index)),
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
        {item.subtitle ? (
          <Text numberOfLines={1} style={styles.barSubtitle}>
            {item.subtitle}
          </Text>
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
          <Text style={styles.monthLabel}>{formatMonthLabel(currentMonth)}</Text>
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
                  {t(mode === "employees" ? "schedule.employees" : "schedule.projects")}
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
                              {formatWeekdayLabel(day)} {day.getDate()}
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
                style={[styles.sidebar, bodyHeight ? { height: bodyHeight } : null]}
              >
                {rows.map((row) => (
                  <View key={row.id} style={styles.sidebarCell}>
                    {mode === "employees" ? (
                      <View style={styles.avatar}>
                        {row.avatarUrl ? (
                          <Image
                            source={{ uri: resolveAvatarUrl(row.avatarUrl) }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarInitial}>
                            {(row.name || "?").charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                    ) : null}
                    <View style={styles.sidebarTextWrap}>
                      <Text numberOfLines={1} style={styles.sidebarName}>
                        {row.name}
                      </Text>
                      {row.subtitle ? (
                        <Text numberOfLines={1} style={styles.sidebarSubtitle}>
                          {row.subtitle}
                        </Text>
                      ) : null}
                    </View>
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
                          { left: todayX + dayWidth / 2, height: contentHeight },
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
    fontSize: 17,
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
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  segmentActive: {
    backgroundColor: "#0091FF",
    borderColor: "#0091FF",
  },
  segmentText: {
    fontSize: 15,
    color: "#052D50",
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontFamily: "DMSans-SemiBold",
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
    backgroundColor: "#0091FF",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.05)",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 34,
    height: 34,
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
  },
  sidebarTextWrap: {
    flex: 1,
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
  barSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
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
    backgroundColor: "#0091FF",
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
