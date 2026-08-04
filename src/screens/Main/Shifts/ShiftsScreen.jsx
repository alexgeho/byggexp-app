import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
  Platform,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ProjectFilterSelector } from "../../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import AuthContext from "../../../contexts/AuthContext";
import { projectService, shiftService, userService } from "../../../services";
import Icon from "react-native-vector-icons/Feather";
import {
  buildExportMonthOptions,
  formatDateKey,
  formatDuration,
  formatDurationCompact,
  formatDurationShort,
  formatExportPickerDate,
  formatMonthLabel,
  formatTimeRange,
  formatShiftListProjectName,
  getAdjacentMonthKey,
  getCurrentMonthKey,
  getMonthDateRange,
  getTodayDateKey,
  parseDateKey,
  resolveUploadUrl,
} from "../../../utils/shifts";
import { buildCalendarLayout } from "../../../utils/shiftsCalendar";
import {
  getDocumentNameFromUrl,
  isImageDocument,
  isPdfDocument,
} from "../../../utils/documentPreview";
import { styles } from "./ShiftsScreen.styles";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EXPORT_PERIOD_TABS = ["Month", "Custom"];
const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "spinner" : "default";

// Which hours to show/bill by. GPS is the tracked timer duration (durationMs);
// planned (contract, from the hours module) and manual (worker-entered) are
// wired in once the backend exposes them per day. Colour-coded everywhere.
const HOURS_SOURCES = [
  { key: "planned", label: "Planned", sub: "contract", color: "#0785F4" },
  { key: "gps", label: "GPS", sub: "measured", color: "#12B76A" },
  { key: "manual", label: "Manual", sub: "worker", color: "#F59E0B" },
];

