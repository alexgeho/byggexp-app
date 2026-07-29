import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  standardScreenHeaderPlaceholder,
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
  buildProjectItems,
  buildProjectMap,
  buildProjectOptions,
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
const BASE_DAY_WIDTH = 88;
const MIN_DAY_WIDTH = 44;
const MAX_DAY_WIDTH = 176;
const ZOOM_STEP = 1.25;
const BAR_RADIUS = 12;

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState("employees");
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [dayWidth, setDayWidth] = useState(BASE_DAY_WIDTH);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(320);

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

      const [taskData, projectData, workerData] = await Promise.all([
        taskService.getAll().catch(() => []),
        projectRequest.catch(() => []),
        userService.getWorkers().catch(() => []),
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

  const resourceOptions = useMemo(
    () =>
      mode === "employees"
        ? buildEmployeeOptions(projects, workers)
        : buildProjectOptions(projects),
    [mode, projects, workers],
  );

  // Keep a valid selection whenever the mode or the option list changes.
  useEffect(() => {
    if (!resourceOptions.length) {
      setSelectedResourceId(null);
      return;
    }
    setSelectedResourceId((previous) =>
      resourceOptions.some((option) => option.id === previous)
        ? previous
        : resourceOptions[0].id,
    );
  }, [resourceOptions]);

  const items = useMemo(() => {
    if (!selectedResourceId) {
      return [];
    }
    return mode === "employees"
      ? buildEmployeeItems(tasks, projectMap, selectedResourceId)
      : buildProjectItems(tasks, projectMap, selectedResourceId);
  }, [mode, tasks, projectMap, selectedResourceId]);

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
    () => Array.from({ length: RANGE_DAYS }, (_, index) => addDays(rangeStart, index)),
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

  const selectedResource = resourceOptions.find(
    (option) => option.id === selectedResourceId,
  );

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

  const renderBar = (item) => {
    const clampedStart = Math.max(item.start, rangeStartMs);
    const clampedEnd = Math.min(item.end, rangeEndMs);
    const visible = clampedEnd > clampedStart;
    const left = ((clampedStart - rangeStartMs) / DAY_MS) * dayWidth;
    const width = visible ? ((clampedEnd - clampedStart) / DAY_MS) * dayWidth : 0;
    // Square off the edge that runs past the visible range (flush like the
    // design), round the edges that fall inside it.
    const clippedLeft = item.start < rangeStartMs;
    const clippedRight = item.end > rangeEndMs;

    return (
      <View key={item.id} style={styles.row}>
        {visible ? (
          <View
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
        ) : null}
      </View>
    );
  };

  const contentHeight = Math.max(items.length, 1) * ROW_HEIGHT;

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
              style={[
                styles.segment,
                mode === value && styles.segmentActive,
              ]}
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

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setPickerOpen(true)}
        activeOpacity={0.85}
        disabled={!resourceOptions.length}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.dropdownText,
            !selectedResource && styles.dropdownPlaceholder,
          ]}
        >
          {selectedResource
            ? selectedResource.name
            : t(
                mode === "employees"
                  ? "schedule.selectEmployee"
                  : "schedule.selectProject",
              )}
        </Text>
        <Icon name="chevron-down" size={20} color="#052D50" />
      </TouchableOpacity>

      <View
        style={styles.timelineCard}
        onLayout={(event) =>
          setBodyHeight(
            Math.max(
              120,
              event.nativeEvent.layout.height -
                WEEK_HEADER_HEIGHT -
                DAY_HEADER_HEIGHT,
            ),
          )
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0091FF" />
          </View>
        ) : !selectedResource ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{t("schedule.noResources")}</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ width: timelineWidth }}>
              {/* Week header */}
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

              {/* Day header */}
              <View style={styles.dayHeaderRow}>
                {days.map((day) => {
                  const isToday =
                    startOfDay(day).getTime() === todayStart;
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

              {/* Body */}
              <ScrollView
                style={{ height: bodyHeight }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
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

                  {items.length ? (
                    items.map(renderBar)
                  ) : (
                    <View style={[styles.centered, { height: contentHeight }]}>
                      <Text style={styles.emptyText}>
                        {t("schedule.noItems")}
                      </Text>
                    </View>
                  )}

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
            </View>
          </ScrollView>
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

      {/* Resource picker */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {t(
                mode === "employees"
                  ? "schedule.selectEmployee"
                  : "schedule.selectProject",
              )}
            </Text>
            <FlatList
              data={resourceOptions}
              keyExtractor={(option) => option.id}
              renderItem={({ item: option }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    setSelectedResourceId(option.id);
                    setPickerOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionName}>{option.name}</Text>
                    {option.subtitle ? (
                      <Text style={styles.optionSubtitle}>
                        {option.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {option.id === selectedResourceId ? (
                    <Icon name="check" size={20} color="#0091FF" />
                  ) : null}
                </TouchableOpacity>
              )}
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
  placeholder: {
    ...standardScreenHeaderPlaceholder,
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
  dropdown: {
    marginTop: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: "#ECECEC",
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.12)",
  },
  dropdownText: {
    flex: 1,
    color: "#052D50",
    fontSize: 17,
    fontFamily: "DMSans-Medium",
  },
  dropdownPlaceholder: {
    color: "#698196",
    fontFamily: "DMSans-Regular",
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
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
  row: {
    height: ROW_HEIGHT,
    justifyContent: "center",
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
  optionTextWrap: {
    flex: 1,
  },
  optionName: {
    color: "#052D50",
    fontSize: 16,
  },
  optionSubtitle: {
    color: "#698196",
    fontSize: 13,
    marginTop: 2,
  },
});
