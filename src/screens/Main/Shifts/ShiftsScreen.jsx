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
  Alert,
  Linking,
  Platform,
  Keyboard,
  StyleSheet,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ProjectFilterSelector } from "../../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import AuthContext from "../../../contexts/AuthContext";
import { projectService, shiftService, userService } from "../../../services";
import { useShiftHistory } from "../../../hooks/useShiftHistory";
import Icon from "react-native-vector-icons/Feather";
import {
  buildExportMonthOptions,
  formatDateKey,
  formatDuration,
  formatExportPickerDate,
  formatMonthLabel,
  formatTimeRange,
  formatShiftListProjectName,
  getAdjacentMonthKey,
  getCurrentMonthKey,
  getMonthDateRange,
  getTodayDateKey,
  resolveUploadUrl,
} from "../../../utils/shifts";
import { buildCalendarLayout } from "../../../utils/shiftsCalendar";
import {
  getDocumentNameFromUrl,
  isImageDocument,
  isPdfDocument,
} from "../../../utils/documentPreview";
import { createStyles } from "./ShiftsScreen.styles";
import {
  EmployeePickerModal,
  ExportSheet,
  HoursSourceToggle,
  ManualHoursModal,
  PeriodSheet,
  SelectionSummary,
  ShiftCalendar,
} from "./ShiftsScreen.parts";

// Plain-Modal bottom sheet — replaces @gorhom/bottom-sheet, which hangs the JS
// thread on Android under the New Architecture (reanimated 4 / RN 0.81).
const createSheetStyles = (c) =>
  StyleSheet.create({
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingBottom: 28,
      maxHeight: "90%",
    },
  });

// Which hours to show/bill by. GPS is the tracked timer duration (durationMs);
// planned (contract, from the hours module) and manual (worker-entered) are
// wired in once the backend exposes them per day. Colour-coded everywhere.
const HOURS_SOURCES = [
  { key: "planned", label: "Planned", sub: "contract", color: "#0785F4" },
  { key: "manual", label: "Manual", sub: "worker", color: "#F59E0B" },
  { key: "gps", label: "GPS", sub: "measured", color: "#12B76A" },
];