export default function ShiftsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const isAdmin = ["companyAdmin", "superadmin", "projectAdmin"].includes(
    user?.role,
  );
  const weekdayLabels = t("shifts.weekdays", { returnObjects: true });
  const exportBottomSheetRef = useRef(null);
  const periodBottomSheetRef = useRef(null);
  const filterBottomSheetRef = useRef(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [days, setDays] = useState([]);
  const [currentMonthDuration, setCurrentMonthDuration] = useState(0);
  const [previousMonthDuration, setPreviousMonthDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedExportType, setSelectedExportType] = useState("pdf");
  const [exportPeriodTab, setExportPeriodTab] = useState("Month");
  const [exportFromMonth, setExportFromMonth] = useState("");
  const [exportToMonth, setExportToMonth] = useState("");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [datePickerTarget, setDatePickerTarget] = useState(null);
  const [exportPeriodApplied, setExportPeriodApplied] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Admin filters: scope the calendar + export to a project and/or people.
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterProjectId, setFilterProjectId] = useState(null);
  const [filterWorkerIds, setFilterWorkerIds] = useState([]);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [hoursSource, setHoursSource] = useState("gps");
  // Worker manual-hours editor: the shift being edited, its hh/mm inputs, and
  // the in-flight save flag.
  const [manualHoursShift, setManualHoursShift] = useState(null);
  const [manualHoursH, setManualHoursH] = useState("");
  const [manualHoursM, setManualHoursM] = useState("");
  const [savingManualHours, setSavingManualHours] = useState(false);

  const currentUserId = user?.id || user?._id || null;

  const sourceMeta =
    HOURS_SOURCES.find((s) => s.key === hoursSource) || HOURS_SOURCES[1];
  // Duration for a day entry under the current source. GPS = tracked timer;
  // planned/manual read their own field once the backend provides it.
  const daySourceMs = useCallback(
    (entry) =>
      hoursSource === "gps"
        ? Number(entry?.totalDurationMs) || 0
        : Number(entry?.[`${hoursSource}DurationMs`]) || 0,
    [hoursSource],
  );

  const workerIdsParam = filterWorkerIds.length
    ? filterWorkerIds.join(",")
    : undefined;

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  const loadMonths = useCallback(async () => {
    const months = await shiftService.getMonths();
    setAvailableMonths(months);
    return months;
  }, []);

  const loadHistory = useCallback(
    async (month) => {
      const data = await shiftService.getHistory({
        ...(month ? { month } : {}),
        ...(filterProjectId ? { projectId: filterProjectId } : {}),
        ...(workerIdsParam ? { workerIds: workerIdsParam } : {}),
      });
      setAvailableMonths(data.availableMonths || []);
      setCurrentMonthDuration(data.monthTotalDurationMs || 0);
      setPreviousMonthDuration(data.previousMonthTotalDurationMs || 0);
      setDays(data.days || []);
      setSelectedMonth(data.month);
      setSelectedDates((previousDates) =>
        previousDates.filter((date) =>
          (data.days || []).some((day) => day.date === date),
        ),
      );
    },
    [filterProjectId, workerIdsParam],
  );

  const refreshHistory = useCallback(
    async (preferredMonth) => {
      try {
        setLoading(true);
        await loadMonths();
        const nextMonth = preferredMonth || getCurrentMonthKey();
        await loadHistory(nextMonth);
      } catch (error) {
        console.error("Failed to load shifts history:", error);
        setDays([]);
        setAvailableMonths([]);
        setSelectedDates([]);
      } finally {
        setLoading(false);
      }
    },
    [loadHistory, loadMonths],
  );

  useFocusEffect(
    useCallback(() => {
      refreshHistory(selectedMonth);
    }, [refreshHistory, selectedMonth]),
  );

  // Load projects + colleagues so admins can filter the export by project/people.
  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    let active = true;
    Promise.all([
      (user?.role === "superadmin"
        ? projectService.getAll()
        : projectService.getMyProjects()
      ).catch(() => []),
      userService.getColleagues().catch(() => []),
    ]).then(([projectData, employeeData]) => {
      if (!active) {
        return;
      }
      setProjects(Array.isArray(projectData) ? projectData : []);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    });
    return () => {
      active = false;
    };
  }, [isAdmin, user?.role]);

  // Re-pull the calendar when the admin filters change.
  useEffect(() => {
    refreshHistory(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProjectId, workerIdsParam]);

  const dayMap = useMemo(() => {
    const map = new Map();
    days.forEach((day) => map.set(day.date, day));
    return map;
  }, [days]);

  const selectedShifts = useMemo(() => {
    const shifts = [];

    selectedDates.forEach((date) => {
      const day = dayMap.get(date);
      (day?.shifts || []).forEach((shift) => {
        shifts.push({ ...shift, date });
      });
    });

    return shifts.sort((left, right) => {
      const leftTime = new Date(left.startedAt || 0).getTime();
      const rightTime = new Date(right.startedAt || 0).getTime();
      return leftTime - rightTime;
    });
  }, [dayMap, selectedDates]);

  const selectionSummary = useMemo(() => {
    if (!selectedDates.length) {
      return null;
    }

    const totalDurationMs = selectedDates.reduce((total, date) => {
      const day = dayMap.get(date);
      if (!day) {
        return total;
      }

      return (
        total +
        (day.totalDurationMs ??
          (day.shifts || []).reduce(
            (dayTotal, shift) => dayTotal + (shift.durationMs || 0),
            0,
          ))
      );
    }, 0);

    return { totalDurationMs, dayCount: selectedDates.length };
  }, [dayMap, selectedDates]);

  // Hero total under the active source: selected days, else the whole month.
  const heroValueMs = useMemo(() => {
    if (selectedDates.length) {
      return selectedDates.reduce(
        (sum, date) => sum + daySourceMs(dayMap.get(date)),
        0,
      );
    }
    if (hoursSource === "gps") {
      return currentMonthDuration;
    }
    let sum = 0;
    dayMap.forEach((entry, key) => {
      if (selectedMonth && key.startsWith(selectedMonth)) {
        sum += daySourceMs(entry);
      }
    });
    return sum;
  }, [
    selectedDates,
    dayMap,
    daySourceMs,
    hoursSource,
    currentMonthDuration,
    selectedMonth,
  ]);

  const toggleDateGroup = useCallback((dates) => {
    if (!dates.length) {
      return;
    }

    setSelectedDates((previousDates) => {
      const allSelected = dates.every((date) => previousDates.includes(date));

      if (allSelected) {
        return previousDates.filter((date) => !dates.includes(date));
      }

      return Array.from(new Set([...previousDates, ...dates])).sort();
    });
  }, []);

  const toggleSelectedDate = useCallback(
    (dateStr) => {
      toggleDateGroup([dateStr]);
    },
    [toggleDateGroup],
  );

  const clearSelectedDates = useCallback(() => {
    setSelectedDates([]);
  }, []);

  const calendarLayout = useMemo(
    () => buildCalendarLayout(selectedMonth),
    [selectedMonth],
  );

  const toggleWeekdayColumn = useCallback(
    (columnIndex) => {
      toggleDateGroup(calendarLayout.columnDates[columnIndex] || []);
    },
    [calendarLayout.columnDates, toggleDateGroup],
  );

  const toggleWeekRow = useCallback(
    (rowIndex) => {
      toggleDateGroup(calendarLayout.rowDates[rowIndex] || []);
    },
    [calendarLayout.rowDates, toggleDateGroup],
  );

  const calendarRows = useMemo(() => {
    return calendarLayout.rows.map((row) => (
      <View key={`row-${row.rowIndex}`} style={styles.calendarRow}>
        <TouchableOpacity
          style={styles.calendarWeekNumberCell}
          onPress={() => toggleWeekRow(row.rowIndex)}
          activeOpacity={0.85}
        >
          <Text style={styles.calendarWeekNumberText}>{row.weekNumber}</Text>
        </TouchableOpacity>
        <View style={styles.calendarDaysRow}>
          {row.cells.map((dateStr, columnIndex) => {
            if (!dateStr) {
              return (
                <View
                  key={`empty-${row.rowIndex}-${columnIndex}`}
                  style={styles.calendarCellEmpty}
                />
              );
            }

            const day = Number(dateStr.split("-")[2]);
            const shiftDay = dayMap.get(dateStr);
            const sourceMs = daySourceMs(shiftDay);
            const isSelected = selectedDates.includes(dateStr);
            const isToday = dateStr === todayDateKey;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calendarCell,
                  sourceMs > 0 &&
                    !isSelected && {
                      backgroundColor: `${sourceMeta.color}1A`,
                    },
                  isToday && !isSelected && styles.calendarCellToday,
                  isSelected && styles.calendarCellSelected,
                ]}
                onPress={() => toggleSelectedDate(dateStr)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.calendarDay,
                    isToday && !isSelected && styles.calendarDayToday,
                    isSelected && styles.calendarDaySelected,
                  ]}
                >
                  {day}
                </Text>
                {sourceMs > 0 ? (
                  <Text
                    style={[
                      styles.calendarHours,
                      !isSelected && { color: sourceMeta.color },
                    ]}
                  >
                    {formatDurationShort(sourceMs)}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ));
  }, [
    calendarLayout.rows,
    dayMap,
    selectedDates,
    todayDateKey,
    toggleSelectedDate,
    toggleWeekRow,
    daySourceMs,
    sourceMeta.color,
  ]);

  const handleOpenShiftPhoto = useCallback(
    async (photo) => {
      const resolvedUrl = resolveUploadUrl(photo?.url);
      const documentName =
        photo?.name ||
        getDocumentNameFromUrl(resolvedUrl, t("shifts.shiftPhoto"));

      if (!resolvedUrl) {
        Alert.alert(
          t("project.documentUnavailableTitle"),
          t("project.documentUnavailableMessage"),
        );
        return;
      }

      const document = {
        url: resolvedUrl,
        name: documentName,
        mimeType: photo?.mimeType || "",
        isImage: isImageDocument({
          url: resolvedUrl,
          name: documentName,
          mimeType: photo?.mimeType,
        }),
      };

      try {
        if (document.isImage || isPdfDocument(document)) {
          navigation.navigate("DocumentPreview", { document });
          return;
        }

        await Linking.openURL(resolvedUrl);
      } catch (error) {
        console.error("Failed to open shift photo:", error);
        Alert.alert(t("project.openErrorTitle"), t("project.openErrorMessage"));
      }
    },
    [navigation, t],
  );

  const canGoBackMonth = Boolean(selectedMonth);
  const canGoForwardMonth = Boolean(
    selectedMonth && selectedMonth < currentMonthKey,
  );

  const handleChangeMonth = useCallback(
    async (delta) => {
      if (!selectedMonth) {
        return;
      }

      const nextMonth = getAdjacentMonthKey(selectedMonth, delta);
      if (!nextMonth) {
        return;
      }

      if (delta > 0 && nextMonth > currentMonthKey) {
        return;
      }

      await refreshHistory(nextMonth);
    },
    [currentMonthKey, refreshHistory, selectedMonth],
  );

  const exportPeriodLabel = useMemo(() => {
    if (!exportPeriodApplied) {
      return t("shifts.selectPeriod");
    }

    if (exportPeriodTab === "Month") {
      if (exportFromMonth === exportToMonth) {
        return formatMonthLabel(exportFromMonth);
      }

      return `${formatMonthLabel(exportFromMonth)} – ${formatMonthLabel(exportToMonth)}`;
    }

    if (exportFromDate === exportToDate) {
      return formatExportPickerDate(exportFromDate);
    }

    return `${formatExportPickerDate(exportFromDate)} – ${formatExportPickerDate(exportToDate)}`;
  }, [
    exportFromDate,
    exportFromMonth,
    exportPeriodApplied,
    exportPeriodTab,
    exportToDate,
    exportToMonth,
    t,
  ]);

  const closeExportSheet = useCallback(() => {
    exportBottomSheetRef.current?.close();
  }, []);

  const closePeriodSheet = useCallback(() => {
    setDatePickerTarget(null);
    periodBottomSheetRef.current?.close();
  }, []);

  const openFilterSheet = useCallback(() => {
    filterBottomSheetRef.current?.expand();
  }, []);

  const closeFilterSheet = useCallback(() => {
    filterBottomSheetRef.current?.close();
  }, []);

  const clearFilters = useCallback(() => {
    setFilterProjectId(null);
    setFilterWorkerIds([]);
    setExportPeriodApplied(false);
    setSelectedDates([]);
  }, []);

  const openPeriodSheet = useCallback(() => {
    setDatePickerTarget(null);

    if (!exportFromMonth) {
      const monthKey = getCurrentMonthKey();
      setExportFromMonth(monthKey);
      setExportToMonth(monthKey);
    }

    if (!exportFromDate) {
      const today = getTodayDateKey();
      setExportFromDate(today);
      setExportToDate(today);
    }

    periodBottomSheetRef.current?.expand();
  }, [exportFromDate, exportFromMonth]);

  const getPeriodExportRange = useCallback(() => {
    if (exportPeriodTab === "Month") {
      if (!exportFromMonth || !exportToMonth) {
        return null;
      }

      if (exportFromMonth > exportToMonth) {
        return null;
      }

      return {
        from: getMonthDateRange(exportFromMonth).from,
        to: getMonthDateRange(exportToMonth).to,
      };
    }

    if (!exportFromDate || !exportToDate || exportFromDate > exportToDate) {
      return null;
    }

    return {
      from: exportFromDate,
      to: exportToDate,
    };
  }, [
    exportFromDate,
    exportFromMonth,
    exportPeriodTab,
    exportToDate,
    exportToMonth,
  ]);

  // The period sheet only *picks* a period — the export itself runs from the
  // bottom Export button (see handleExport). Applying a period clears any
  // ad-hoc day selection so there's a single, unambiguous export target.
  const applyPeriod = useCallback(() => {
    if (exportPeriodTab === "Month") {
      if (!exportFromMonth || !exportToMonth) {
        Alert.alert(
          t("shiftHistory.invalidPeriodTitle"),
          t("shifts.chooseBothMonths"),
        );
        return;
      }

      if (exportFromMonth > exportToMonth) {
        Alert.alert(
          t("shiftHistory.invalidPeriodTitle"),
          t("shifts.fromMonthBeforeTo"),
        );
        return;
      }
    } else if (!exportFromDate || !exportToDate) {
      Alert.alert(
        t("shiftHistory.invalidPeriodTitle"),
        t("shifts.chooseBothDates"),
      );
      return;
    } else if (exportFromDate > exportToDate) {
      Alert.alert(
        t("shiftHistory.invalidPeriodTitle"),
        t("shiftHistory.invalidPeriodMessage"),
      );
      return;
    }

    const range = getPeriodExportRange();
    if (!range) {
      Alert.alert(
        t("shiftHistory.invalidPeriodTitle"),
        t("shifts.chooseValidPeriod"),
      );
      return;
    }

    setSelectedDates([]);
    setExportPeriodApplied(true);
    closePeriodSheet();
  }, [
    closePeriodSheet,
    exportFromDate,
    exportFromMonth,
    exportPeriodTab,
    exportToDate,
    exportToMonth,
    getPeriodExportRange,
    t,
  ]);

  const exportMonthOptions = useMemo(
    () =>
      buildExportMonthOptions(availableMonths, [
        exportFromMonth,
        exportToMonth,
        selectedMonth,
      ]),
    [availableMonths, exportFromMonth, exportToMonth, selectedMonth],
  );

  const openExportSheet = useCallback(() => {
    if (!selectedDates.length && !exportPeriodApplied) {
      Alert.alert(t("shifts.noDatesTitle"), t("shifts.noDatesMessage"));
      return;
    }

    setSelectedExportType("pdf");
    exportBottomSheetRef.current?.expand();
  }, [exportPeriodApplied, selectedDates]);

  const renderSheetBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.59}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleCustomDateChange = useCallback(
    (_event, date) => {
      if (!datePickerTarget || !date) {
        return;
      }

      const formattedDate = formatDateKey(date);
      if (datePickerTarget === "from") {
        setExportFromDate(formattedDate);
      } else {
        setExportToDate(formattedDate);
      }
    },
    [datePickerTarget],
  );

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }

    // An applied period exports by range; otherwise export the selected days.
    const usePeriod = exportPeriodApplied && !selectedDates.length;
    const range = usePeriod ? getPeriodExportRange() : null;

    if (usePeriod && !range) {
      Alert.alert(
        t("shiftHistory.invalidPeriodTitle"),
        t("shifts.chooseValidPeriod"),
      );
      return;
    }

    if (!usePeriod && !selectedDates.length) {
      Alert.alert(t("shifts.noDatesTitle"), t("shifts.noDatesMessage"));
      return;
    }

    const sortedDates = [...selectedDates].sort();

    try {
      setExporting(true);
      await shiftService.exportReport({
        format: selectedExportType,
        hoursSource,
        ...(usePeriod
          ? { from: range.from, to: range.to }
          : { dates: sortedDates.join(",") }),
        ...(filterProjectId ? { projectId: filterProjectId } : {}),
        ...(workerIdsParam ? { workerIds: workerIdsParam } : {}),
      });
      closeExportSheet();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("shiftHistory.exportError");
      Alert.alert(t("shiftHistory.exportFailedTitle"), message);
    } finally {
      setExporting(false);
    }
  }, [
    closeExportSheet,
    exportPeriodApplied,
    exporting,
    getPeriodExportRange,
    hoursSource,
    selectedDates,
    selectedExportType,
  ]);

  const openManualHoursEditor = useCallback((shift) => {
    const ms = Number(shift?.manualDurationMs) || 0;
    const totalMinutes = Math.round(ms / 60000);
    setManualHoursH(ms ? String(Math.floor(totalMinutes / 60)) : "");
    setManualHoursM(ms ? String(totalMinutes % 60) : "");
    setManualHoursShift(shift);
  }, []);

  const closeManualHoursEditor = useCallback(() => {
    setManualHoursShift(null);
  }, []);

  const submitManualHours = useCallback(
    async (durationMs) => {
      if (!manualHoursShift) {
        return;
      }

      try {
        setSavingManualHours(true);
        await shiftService.setManualHours(manualHoursShift.id, durationMs);
        setManualHoursShift(null);
        await loadHistory(selectedMonth);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("shifts.manualHoursError");
        Alert.alert(t("shifts.manualHoursError"), message);
      } finally {
        setSavingManualHours(false);
      }
    },
    [loadHistory, manualHoursShift, selectedMonth, t],
  );

  const saveManualHours = useCallback(() => {
    const hours = parseInt(manualHoursH || "0", 10) || 0;
    const minutes = parseInt(manualHoursM || "0", 10) || 0;

    if (minutes > 59) {
      Alert.alert(t("shifts.manualHoursError"), t("shifts.manualHoursInvalid"));
      return;
    }

    const durationMs = (hours * 60 + minutes) * 60000;

    if (durationMs > 24 * 60 * 60000) {
      Alert.alert(t("shifts.manualHoursError"), t("shifts.manualHoursTooLong"));
      return;
    }

    submitManualHours(durationMs);
  }, [manualHoursH, manualHoursM, submitManualHours, t]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily["semiBold"] },
          ]}
        >
          {t("menu.workShifts")}
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterSheet}
          activeOpacity={0.85}
        >
          <Icon name="sliders" size={20} color="#052D50" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0088FF" />
        </View>
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Planned / GPS / Manual — the source that drives numbers & colours */}
          <View style={styles.sourceToggle}>
            {HOURS_SOURCES.map((s) => {
              const on = s.key === hoursSource;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sourceBtn, on && styles.sourceBtnOn]}
                  onPress={() => setHoursSource(s.key)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.sourceBtnText,
                      {
                        fontFamily:
                          theme.text.fontFamily[on ? "semiBold" : "medium"],
                      },
                      on && { color: s.color },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Single minimalist summary, coloured by the active source */}
          <View style={styles.selectionSummaryCard}>
            <View style={styles.selectionSummaryStat}>
              <Text
                style={[
                  styles.selectionSummaryValue,
                  {
                    fontFamily: theme.text.fontFamily["semiBold"],
                    color: sourceMeta.color,
                  },
                ]}
              >
                {formatDurationCompact(heroValueMs)}
              </Text>
              <Text style={styles.selectionSummaryLabel}>
                {selectedDates.length
                  ? t("shifts.selected")
                  : t("shifts.currentMonth")}
              </Text>
            </View>

            <View style={styles.selectionSummaryDivider} />

            <View style={styles.selectionSummaryStat}>
              <Text
                style={[
                  styles.selectionSummaryValue,
                  { fontFamily: theme.text.fontFamily["semiBold"] },
                ]}
              >
                {selectedDates.length
                  ? t("shifts.dayCount", {
                      count: selectionSummary?.dayCount || 0,
                    })
                  : formatDurationCompact(previousMonthDuration)}
              </Text>
              <Text style={styles.selectionSummaryLabel}>
                {selectedDates.length
                  ? t("shifts.selected")
                  : t("shifts.previousMonth")}
              </Text>
            </View>

            {selectedDates.length ? (
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={clearSelectedDates}
                activeOpacity={0.85}
              >
                <Icon name="x" size={18} color="#698196" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.calendarMonthBar}>
              <View style={styles.calendarNav}>
                <TouchableOpacity
                  style={[
                    styles.calendarNavButton,
                    !canGoBackMonth && styles.calendarNavButtonDisabled,
                  ]}
                  onPress={() => handleChangeMonth(-1)}
                  disabled={!canGoBackMonth}
                  activeOpacity={0.85}
                >
                  <Icon name="chevron-left" size={16} color="#0177DE" />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.calendarNavLabel,
                    { fontFamily: theme.text.fontFamily["semiBold"] },
                  ]}
                >
                  {selectedMonth ? formatMonthLabel(selectedMonth) : ""}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.calendarNavButton,
                    !canGoForwardMonth && styles.calendarNavButtonDisabled,
                  ]}
                  onPress={() => handleChangeMonth(1)}
                  disabled={!canGoForwardMonth}
                  activeOpacity={0.85}
                >
                  <Icon name="chevron-right" size={16} color="#0177DE" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.calendarHeader}>
              <View style={styles.calendarWeekHeaderCell} />
              <View style={styles.calendarDaysHeader}>
                {WEEKDAY_LABELS.map((label, columnIndex) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.calendarHeaderDayButton}
                    onPress={() => toggleWeekdayColumn(columnIndex)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.calendarHeaderDay}>
                      {(Array.isArray(weekdayLabels)
                        ? weekdayLabels[columnIndex]
                        : null) || label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {calendarRows.length ? (
              calendarRows
            ) : (
              <Text style={styles.emptyMonthText}>
                {t("shifts.emptyMonth")}
              </Text>
            )}
          </View>

          <View style={styles.shiftDetailsContainer}>
            <View style={styles.shiftDetailsContent}>
              {selectedDates.length === 0 ? (
                <Text style={styles.emptyDetailsText}>
                  {t("shifts.selectDatesHint")}
                </Text>
              ) : selectedShifts.length === 0 ? (
                <Text style={styles.emptyDetailsText}>
                  {t("shifts.noShiftsSelected")}
                </Text>
              ) : (
                selectedShifts.map((shift) => {
                  return (
                    <View key={shift.id} style={styles.shiftCard}>
                      {isAdmin && shift.workerName ? (
                        <Text style={styles.shiftWorkerName} numberOfLines={1}>
                          {shift.workerName}
                        </Text>
                      ) : null}
                      <View style={styles.shiftTimeRow}>
                        <Text
                          style={[
                            styles.shiftTimeText,
                            { fontFamily: theme.text.fontFamily["regular"] },
                          ]}
                        >
                          {formatTimeRange(shift.startedAt, shift.endedAt)}
                        </Text>
                        <Text
                          style={[
                            styles.shiftDurationText,
                            { fontFamily: theme.text.fontFamily["medium"] },
                          ]}
                        >
                          {formatDuration(shift.durationMs)}
                        </Text>
                      </View>

                      <View style={styles.shiftExpandedContent}>
                        {shift.status === "completed" &&
                        String(shift.workerId) === String(currentUserId) ? (
                          <TouchableOpacity
                            style={styles.shiftDetailRow}
                            activeOpacity={0.7}
                            onPress={() => openManualHoursEditor(shift)}
                          >
                            <Text
                              style={[
                                styles.shiftDetailLabel,
                                {
                                  fontFamily: theme.text.fontFamily["regular"],
                                },
                              ]}
                            >
                              {t("shifts.manualHours")}
                            </Text>
                            <Text
                              style={[
                                styles.manualHoursValue,
                                {
                                  fontFamily:
                                    theme.text.fontFamily[
                                      shift.manualDurationMs != null
                                        ? "medium"
                                        : "regular"
                                    ],
                                },
                              ]}
                            >
                              {shift.manualDurationMs != null
                                ? formatDuration(shift.manualDurationMs)
                                : t("shifts.manualHoursAdd")}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        <View style={styles.shiftDetailRow}>
                          <Text
                            style={[
                              styles.shiftDetailLabel,
                              {
                                fontFamily: theme.text.fontFamily["regular"],
                              },
                            ]}
                          >
                            {t("createTask.projectLabel")}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.shiftDetailValue,
                              {
                                fontFamily: theme.text.fontFamily["regular"],
                              },
                            ]}
                          >
                            {formatShiftListProjectName(shift.projectName)}
                          </Text>
                        </View>
                        <View style={styles.shiftDetailRow}>
                          <Text
                            style={[
                              styles.shiftDetailLabel,
                              {
                                fontFamily: theme.text.fontFamily["regular"],
                              },
                            ]}
                          >
                            {t("createProject.location")}
                          </Text>
                          <Text
                            style={[
                              styles.shiftDetailValue,
                              {
                                fontFamily: theme.text.fontFamily["regular"],
                              },
                            ]}
                          >
                            {shift.location || "—"}
                          </Text>
                        </View>
                        <View style={styles.shiftDetailRow}>
                          <Text
                            style={[
                              styles.shiftDetailLabel,
                              {
                                fontFamily: theme.text.fontFamily["regular"],
                              },
                            ]}
                          >
                            {t("shifts.photos")}
                          </Text>
                          {shift.photos?.length ? (
                            <View style={styles.shiftPhotosValue}>
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.shiftPhotosScroll}
                                contentContainerStyle={
                                  styles.shiftPhotosScrollContent
                                }
                              >
                                {shift.photos.map((photo, index) => (
                                  <TouchableOpacity
                                    key={`${shift.id}-photo-${index}`}
                                    activeOpacity={0.85}
                                    onPress={() => handleOpenShiftPhoto(photo)}
                                  >
                                    <Image
                                      style={styles.shiftImage}
                                      source={{
                                        uri: resolveUploadUrl(photo.url),
                                      }}
                                    />
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          ) : (
                            <Text
                              style={[
                                styles.shiftDetailValue,
                                {
                                  fontFamily: theme.text.fontFamily["regular"],
                                },
                              ]}
                            >
                              {t("shifts.noPhotos")}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>
      )}

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={openExportSheet}
        showAddButton
        renderAddContent={() => (
          <Text style={styles.exportFabText}>{t("shiftHistory.export")}</Text>
        )}
        addButtonStyle={styles.exportFabButton}
      />

      <BottomSheet
        ref={filterBottomSheetRef}
        index={-1}
        enableDynamicSizing
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderSheetBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.filterSheetBody}>
            {isAdmin ? (
              <View style={styles.filterProjectWrap}>
                <ProjectFilterSelector
                  projects={projects}
                  selectedProjectId={filterProjectId}
                  onSelect={setFilterProjectId}
                />
              </View>
            ) : null}

            {isAdmin ? (
              <TouchableOpacity
                style={styles.filterRow}
                onPress={() => setEmployeePickerOpen(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.filterRowText} numberOfLines={1}>
                  {filterWorkerIds.length
                    ? t("shifts.employeesSelected", {
                        count: filterWorkerIds.length,
                      })
                    : t("shifts.allEmployees")}
                </Text>
                <Icon name="chevron-right" size={18} color="#052D50" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.filterRow}
              onPress={() => {
                closeFilterSheet();
                openPeriodSheet();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.filterRowText} numberOfLines={1}>
                {exportPeriodApplied
                  ? exportPeriodLabel
                  : t("shifts.selectPeriod")}
              </Text>
              <Icon name="chevron-right" size={18} color="#052D50" />
            </TouchableOpacity>

            <View style={styles.filterSheetButtons}>
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={clearFilters}
                activeOpacity={0.85}
              >
                <Text style={styles.clearFiltersText}>
                  {t("shifts.clearFilters")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveFiltersBtn}
                onPress={closeFilterSheet}
                activeOpacity={0.85}
              >
                <Text style={styles.saveFiltersText}>
                  {t("shifts.saveFilters")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet
        ref={exportBottomSheetRef}
        index={-1}
        enableDynamicSizing
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderSheetBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.exportSheetBody}>
            <Text
              style={[
                styles.exportSheetTitle,
                { fontFamily: theme.text.fontFamily["semiBold"] },
              ]}
            >
              {t("shifts.exportTitle")}
            </Text>

            <View style={styles.exportSheetCard}>
              <View style={styles.exportButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    selectedExportType === "pdf" && styles.exportButtonActive,
                  ]}
                  onPress={() => setSelectedExportType("pdf")}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.exportButtonText,
                      selectedExportType === "pdf" &&
                        styles.exportButtonTextActive,
                    ]}
                  >
                    PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    selectedExportType === "excel" && styles.exportButtonActive,
                  ]}
                  onPress={() => setSelectedExportType("excel")}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.exportButtonText,
                      selectedExportType === "excel" &&
                        styles.exportButtonTextActive,
                    ]}
                  >
                    Excel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.exportMainButton,
              exporting && styles.exportMainButtonDisabled,
            ]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.exportMainButtonText}>
                {t("shiftHistory.export")}
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet
        ref={periodBottomSheetRef}
        index={-1}
        enableDynamicSizing
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderSheetBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.exportSheetBody}>
            <Text
              style={[
                styles.exportSheetTitle,
                { fontFamily: theme.text.fontFamily["semiBold"] },
              ]}
            >
              {t("shiftHistory.periodLabel")}
            </Text>

            <View style={styles.periodTabs}>
              {EXPORT_PERIOD_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.periodTab,
                    exportPeriodTab === tab && styles.periodTabActive,
                  ]}
                  onPress={() => setExportPeriodTab(tab)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      exportPeriodTab === tab && styles.periodTabTextActive,
                    ]}
                  >
                    {t(`shifts.periodTabs.${tab.toLowerCase()}`, tab)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.periodCard}>
              {exportPeriodTab === "Month" ? (
                <View style={styles.dateContainer}>
                  <View style={styles.monthDateField}>
                    <Text style={styles.monthDateLabel}>
                      {t("shiftHistory.from")}
                    </Text>
                    <View style={styles.monthWheelContainer}>
                      <Picker
                        selectedValue={exportFromMonth}
                        onValueChange={setExportFromMonth}
                        style={styles.monthWheel}
                        itemStyle={styles.monthWheelItem}
                        selectionColor="rgb(245, 245, 245)"
                      >
                        {exportMonthOptions.map((month) => (
                          <Picker.Item
                            key={`from-${month}`}
                            label={formatMonthLabel(month)}
                            value={month}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.monthDateField}>
                    <Text style={styles.monthDateLabel}>
                      {t("shiftHistory.to")}
                    </Text>
                    <View style={styles.monthWheelContainer}>
                      <Picker
                        selectedValue={exportToMonth}
                        onValueChange={setExportToMonth}
                        style={styles.monthWheel}
                        itemStyle={styles.monthWheelItem}
                        selectionColor="rgb(245, 245, 245)"
                      >
                        {exportMonthOptions.map((month) => (
                          <Picker.Item
                            key={`to-${month}`}
                            label={formatMonthLabel(month)}
                            value={month}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.dateContainer}>
                  <View style={styles.monthDateField}>
                    <Text style={styles.monthDateLabel}>
                      {t("shiftHistory.from")}
                    </Text>
                    <TouchableOpacity
                      style={styles.dateValueCard}
                      onPress={() => setDatePickerTarget("from")}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dateValueText,
                          !exportFromDate && styles.dateValuePlaceholder,
                        ]}
                      >
                        {formatExportPickerDate(exportFromDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.monthDateField}>
                    <Text style={styles.monthDateLabel}>
                      {t("shiftHistory.to")}
                    </Text>
                    <TouchableOpacity
                      style={styles.dateValueCard}
                      onPress={() => setDatePickerTarget("to")}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dateValueText,
                          !exportToDate && styles.dateValuePlaceholder,
                        ]}
                      >
                        {formatExportPickerDate(exportToDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.exportMainButton}
            onPress={applyPeriod}
            activeOpacity={0.85}
          >
            <Text style={styles.exportMainButtonText}>
              {t("shifts.applyPeriod")}
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>

      <Modal
        visible={Boolean(datePickerTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerTarget(null)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <Text style={styles.datePickerTitle}>
              {datePickerTarget === "from"
                ? t("shiftHistory.fromDate")
                : t("shiftHistory.toDate")}
            </Text>
            <DateTimePicker
              value={parseDateKey(
                datePickerTarget === "from" ? exportFromDate : exportToDate,
              )}
              mode="date"
              display={DATE_PICKER_DISPLAY}
              onChange={handleCustomDateChange}
            />
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setDatePickerTarget(null)}
            >
              <Text style={styles.datePickerButtonText}>
                {t("common.done")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={employeePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEmployeePickerOpen(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.employeePickerCard}>
            <Text style={styles.datePickerTitle}>
              {t("shifts.selectEmployees")}
            </Text>
            <ScrollView style={styles.employeeList}>
              <TouchableOpacity
                style={styles.employeeRow}
                onPress={() => setFilterWorkerIds([])}
              >
                <Text style={styles.employeeName}>
                  {t("shifts.allEmployees")}
                </Text>
                {filterWorkerIds.length === 0 ? (
                  <Text style={styles.employeeCheck}>✓</Text>
                ) : null}
              </TouchableOpacity>
              {employees.map((emp) => {
                const id = String(emp._id || emp.id);
                const selected = filterWorkerIds.includes(id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.employeeRow}
                    onPress={() =>
                      setFilterWorkerIds((prev) =>
                        prev.includes(id)
                          ? prev.filter((x) => x !== id)
                          : [...prev, id],
                      )
                    }
                  >
                    <Text style={styles.employeeName} numberOfLines={1}>
                      {emp.name || emp.email}
                    </Text>
                    {selected ? (
                      <Text style={styles.employeeCheck}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setEmployeePickerOpen(false)}
            >
              <Text style={styles.datePickerButtonText}>
                {t("common.done")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(manualHoursShift)}
        transparent
        animationType="fade"
        onRequestClose={closeManualHoursEditor}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <Text style={styles.datePickerTitle}>
              {t("shifts.manualHoursTitle")}
            </Text>
            <Text style={styles.manualHoursHint}>
              {t("shifts.manualHoursHint")}
            </Text>

            <View style={styles.manualHoursInputs}>
              <View style={styles.manualHoursField}>
                <TextInput
                  style={styles.manualHoursInput}
                  value={manualHoursH}
                  onChangeText={(text) =>
                    setManualHoursH(text.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9BB0C1"
                  maxLength={2}
                />
                <Text style={styles.manualHoursUnit}>
                  {t("shifts.unitHour")}
                </Text>
              </View>
              <View style={styles.manualHoursField}>
                <TextInput
                  style={styles.manualHoursInput}
                  value={manualHoursM}
                  onChangeText={(text) =>
                    setManualHoursM(text.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9BB0C1"
                  maxLength={2}
                />
                <Text style={styles.manualHoursUnit}>
                  {t("shifts.unitMinute")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.datePickerButton,
                savingManualHours && styles.exportMainButtonDisabled,
              ]}
              onPress={saveManualHours}
              disabled={savingManualHours}
            >
              {savingManualHours ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.datePickerButtonText}>
                  {t("common.save")}
                </Text>
              )}
            </TouchableOpacity>

            {manualHoursShift?.manualDurationMs != null ? (
              <TouchableOpacity
                style={styles.manualHoursClearButton}
                onPress={() => submitManualHours(null)}
                disabled={savingManualHours}
              >
                <Text style={styles.manualHoursClearText}>
                  {t("shifts.manualHoursClear")}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.manualHoursCancelButton}
              onPress={closeManualHoursEditor}
              disabled={savingManualHours}
            >
              <Text style={styles.manualHoursCancelText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