export default function ShiftsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Guards the one-shot deep-link from a "log your hours" reminder push.
  const handledHoursEntryRef = useRef(false);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const sheetStyles = useMemo(
    () => createSheetStyles(theme.content),
    [theme.content],
  );
  const { user, selectedProject } = useContext(AuthContext);
  const isAdmin = ["companyAdmin", "superadmin", "projectAdmin"].includes(
    user?.role,
  );
  const weekdayLabels = t("shifts.weekdays", { returnObjects: true });
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
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
  // Multi-select mode for export. Off (default): a tap focuses one day (view).
  // On: taps accumulate days to export (iOS Photos-style "Select").
  const [selectMode, setSelectMode] = useState(false);
  const [hoursSource, setHoursSource] = useState("manual");
  // Worker manual-hours editor: the shift being edited, its hh/mm inputs, and
  // the in-flight save flag.
  const [manualHoursShift, setManualHoursShift] = useState(null);
  const [manualHoursH, setManualHoursH] = useState("");
  const [manualHoursM, setManualHoursM] = useState("");
  const [savingManualHours, setSavingManualHours] = useState(false);
  // Date-based manual entry (Manuell tab): log hours for a day that has no
  // clock-in. Holds the target date and the project to attach the hours to.
  const [manualDateEntry, setManualDateEntry] = useState(null);
  const [manualProjectId, setManualProjectId] = useState(null);
  // Inline in-cell manual entry: the date whose calendar cell is being typed
  // into, its seed text (defaultValue), and a ref holding the live text.
  const [inlineManualDate, setInlineManualDate] = useState(null);
  const [inlineManualSeed, setInlineManualSeed] = useState("");
  const inlineValueRef = useRef("");
  // True while saveAllManual is committing, so the input's onBlur (fired by the
  // Keyboard.dismiss inside the save) doesn't double-stash and resurrect a
  // just-saved day as pending.
  const batchSavingRef = useRef(false);
  // Unsaved manual hours keyed by date (hours as a number). Fill several days,
  // then the header check saves them all in one go.
  const [pendingManual, setPendingManual] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);
  // Scroll the edited day above the keyboard. calendarYRef = the calendar's
  // offset in the scroll content; rowYRef = each date's row offset within it.
  const scrollViewRef = useRef(null);
  const calendarYRef = useRef(0);
  const rowYRef = useRef({});
  const scrollViewHeightRef = useRef(0);
  const keyboardHeightRef = useRef(336);
  // Keyboard height as state so Android can pad the scroll content (iOS relies
  // on automaticallyAdjustKeyboardInsets instead).
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const currentUserId = user?.id || user?._id || null;

  // Manual hours attach ONLY to the explicitly selected project (app-wide
  // selectedProject) — never a silent projects[0] fallback, which let hours be
  // logged to a project the worker never chose. Null here means "no project
  // chosen", and callers must tell the worker to pick one first.
  const resolveManualProjectId = useCallback(
    () => selectedProject?._id || selectedProject?.id || null,
    [selectedProject],
  );

  // Track the keyboard height so we can park the edited day just above it and
  // give Android enough scroll room to lift the edited cell above the keyboard.
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => {
      const h = e.endCoordinates?.height || 336;
      keyboardHeightRef.current = h;
      setKeyboardHeight(h);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Once the keyboard is actually up, lift the edited day above it.
  useEffect(() => {
    if (!inlineManualDate || keyboardHeight <= 0) {
      return;
    }
    const rowY = rowYRef.current[inlineManualDate];
    if (rowY == null) {
      return;
    }
    const visibleAboveKb =
      (scrollViewHeightRef.current || 500) - keyboardHeight;
    const targetFromTop = Math.max(150, visibleAboveKb - 110);
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, calendarYRef.current + rowY - targetFromTop),
      animated: true,
    });
  }, [inlineManualDate, keyboardHeight]);

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

  const {
    loading,
    days,
    availableMonths,
    currentMonthDuration,
    previousMonthDuration,
    selectedMonth,
    setSelectedMonth,
    selectedDates,
    setSelectedDates,
    refreshHistory,
    loadHistory,
  } = useShiftHistory({ filterProjectId, workerIdsParam });

  // Load projects for everyone (admins filter the export by project; workers
  // pick one when logging manual hours) and colleagues for admins' people filter.
  useEffect(() => {
    let active = true;
    Promise.all([
      (user?.role === "superadmin"
        ? projectService.getAll()
        : projectService.getMyProjects()
      ).catch(() => []),
      isAdmin
        ? userService.getColleagues().catch(() => [])
        : Promise.resolve([]),
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

  const toggleDateGroup = useCallback(
    (dates) => {
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
    },
    [setSelectedDates],
  );

  const toggleSelectedDate = useCallback(
    (dateStr) => {
      toggleDateGroup([dateStr]);
    },
    [toggleDateGroup],
  );

  const clearSelectedDates = useCallback(() => {
    setSelectedDates([]);
  }, [setSelectedDates]);

  // Switching the hours source (Planned/Manual/GPS) must reset any day
  // selection: the selected days/hours belong to one source and carrying them
  // into another shows the wrong totals.
  const handleChangeHoursSource = useCallback(
    (key) => {
      if (key === hoursSource) {
        return;
      }
      setHoursSource(key);
      setSelectedDates([]);
      setSelectMode(false);
      setExportPeriodApplied(false);
    },
    [hoursSource, setSelectedDates],
  );

  // Begin typing hours straight into a day's calendar cell (Manuell tab). Seed
  // from a pending edit if present, else from what's already saved.
  const startInlineManual = useCallback(
    (dateStr) => {
      const pending = pendingManual[dateStr];
      const savedMs = Number(dayMap.get(dateStr)?.manualDurationMs) || 0;
      const hours =
        pending != null
          ? pending
          : savedMs
            ? Number((savedMs / 3600000).toFixed(2))
            : 0;
      const seed = hours ? String(hours).replace(".", ",") : "";
      inlineValueRef.current = seed;
      setInlineManualSeed(seed);
      setInlineManualDate(dateStr);

      // Park the edited day just above the keyboard (not jammed to the top).
      const rowY = rowYRef.current[dateStr];
      if (rowY != null) {
        setTimeout(() => {
          const visibleAboveKb =
            (scrollViewHeightRef.current || 500) - keyboardHeightRef.current;
          const targetFromTop = Math.max(150, visibleAboveKb - 110);
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, calendarYRef.current + rowY - targetFromTop),
            animated: true,
          });
        }, 300);
      }
    },
    [dayMap, pendingManual],
  );

  // Deep-link from a "log your hours" reminder push: switch to the Manual tab
  // and open today's cell for entry. Runs once, then clears the route param.
  useEffect(() => {
    if (!route.params?.openHoursEntry || handledHoursEntryRef.current) {
      return;
    }
    handledHoursEntryRef.current = true;
    setHoursSource("manual");
    startInlineManual(route.params.date || todayDateKey);
    navigation.setParams({ openHoursEntry: undefined, date: undefined });
  }, [
    route.params?.openHoursEntry,
    route.params?.date,
    startInlineManual,
    todayDateKey,
    navigation,
  ]);

  // Move the open cell's typed value into the pending map (no network). Dedups
  // against the saved value so unchanged days don't count as unsaved.
  const stashOpenInput = useCallback(() => {
    const dateStr = inlineManualDate;
    if (!dateStr || batchSavingRef.current) {
      return;
    }
    const raw = String(inlineValueRef.current || "")
      .replace(",", ".")
      .trim();
    const savedMs = Number(dayMap.get(dateStr)?.manualDurationMs) || 0;

    setPendingManual((prev) => {
      const next = { ...prev };
      if (raw === "") {
        // Empty clears to 0 only when there was a saved value to remove.
        if (savedMs > 0) {
          next[dateStr] = 0;
        } else {
          delete next[dateStr];
        }
        return next;
      }
      const hours = parseFloat(raw);
      if (!Number.isFinite(hours) || hours < 0) {
        delete next[dateStr];
        return next;
      }
      const capped = Math.min(hours, 24);
      if (Math.round(capped * 3600000) === savedMs) {
        delete next[dateStr]; // same as saved — nothing to save
      } else {
        next[dateStr] = capped;
      }
      return next;
    });
  }, [inlineManualDate, dayMap]);

  // The blue header check saves every pending day in one go (including the one
  // still open in the input).
  const saveAllManual = useCallback(async () => {
    batchSavingRef.current = true;
    Keyboard.dismiss();

    // Merge the currently-open cell into a local copy so we don't race the
    // async setPendingManual from stashOpenInput.
    const merged = { ...pendingManual };
    const openDate = inlineManualDate;
    if (openDate) {
      const raw = String(inlineValueRef.current || "")
        .replace(",", ".")
        .trim();
      const savedMs = Number(dayMap.get(openDate)?.manualDurationMs) || 0;
      if (raw === "") {
        if (savedMs > 0) merged[openDate] = 0;
        else delete merged[openDate];
      } else {
        const hours = parseFloat(raw);
        if (Number.isFinite(hours) && hours >= 0) {
          const capped = Math.min(hours, 24);
          if (Math.round(capped * 3600000) === savedMs) delete merged[openDate];
          else merged[openDate] = capped;
        }
      }
    }
    setInlineManualDate(null);

    const entries = Object.entries(merged);
    if (entries.length === 0) {
      setPendingManual({});
      batchSavingRef.current = false;
      return;
    }

    const projectId = resolveManualProjectId();
    if (!projectId) {
      Alert.alert(
        t("shifts.manualHoursError"),
        t("shifts.manualHoursNoProject"),
      );
      batchSavingRef.current = false;
      return;
    }

    try {
      setSavingBatch(true);
      for (const [date, hours] of entries) {
        const durationMs = Math.round(Number(hours) * 3600000);
        await shiftService.addManualHours({
          workerId: currentUserId,
          projectId,
          date,
          durationMs,
        });
      }
      setPendingManual({});
      await loadHistory(selectedMonth);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("shifts.manualHoursError");
      Alert.alert(t("shifts.manualHoursError"), message);
    } finally {
      setSavingBatch(false);
      batchSavingRef.current = false;
    }
  }, [
    pendingManual,
    inlineManualDate,
    dayMap,
    resolveManualProjectId,
    currentUserId,
    loadHistory,
    selectedMonth,
    t,
  ]);

  // Inline hour entry writes to the CURRENT user only (workerId: currentUserId),
  // so it's only meaningful when the day's subject is unambiguously "me": a
  // worker's own view, or an admin who filtered down to just themselves. For an
  // admin looking at the whole team a tap must never open self-entry.
  const canInlineEnter =
    hoursSource === "manual" &&
    (!isAdmin ||
      (filterWorkerIds.length === 1 &&
        String(filterWorkerIds[0]) === String(currentUserId)));

  // Tapping a day OPENS it (its shifts, photos and project show in the panel
  // below) — no keyboard, any half-typed cell is banked first. In select mode a
  // tap instead accumulates days for export; outside it a tap focuses a single
  // day (tapping the focused day again closes it).
  const handleDayPress = useCallback(
    (dateStr) => {
      if (inlineManualDate) {
        stashOpenInput();
        setInlineManualDate(null);
      }
      if (selectMode) {
        toggleSelectedDate(dateStr);
      } else {
        setSelectedDates((prev) =>
          prev.length === 1 && prev[0] === dateStr ? [] : [dateStr],
        );
      }
    },
    [
      inlineManualDate,
      stashOpenInput,
      selectMode,
      toggleSelectedDate,
      setSelectedDates,
    ],
  );

  // Entering/editing hours is a separate, explicit tap on the cell's hours/＋
  // area (only rendered when canInlineEnter). Banks the previously open cell.
  const handleEditDay = useCallback(
    (dateStr) => {
      if (inlineManualDate === dateStr) {
        return; // already editing this day — keep the typed value
      }
      stashOpenInput();
      startInlineManual(dateStr);
    },
    [inlineManualDate, stashOpenInput, startInlineManual],
  );

  const hasPendingManual = Object.keys(pendingManual).length > 0;

  const calendarLayout = useMemo(
    () => buildCalendarLayout(selectedMonth),
    [selectedMonth],
  );

  // Whole-column / whole-row selection is a multi-select shortcut, so it only
  // acts in select mode (outside it a tap focuses a single day).
  const toggleWeekdayColumn = useCallback(
    (columnIndex) => {
      if (!selectMode) return;
      toggleDateGroup(calendarLayout.columnDates[columnIndex] || []);
    },
    [selectMode, calendarLayout.columnDates, toggleDateGroup],
  );

  const toggleWeekRow = useCallback(
    (rowIndex) => {
      if (!selectMode) return;
      toggleDateGroup(calendarLayout.rowDates[rowIndex] || []);
    },
    [selectMode, calendarLayout.rowDates, toggleDateGroup],
  );

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
    setExportSheetOpen(false);
  }, []);

  const closePeriodSheet = useCallback(() => {
    setDatePickerTarget(null);
    setPeriodSheetOpen(false);
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

    setPeriodSheetOpen(true);
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

    // Jump the calendar to the chosen period's month and reload, so the grid
    // reflects the selection instead of staying on the current month.
    const targetMonth =
      exportPeriodTab === "Month" ? exportFromMonth : range.from.slice(0, 7);
    if (targetMonth) {
      setSelectedMonth(targetMonth);
      refreshHistory(targetMonth);
    }
  }, [
    closePeriodSheet,
    exportFromDate,
    exportFromMonth,
    exportPeriodTab,
    exportToDate,
    exportToMonth,
    getPeriodExportRange,
    refreshHistory,
    setSelectedDates,
    setSelectedMonth,
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
    // No date selection required: with nothing selected we export the current
    // month by default (see handleExport).
    setSelectedExportType("pdf");
    setExportSheetOpen(true);
  }, []);

  const handleCustomDateChange = useCallback(
    (_event, date) => {
      if (!date) {
        return;
      }

      // The wheel is always live on the Custom tab; when no field has been
      // tapped yet it edits "From" by default.
      const target = datePickerTarget || "from";
      const formattedDate = formatDateKey(date);
      if (target === "from") {
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

    // Nothing selected and no applied period → default to the current month.
    const useCurrentMonth = !usePeriod && !selectedDates.length;
    const monthRange = useCurrentMonth
      ? getMonthDateRange(selectedMonth || currentMonthKey)
      : null;

    const sortedDates = [...selectedDates].sort();

    try {
      setExporting(true);
      await shiftService.exportReport({
        format: selectedExportType,
        hoursSource,
        ...(usePeriod
          ? { from: range.from, to: range.to }
          : useCurrentMonth
            ? { from: monthRange.from, to: monthRange.to }
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
    currentMonthKey,
    exportPeriodApplied,
    exporting,
    getPeriodExportRange,
    hoursSource,
    selectedDates,
    selectedExportType,
    selectedMonth,
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
    setManualDateEntry(null);
  }, []);

  const submitManualDateHours = useCallback(
    async (durationMs) => {
      if (!manualDateEntry) {
        return;
      }
      if (!manualProjectId) {
        Alert.alert(
          t("shifts.manualHoursError"),
          t("shifts.manualHoursNoProject"),
        );
        return;
      }

      try {
        setSavingManualHours(true);
        await shiftService.addManualHours({
          workerId: currentUserId,
          projectId: manualProjectId,
          date: manualDateEntry.date,
          durationMs,
        });
        setManualDateEntry(null);
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
    [
      manualDateEntry,
      manualProjectId,
      currentUserId,
      loadHistory,
      selectedMonth,
      t,
    ],
  );

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

    if (manualDateEntry) {
      submitManualDateHours(durationMs);
    } else {
      submitManualHours(durationMs);
    }
  }, [
    manualHoursH,
    manualHoursM,
    manualDateEntry,
    submitManualDateHours,
    submitManualHours,
    t,
  ]);

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
        {hoursSource === "manual" && (inlineManualDate || hasPendingManual) ? (
          <TouchableOpacity
            style={styles.headerSaveButton}
            onPress={saveAllManual}
            activeOpacity={0.85}
            disabled={savingBatch}
          >
            {savingBatch ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="check" size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.headerSelectButton,
              selectMode && styles.headerSelectButtonActive,
            ]}
            onPress={() => setSelectMode((mode) => !mode)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.headerSelectText,
                selectMode && styles.headerSelectTextActive,
                { fontFamily: theme.text.fontFamily["semiBold"] },
              ]}
            >
              {selectMode ? t("shifts.selectDone") : t("shifts.selectDays")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0088FF" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.contentScrollContent,
            Platform.OS === "android" &&
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          onLayout={(e) => {
            scrollViewHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          {/* Planned / GPS / Manual — the source that drives numbers & colours */}
          <HoursSourceToggle
            sources={HOURS_SOURCES}
            hoursSource={hoursSource}
            setHoursSource={handleChangeHoursSource}
            styles={styles}
            mediumFontFamily={theme.text.fontFamily.medium}
            t={t}
          />

          <View style={styles.exportSelector}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={openPeriodSheet}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !exportPeriodApplied && styles.dropdownPlaceholderText,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {exportPeriodLabel}
              </Text>
              <Image
                style={styles.dropdownIcon}
                source={require("../../../assets/Arrow-down.png")}
              />
            </TouchableOpacity>
          </View>

          {isAdmin ? (
            <View style={styles.filtersRow}>
              <View style={styles.filterHalf}>
                <ProjectFilterSelector
                  projects={projects}
                  selectedProjectId={filterProjectId}
                  onSelect={setFilterProjectId}
                />
              </View>
              <View style={styles.filterHalf}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setEmployeePickerOpen(true)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      !filterWorkerIds.length && styles.dropdownPlaceholderText,
                      { fontFamily: theme.text.fontFamily.medium },
                    ]}
                    numberOfLines={1}
                  >
                    {filterWorkerIds.length
                      ? t("shifts.employeesSelected", {
                          count: filterWorkerIds.length,
                        })
                      : t("shifts.allEmployees")}
                  </Text>
                  <Image
                    style={styles.dropdownIcon}
                    source={require("../../../assets/Arrow-down.png")}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Single minimalist summary, coloured by the active source */}
          <SelectionSummary
            heroValueMs={heroValueMs}
            previousMonthDuration={previousMonthDuration}
            selectedDates={selectedDates}
            selectionSummary={selectionSummary}
            onClearSelection={clearSelectedDates}
            styles={styles}
            regularFontFamily={theme.text.fontFamily["regular"]}
            t={t}
          />

          {selectMode ? (
            <Text style={styles.selectModeHint} numberOfLines={1}>
              {t("shifts.selectDaysHint")}
            </Text>
          ) : null}

          <ShiftCalendar
            styles={styles}
            t={t}
            calendarYRef={calendarYRef}
            canGoBackMonth={canGoBackMonth}
            canGoForwardMonth={canGoForwardMonth}
            onPrevMonth={() => handleChangeMonth(-1)}
            onNextMonth={() => handleChangeMonth(1)}
            selectedMonth={selectedMonth}
            semiBoldFontFamily={theme.text.fontFamily["semiBold"]}
            weekdayLabels={weekdayLabels}
            onToggleColumn={toggleWeekdayColumn}
            calendarLayout={calendarLayout}
            dayMap={dayMap}
            selectedDates={selectedDates}
            todayDateKey={todayDateKey}
            onDayPress={handleDayPress}
            onEditDay={handleEditDay}
            canEditDay={canInlineEnter}
            selectMode={selectMode}
            onToggleWeekRow={toggleWeekRow}
            daySourceMs={daySourceMs}
            sourceColor={sourceMeta.color}
            hoursSource={hoursSource}
            inlineManualDate={inlineManualDate}
            inlineManualSeed={inlineManualSeed}
            inlineValueRef={inlineValueRef}
            onStashInput={stashOpenInput}
            pendingManual={pendingManual}
            rowYRef={rowYRef}
          />

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
                                    <ExpoImage
                                      style={styles.shiftImage}
                                      source={resolveUploadUrl(photo.url)}
                                      contentFit="cover"
                                      cachePolicy="memory-disk"
                                      transition={0}
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

      <ExportSheet
        visible={exportSheetOpen}
        onClose={() => setExportSheetOpen(false)}
        selectedExportType={selectedExportType}
        setSelectedExportType={setSelectedExportType}
        exporting={exporting}
        onExport={handleExport}
        hasSelection={selectedDates.length > 0 || exportPeriodApplied}
        styles={styles}
        sheetStyles={sheetStyles}
        titleFontFamily={theme.text.fontFamily["semiBold"]}
        t={t}
      />

      <PeriodSheet
        visible={periodSheetOpen}
        onClose={() => setPeriodSheetOpen(false)}
        exportPeriodTab={exportPeriodTab}
        setExportPeriodTab={setExportPeriodTab}
        exportFromMonth={exportFromMonth}
        setExportFromMonth={setExportFromMonth}
        exportToMonth={exportToMonth}
        setExportToMonth={setExportToMonth}
        exportMonthOptions={exportMonthOptions}
        exportFromDate={exportFromDate}
        exportToDate={exportToDate}
        datePickerTarget={datePickerTarget}
        setDatePickerTarget={setDatePickerTarget}
        onCustomDateChange={handleCustomDateChange}
        onApply={applyPeriod}
        styles={styles}
        sheetStyles={sheetStyles}
        titleFontFamily={theme.text.fontFamily["semiBold"]}
        t={t}
      />

      <EmployeePickerModal
        visible={employeePickerOpen}
        employees={employees}
        filterWorkerIds={filterWorkerIds}
        setFilterWorkerIds={setFilterWorkerIds}
        onClose={() => setEmployeePickerOpen(false)}
        styles={styles}
        t={t}
      />

      <ManualHoursModal
        manualHoursShift={manualHoursShift}
        manualDateEntry={manualDateEntry}
        onClose={closeManualHoursEditor}
        projects={projects}
        manualProjectId={manualProjectId}
        setManualProjectId={setManualProjectId}
        manualHoursH={manualHoursH}
        setManualHoursH={setManualHoursH}
        manualHoursM={manualHoursM}
        setManualHoursM={setManualHoursM}
        savingManualHours={savingManualHours}
        onSave={saveManualHours}
        onClear={() => submitManualHours(null)}
        styles={styles}
        t={t}
      />
    </View>
  );
}
