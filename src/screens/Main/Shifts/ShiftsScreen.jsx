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
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ProjectFilterSelector } from "../../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import AuthContext from "../../../contexts/AuthContext";
import {
  hoursService,
  leaveService,
  projectService,
  shiftService,
  userService,
} from "../../../services";
import { useShiftHistory } from "../../../hooks/useShiftHistory";
import Icon from "react-native-vector-icons/Feather";
import {
  buildExportMonthOptions,
  formatDateKey,
  formatDuration,
  effectiveDurationMs,
  shortAddress,
  formatExportPickerDate,
  formatMonthLabel,
  formatTimeRange,
  formatShiftListProjectName,
  getCurrentMonthKey,
  getMonthDateRange,
  getTodayDateKey,
  resolveUploadUrl,
} from "../../../utils/shifts";
import {
  getISOWeekNumber,
  addDaysToKey,
  monthKeyOf,
  weekDateKeys,
} from "../../../utils/shiftsCalendar";
import {
  dayExtras,
  dayOvertime,
  dayPlanHours,
  proposeOvertime,
  sameExtras,
  stepOvertime,
  stepWithin,
} from "../../../utils/overtime";
import {
  getDocumentNameFromUrl,
  isImageDocument,
  isPdfDocument,
} from "../../../utils/documentPreview";
import { createStyles } from "./ShiftsScreen.styles";
import {
  DayHoursEntry,
  PeriodSummary,
  EmployeePickerModal,
  ExportSheet,
  HoursSourceToggle,
  ManualHoursModal,
  PeriodSheet,
  ProjectPickModal,
  SelectionSummary,
  ShiftOvertime,
  ShiftWeekPicker,
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
  const { user, selectedProject, setSelectedProject } = useContext(AuthContext);
  const isAdmin = ["companyAdmin", "superadmin", "projectAdmin"].includes(
    user?.role,
  );
  const weekdayLabels = t("shifts.weekdays", { returnObjects: true });
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  // What span the top card shows: one week, a month grid, or a chosen period.
  const [viewMode, setViewMode] = useState("week");
  const [periodSummary, setPeriodSummary] = useState(null);
  // Set when the period sheet was opened from Export, to return there.
  const reopenExportRef = useRef(false);
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
  // The project picked on the home screen is the source of truth: shifts,
  // plan and export open on it. An admin can switch the filter; a worker
  // (who has no filter) always follows the home pick.
  const homeProjectId = selectedProject?._id || selectedProject?.id || null;
  const [filterProjectId, setFilterProjectId] = useState(homeProjectId);
  useEffect(() => {
    if (!isAdmin) setFilterProjectId(homeProjectId);
  }, [isAdmin, homeProjectId]);
  const [filterWorkerIds, setFilterWorkerIds] = useState([]);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  // Multi-select mode for export. Off (default): a tap focuses one day (view).
  // On: taps accumulate days to export (iOS Photos-style "Select").
  const [selectMode, setSelectMode] = useState(false);
  // Admins open on the plan, workers on their own manual hours.
  const [hoursSource, setHoursSource] = useState(
    isAdmin ? "planned" : "manual",
  );
  // Worker manual-hours editor: the shift being edited, its hh/mm inputs, and
  // the in-flight save flag.
  const [manualHoursShift, setManualHoursShift] = useState(null);
  // Hours as a decimal ("7,5"), the way they are reported and paid.
  const [manualHours, setManualHours] = useState("");
  const [savingManualHours, setSavingManualHours] = useState(false);
  // Date-based manual entry (Manuell tab): log hours for a day that has no
  // clock-in. Holds the target date and the project to attach the hours to.
  const [manualDateEntry, setManualDateEntry] = useState(null);
  const [manualProjectId, setManualProjectId] = useState(null);
  // Inline manual entry in the day card: the date being typed into, its seed
  // text (defaultValue), and a ref holding the live text.
  const [inlineManualDate, setInlineManualDate] = useState(null);
  const [inlineManualSeed, setInlineManualSeed] = useState("");
  const inlineValueRef = useRef("");
  // The typed total as text, for the live "8 h normal + 2 h övertid" line, and
  // the övertid the worker set with − / + (null = proposed from the plan).
  const [inlineTotalText, setInlineTotalText] = useState("");
  const [inlineOvertime, setInlineOvertime] = useState(null);
  // Unsaved övertid (hours) per date, alongside pendingManual.
  const [pendingOvertime, setPendingOvertime] = useState({});
  // The open card's other pay lines ({ ob, travel, km, perDiem }) and the
  // unsaved ones per date.
  const [inlineExtras, setInlineExtras] = useState(null);
  const [pendingExtras, setPendingExtras] = useState({});
  // The worker's own absences (Frånvaro), to show a day's absence in its card.
  const [myLeaves, setMyLeaves] = useState([]);
  const [savingLeave, setSavingLeave] = useState(false);
  // True while saveAllManual is committing, so the input's onBlur (fired by the
  // Keyboard.dismiss inside the save) doesn't double-stash and resurrect a
  // just-saved day as pending.
  const batchSavingRef = useRef(false);
  // Unsaved manual hours keyed by date (hours as a number). Fill several days,
  // then the header check saves them all in one go.
  const [pendingManual, setPendingManual] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);
  // Days waiting for the worker to say which project they belong to (several
  // projects, none chosen yet). Non-null opens the project picker.
  const [batchAwaitingProject, setBatchAwaitingProject] = useState(null);
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

  // Admins default the people filter to THEMSELVES (once), so the Manuell tab
  // opens ready to log their own hours — a tap on a day enters hours right away
  // instead of requiring them to first pick themselves out of "Alla anställda".
  // They can still switch the filter to a colleague or "all" afterwards; the
  // one-shot guard means that manual change is never overridden.
  const didInitPeopleFilterRef = useRef(false);
  // True while the filter is still that automatic "just me", i.e. nobody has
  // picked people by hand yet.
  const peopleFilterIsAutoRef = useRef(false);
  useEffect(() => {
    if (didInitPeopleFilterRef.current) return;
    if (isAdmin && currentUserId) {
      setFilterWorkerIds([currentUserId]);
      peopleFilterIsAutoRef.current = true;
      didInitPeopleFilterRef.current = true;
    } else if (isAdmin === false) {
      didInitPeopleFilterRef.current = true;
    }
  }, [isAdmin, currentUserId]);

  // "Just me" is right for logging your own hours, wrong for reading the plan:
  // an admin who isn't on the site's team has no plan of their own, so "План"
  // showed four stray days instead of the team's working days. On the plan
  // (and GPS) the automatic filter widens to everyone; a hand-picked filter is
  // left alone.
  const pickPeople = useCallback((next) => {
    peopleFilterIsAutoRef.current = false;
    setFilterWorkerIds(next);
  }, []);

  useEffect(() => {
    if (!peopleFilterIsAutoRef.current) return;
    if (hoursSource === "manual") {
      if (currentUserId) setFilterWorkerIds([currentUserId]);
    } else {
      setFilterWorkerIds([]);
    }
  }, [hoursSource, currentUserId]);

  // Manual hours attach to the app-wide selected project, or to the worker's
  // only project when they have exactly one — that choice is unambiguous. With
  // several projects and none chosen there is no silent projects[0] guess
  // (hours once landed on a project the worker never chose): null here means
  // "ask", and callers open the project picker.
  const resolveManualProjectId = useCallback(
    () =>
      selectedProject?._id ||
      selectedProject?.id ||
      (projects.length === 1 ? projects[0]._id || projects[0].id : null),
    [selectedProject, projects],
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

  // Declared above daySourceMs on purpose: its deps read plannedByDate during
  // render, and further down it was still undefined there (const → var), so
  // the callback froze on "no plan" and the calendar never showed the grid
  // while the month total (declared later) did.
  const [plannedByDate, setPlannedByDate] = useState(null);

  const sourceMeta =
    HOURS_SOURCES.find((s) => s.key === hoursSource) || HOURS_SOURCES[1];
  // Duration for a day entry under the current source. GPS = tracked timer;
  // planned/manual read their own field once the backend provides it.
  const daySourceMs = useCallback(
    (entry, date) => {
      if (hoursSource === "gps") return Number(entry?.totalDurationMs) || 0;
      if (hoursSource === "planned" && plannedByDate) {
        const key = date || entry?.date;
        return key ? plannedByDate.get(key) || 0 : 0;
      }
      return Number(entry?.[`${hoursSource}DurationMs`]) || 0;
    },
    [hoursSource, plannedByDate],
  );

  const workerIdsParam = filterWorkerIds.length
    ? filterWorkerIds.join(",")
    : undefined;

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  // The day the week view is on. Always a day (opens on today), so the card
  // under the week is never empty and nobody has to discover a tap first.
  const [focusedDate, setFocusedDate] = useState(
    () => route.params?.date || todayDateKey,
  );

  const {
    loading,
    days,
    availableMonths,
    currentMonthDuration,
    selectedMonth,
    setSelectedMonth,
    selectedDates,
    setSelectedDates,
    refreshHistory,
    loadHistory,
  } = useShiftHistory({ filterProjectId, workerIdsParam });

  // "Planned" under the shift history only counted days that already had a
  // shift, so someone with no check-ins yet showed 0 h even though the project
  // says 07:00–16:00 with an hour's lunch. The admin's Hours grid plans every
  // working day for everyone on the project team from that schedule (plus
  // corrections, minus approved leave); the app now reads that same grid, so
  // phone and web show the same planned hours.
  // Workers read it too: the backend hands them only their own row, so their
  // plan covers every working day of their site, not just the shift days.
  // The Manuell tab reads it as well: övertid is what goes over the plan.

  useEffect(() => {
    if (hoursSource === "gps" || !selectedMonth) {
      setPlannedByDate(null);
      return undefined;
    }
    let active = true;
    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const from = `${selectedMonth}-01`;
    const to = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

    hoursService
      .getGrid({
        from,
        to,
        ...(filterProjectId ? { projectId: filterProjectId } : {}),
      })
      .then((grid) => {
        if (!active) return;
        const wanted = filterWorkerIds.length
          ? new Set(filterWorkerIds.map(String))
          : null;
        const byDate = new Map();
        (grid?.workers || []).forEach((worker) => {
          if (wanted && !wanted.has(String(worker.workerId))) return;
          Object.entries(worker.cells || {}).forEach(([date, cell]) => {
            const hours = Number(cell?.planned);
            if (!Number.isFinite(hours) || hours <= 0) return;
            byDate.set(date, (byDate.get(date) || 0) + hours * 3600000);
          });
        });
        setPlannedByDate(byDate);
      })
      .catch((error) => {
        // Fall back to the per-shift planned value the history carries.
        console.warn("Failed to load planned hours:", error?.message);
        if (active) setPlannedByDate(null);
      });

    return () => {
      active = false;
    };
  }, [hoursSource, selectedMonth, filterProjectId, filterWorkerIds]);

  // Coming back from the day report (or the manual-hours sheet on another
  // screen) has to show what was just saved. The hook loads on mount, so the
  // first focus is skipped and only returns refetch.
  const hasFocusedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        return;
      }
      loadHistory(selectedMonth);
    }, [loadHistory, selectedMonth]),
  );

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

  // The people filter starts on the admin themselves, but getColleagues()
  // returns everyone ELSE — so their own name was missing from the list: one
  // tick shown, two people counted. Put them at the top of their own list.
  const pickerEmployees = useMemo(() => {
    if (!currentUserId) return employees;
    const known = employees.some(
      (person) => String(person._id || person.id) === String(currentUserId),
    );
    if (known) return employees;
    return [
      { _id: currentUserId, name: user?.name || user?.email || "" },
      ...employees,
    ];
  }, [employees, currentUserId, user?.name, user?.email]);

  const dayMap = useMemo(() => {
    const map = new Map();
    days.forEach((day) => map.set(day.date, day));
    return map;
  }, [days]);

  // The days whose shifts the cards below the week show: the picked days in
  // select mode, otherwise the one day the week view is on.
  const detailDates = useMemo(
    () => (selectMode ? selectedDates : [focusedDate]),
    [selectMode, selectedDates, focusedDate],
  );

  const detailShifts = useMemo(() => {
    const shifts = [];

    detailDates.forEach((date) => {
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
  }, [dayMap, detailDates]);

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
        (sum, date) => sum + daySourceMs(dayMap.get(date), date),
        0,
      );
    }
    if (hoursSource === "gps") {
      return currentMonthDuration;
    }
    let sum = 0;
    if (hoursSource === "planned" && plannedByDate) {
      plannedByDate.forEach((ms, key) => {
        if (selectedMonth && key.startsWith(selectedMonth)) sum += ms;
      });
      return sum;
    }
    dayMap.forEach((entry, key) => {
      if (selectedMonth && key.startsWith(selectedMonth)) {
        sum += daySourceMs(entry, key);
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
    plannedByDate,
  ]);

  // The week's total under the active source. Only the loaded month counts:
  // the days of a week that spill into the next month have no data yet.
  const weekDates = useMemo(() => weekDateKeys(focusedDate), [focusedDate]);
  const weekValueMs = useMemo(
    () =>
      weekDates.reduce(
        (sum, date) =>
          selectedMonth && date.startsWith(selectedMonth)
            ? sum + daySourceMs(dayMap.get(date), date)
            : sum,
        0,
      ),
    [weekDates, selectedMonth, daySourceMs, dayMap],
  );
  // The övertid in a day on the Manuell tab: the unsaved split while one is
  // waiting to be saved, else what the day's shifts carry. null elsewhere.
  const dayOvertimeOf = useCallback(
    (date) => {
      if (hoursSource !== "manual") return null;
      if (pendingManual[date] != null) {
        return {
          overtimeMs: Math.round((pendingOvertime[date] || 0) * 3600000),
          pending: true,
        };
      }
      return dayOvertime(dayMap.get(date));
    },
    [hoursSource, pendingManual, pendingOvertime, dayMap],
  );
  const weekOvertimeMs = useMemo(
    () =>
      weekDates.reduce(
        (sum, date) =>
          selectedMonth && date.startsWith(selectedMonth)
            ? sum + (dayOvertimeOf(date)?.overtimeMs || 0)
            : sum,
        0,
      ),
    [weekDates, selectedMonth, dayOvertimeOf],
  );
  const summaryMonthLabel = useMemo(() => {
    const label = formatMonthLabel(selectedMonth);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [selectedMonth]);

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

  // The day's planned hours, which övertid is counted from.
  const planHoursFor = useCallback(
    (dateStr) => dayPlanHours(dateStr, plannedByDate),
    [plannedByDate],
  );

  // Begin typing hours into the day card (Manuell tab). Seed from a pending
  // edit if present, else from what's already saved — the övertid too.
  const startInlineManual = useCallback(
    (dateStr) => {
      const pending = pendingManual[dateStr];
      const day = dayMap.get(dateStr);
      const savedMs = Number(day?.manualDurationMs) || 0;
      const hours =
        pending != null
          ? pending
          : savedMs
            ? Number((savedMs / 3600000).toFixed(2))
            : 0;
      const seed = hours ? String(hours).replace(".", ",") : "";
      inlineValueRef.current = seed;
      setInlineManualSeed(seed);
      setInlineTotalText(seed);
      const pendingHours = pendingOvertime[dateStr];
      setInlineOvertime(
        pendingHours != null
          ? pendingHours
          : savedMs
            ? dayOvertime(day).overtimeMs / 3600000
            : null,
      );
      setInlineExtras(pendingExtras[dateStr] || dayExtras(day));
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
    [dayMap, pendingManual, pendingOvertime, pendingExtras],
  );

  // Deep-link from a "log your hours" reminder push: switch to the Manual tab
  // and open today's cell for entry. Runs once, then clears the route param.
  useEffect(() => {
    if (!route.params?.openHoursEntry || handledHoursEntryRef.current) {
      return;
    }
    handledHoursEntryRef.current = true;
    setHoursSource("manual");
    setFocusedDate(route.params.date || todayDateKey);
    startInlineManual(route.params.date || todayDateKey);
    navigation.setParams({ openHoursEntry: undefined, date: undefined });
  }, [
    route.params?.openHoursEntry,
    route.params?.date,
    startInlineManual,
    todayDateKey,
    navigation,
  ]);

  // What the open day card holds: the hours and their övertid. `unchanged`
  // when both match what is saved (nothing to save), `invalid` for text that
  // isn't a number.
  const readOpenEntry = useCallback(() => {
    const dateStr = inlineManualDate;
    if (!dateStr) {
      return null;
    }
    const raw = String(inlineValueRef.current || "")
      .replace(",", ".")
      .trim();
    const day = dayMap.get(dateStr);
    const savedMs = Number(day?.manualDurationMs) || 0;
    const extras = inlineExtras || dayExtras(day);
    let hours;
    if (raw === "") {
      // Empty clears to 0 only when there was a saved value to remove.
      if (!savedMs) {
        return { dateStr, unchanged: true };
      }
      hours = 0;
    } else {
      hours = parseFloat(raw);
      if (!Number.isFinite(hours) || hours < 0) {
        return { dateStr, invalid: true };
      }
      hours = Math.min(hours, 24);
    }
    const overtime = Math.min(
      inlineOvertime ?? proposeOvertime(hours, planHoursFor(dateStr)),
      hours,
    );
    const ob = Math.min(extras.ob || 0, Math.max(0, hours - overtime));
    const entryExtras = { ...extras, ob };
    const unchanged =
      Math.round(hours * 3600000) === savedMs &&
      Math.round(overtime * 3600000) === dayOvertime(day).overtimeMs &&
      sameExtras(entryExtras, dayExtras(day));
    return { dateStr, hours, overtime, extras: entryExtras, unchanged };
  }, [inlineManualDate, dayMap, inlineOvertime, inlineExtras, planHoursFor]);

  // Move the open card's typed value into the pending maps (no network).
  const stashOpenInput = useCallback(() => {
    if (batchSavingRef.current) {
      return;
    }
    const entry = readOpenEntry();
    if (!entry) {
      return;
    }
    const keep = !entry.unchanged && !entry.invalid;
    const update = (value) => (prev) => {
      const next = { ...prev };
      if (keep) {
        next[entry.dateStr] = value;
      } else {
        delete next[entry.dateStr];
      }
      return next;
    };
    setPendingManual(update(entry.hours));
    setPendingOvertime(update(entry.overtime));
    setPendingExtras(update(entry.extras));
  }, [readOpenEntry]);

  // Write the collected days ([date, hours, övertid]) to one project, then
  // refresh the month.
  const commitManualBatch = useCallback(
    async (entries, projectId) => {
      try {
        setSavingBatch(true);
        for (const [date, hours, overtime, extras] of entries) {
          await shiftService.addManualHours({
            workerId: currentUserId,
            projectId,
            date,
            durationMs: Math.round(Number(hours) * 3600000),
            overtimeMs: Math.round((Number(overtime) || 0) * 3600000),
            ...(extras
              ? {
                  obMs: Math.round((Number(extras.ob) || 0) * 3600000),
                  travelMinutes: Math.round((Number(extras.travel) || 0) * 60),
                  travelKm: Math.round(Number(extras.km) || 0),
                  perDiem: extras.perDiem || "none",
                }
              : {}),
          });
        }
        setPendingManual({});
        setPendingOvertime({});
        setPendingExtras({});
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
    },
    [currentUserId, loadHistory, selectedMonth, t],
  );

  // Picker answer: remember the project app-wide (next time no question), then
  // save the waiting days to it.
  const pickBatchProject = useCallback(
    (project) => {
      const entries = batchAwaitingProject;
      setBatchAwaitingProject(null);
      if (!entries || !project) {
        batchSavingRef.current = false;
        return;
      }
      setSelectedProject?.(project);
      commitManualBatch(entries, project._id || project.id);
    },
    [batchAwaitingProject, commitManualBatch, setSelectedProject],
  );

  // The blue header check (or Spara in the card) saves every pending day in
  // one go, including the one still open in the input.
  const saveAllManual = useCallback(async () => {
    batchSavingRef.current = true;
    Keyboard.dismiss();

    // Merge the open card into local copies so we don't race the async
    // setPendingManual from stashOpenInput.
    const mergedManual = { ...pendingManual };
    const mergedOvertime = { ...pendingOvertime };
    const mergedExtras = { ...pendingExtras };
    const entry = readOpenEntry();
    if (entry && !entry.invalid) {
      if (entry.unchanged) {
        delete mergedManual[entry.dateStr];
        delete mergedOvertime[entry.dateStr];
        delete mergedExtras[entry.dateStr];
      } else {
        mergedManual[entry.dateStr] = entry.hours;
        mergedOvertime[entry.dateStr] = entry.overtime;
        mergedExtras[entry.dateStr] = entry.extras;
      }
    }
    setInlineManualDate(null);

    const entries = Object.entries(mergedManual).map(([date, hours]) => [
      date,
      hours,
      mergedOvertime[date] ?? proposeOvertime(hours, planHoursFor(date)),
      mergedExtras[date],
    ]);
    if (entries.length === 0) {
      setPendingManual({});
      setPendingOvertime({});
      setPendingExtras({});
      batchSavingRef.current = false;
      return;
    }

    const projectId = resolveManualProjectId();
    if (projectId) {
      await commitManualBatch(entries, projectId);
      return;
    }
    // Keep the typed days so nothing is lost while the worker decides.
    setPendingManual(mergedManual);
    setPendingOvertime(mergedOvertime);
    setPendingExtras(mergedExtras);
    if (projects.length === 0) {
      Alert.alert(t("shifts.manualHoursError"), t("shifts.manualNoProjects"));
      batchSavingRef.current = false;
      return;
    }
    setBatchAwaitingProject(entries);
  }, [
    pendingManual,
    pendingOvertime,
    pendingExtras,
    readOpenEntry,
    planHoursFor,
    resolveManualProjectId,
    commitManualBatch,
    projects.length,
    t,
  ]);

  // The open card's live split, for "8 h normal + 2 h övertid" while typing.
  const inlineSplit = useMemo(() => {
    const total = Math.min(
      Math.max(0, parseFloat(String(inlineTotalText).replace(",", ".")) || 0),
      24,
    );
    const plan = inlineManualDate ? planHoursFor(inlineManualDate) : 0;
    const overtime = Math.min(
      inlineOvertime ?? proposeOvertime(total, plan),
      total,
    );
    return { total, overtime, plan };
  }, [inlineTotalText, inlineOvertime, inlineManualDate, planHoursFor]);

  const changeInlineTotal = useCallback((text) => {
    setInlineTotalText(text);
    // A new total proposes its own split again.
    setInlineOvertime(null);
  }, []);

  const stepInlineOvertime = useCallback(
    (delta) => {
      setInlineOvertime(
        stepOvertime(inlineSplit.overtime, inlineSplit.total, delta),
      );
    },
    [inlineSplit],
  );

  // The open card's OB / travel / per diem. OB fits in what övertid leaves.
  const openExtras = useMemo(() => {
    const extras = inlineExtras || dayExtras(dayMap.get(inlineManualDate));
    return {
      ...extras,
      ob: Math.min(
        extras.ob || 0,
        Math.max(0, inlineSplit.total - inlineSplit.overtime),
      ),
    };
  }, [inlineExtras, dayMap, inlineManualDate, inlineSplit]);

  const changeInlineExtra = useCallback(
    (key, delta) => {
      setInlineExtras(() => {
        const next = { ...openExtras };
        if (key === "perDiem") {
          next.perDiem = delta;
        } else if (key === "ob") {
          next.ob = stepWithin(
            openExtras.ob,
            delta,
            Math.max(0, inlineSplit.total - inlineSplit.overtime),
          );
        } else if (key === "travel") {
          next.travel = stepWithin(openExtras.travel, delta, 24);
        } else if (key === "km") {
          next.km = Math.min(Math.max(0, (openExtras.km || 0) + delta), 2000);
        }
        return next;
      });
    },
    [openExtras, inlineSplit],
  );

  // The worker's absences, for the day card's Frånvaro line.
  const loadMyLeaves = useCallback(async () => {
    try {
      const all = await leaveService.getAll();
      setMyLeaves(
        (Array.isArray(all) ? all : []).filter(
          (leave) =>
            String(leave.userId?._id || leave.userId) === String(currentUserId),
        ),
      );
    } catch {
      setMyLeaves([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadMyLeaves();
  }, [loadMyLeaves]);

  const leaveOn = useCallback(
    (dateStr) =>
      myLeaves.find(
        (leave) =>
          leave.status !== "rejected" &&
          leave.startDate <= dateStr &&
          (leave.endDate || leave.startDate) >= dateStr,
      ) || null,
    [myLeaves],
  );

  // Frånvaro for one day goes to the manager as a request.
  const reportAbsence = useCallback(
    async (dateStr, type) => {
      try {
        setSavingLeave(true);
        await leaveService.create({
          type,
          startDate: dateStr,
          endDate: dateStr,
        });
        await loadMyLeaves();
      } catch (error) {
        Alert.alert(
          t("shifts.absenceError"),
          error?.response?.data?.message || error?.message || "",
        );
      } finally {
        setSavingLeave(false);
      }
    },
    [loadMyLeaves, t],
  );

  // Inline hour entry writes to the CURRENT user only (workerId: currentUserId),
  // so it's only meaningful when the day's subject is unambiguously "me": a
  // worker's own view, or an admin who filtered down to just themselves. For an
  // admin looking at the whole team a tap must never open self-entry.
  const canInlineEnter =
    hoursSource === "manual" &&
    (!isAdmin ||
      (filterWorkerIds.length === 1 &&
        String(filterWorkerIds[0]) === String(currentUserId)));

  // Move the week view to a day (week/day arrows, a day in the strip, "Idag").
  // Any half-typed hours are banked first. Hours load one month at a time, so
  // stepping into another month loads that month.
  const focusDate = useCallback(
    (dateStr) => {
      if (inlineManualDate) {
        stashOpenInput();
        setInlineManualDate(null);
      }
      setFocusedDate(dateStr);
      const monthKey = monthKeyOf(dateStr);
      if (selectedMonth && monthKey !== selectedMonth) {
        refreshHistory(monthKey);
      }
    },
    [inlineManualDate, stashOpenInput, selectedMonth, refreshHistory],
  );

  // A month from the month grid: today in the current month, else the 1st.
  const pickMonth = useCallback(
    (monthKey) => {
      focusDate(monthKey === currentMonthKey ? todayDateKey : `${monthKey}-01`);
    },
    [focusDate, currentMonthKey, todayDateKey],
  );

  // In select mode a tap on a day collects it for export; otherwise it shows
  // that day under the week.
  const handleDayPress = useCallback(
    (dateStr) => {
      if (selectMode) {
        toggleSelectedDate(dateStr);
      } else {
        focusDate(dateStr);
      }
    },
    [selectMode, toggleSelectedDate, focusDate],
  );

  // Entering/editing hours is an explicit tap on the day card's button (only
  // rendered when canInlineEnter). Banks the previously open day.
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
    if (reopenExportRef.current) {
      reopenExportRef.current = false;
      setTimeout(() => setExportSheetOpen(true), 350);
    }
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

  // Period needs a period: the first time, the period sheet opens.
  const changeViewMode = useCallback(
    (mode) => {
      setViewMode(mode);
      if (mode === "period" && !exportPeriodApplied) {
        openPeriodSheet();
      }
    },
    [exportPeriodApplied, openPeriodSheet],
  );

  // The chosen period's totals, month by month. History loads one month at a
  // time, so each month in the range is fetched and the days outside it cut.
  useEffect(() => {
    if (viewMode !== "period" || !exportPeriodApplied) {
      return undefined;
    }
    const range = getPeriodExportRange();
    if (!range) {
      return undefined;
    }
    let active = true;
    const months = [];
    for (
      let key = range.from.slice(0, 7);
      key <= range.to.slice(0, 7);
      key = monthKeyOf(addDaysToKey(`${key}-28`, 7))
    ) {
      months.push(key);
    }
    Promise.all(
      months.map((month) =>
        shiftService
          .getHistory({
            month,
            ...(filterProjectId ? { projectId: filterProjectId } : {}),
            ...(workerIdsParam ? { workerIds: workerIdsParam } : {}),
          })
          .catch(() => ({ days: [] })),
      ),
    ).then((results) => {
      if (!active) return;
      const totals = {
        ms: 0,
        overtimeMs: 0,
        obMs: 0,
        travelH: 0,
        km: 0,
        perDiemHalf: 0,
        perDiemFull: 0,
      };
      const rows = months.map((month, index) => {
        let monthMs = 0;
        (results[index].days || []).forEach((day) => {
          if (day.date < range.from || day.date > range.to) return;
          const ms = daySourceMs(day, day.date);
          monthMs += ms;
          totals.ms += ms;
          totals.overtimeMs += dayOvertime(day).overtimeMs;
          const extras = dayExtras(day);
          totals.obMs += extras.ob * 3600000;
          totals.travelH += extras.travel;
          totals.km += extras.km;
          if (extras.perDiem === "half") totals.perDiemHalf += 1;
          if (extras.perDiem === "full") totals.perDiemFull += 1;
        });
        return { month, ms: monthMs };
      });
      setPeriodSummary({ rows, totals });
    });
    return () => {
      active = false;
    };
  }, [
    viewMode,
    exportPeriodApplied,
    getPeriodExportRange,
    filterProjectId,
    workerIdsParam,
    daySourceMs,
  ]);

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }

    // Picked days export as they are; otherwise what the card shows: the
    // period, the week, or the month.
    const usePeriod =
      !selectedDates.length && (viewMode === "period" || viewMode === "week");
    const range = !usePeriod
      ? null
      : viewMode === "week"
        ? { from: weekDates[0], to: weekDates[6] }
        : exportPeriodApplied
          ? getPeriodExportRange()
          : null;

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
    viewMode,
    weekDates,
  ]);

  // Attest — a manager confirms the day's hours. Optimistic, because the row is
  // a toggle and a round trip would make it feel broken (Doherty).
  const [approvingIds, setApprovingIds] = useState([]);

  const toggleApproval = useCallback(
    async (shift) => {
      const id = shift.id || shift._id;
      if (!id || approvingIds.includes(id)) return;
      const next = !shift.approvedAt;
      setApprovingIds((previous) => [...previous, id]);
      try {
        await shiftService.setApproval(id, next);
        await refreshHistory(selectedMonth);
      } catch (error) {
        console.error("Failed to attest shift:", error);
        Alert.alert(t("common.error"), t("shifts.approveFailed"));
      } finally {
        setApprovingIds((previous) => previous.filter((item) => item !== id));
      }
    },
    [approvingIds, refreshHistory, selectedMonth, t],
  );

  // Godkänn / Neka the waiting övertid and OB on a day of the people the
  // manager looks at.
  const decideOvertime = useCallback(
    async (shift, approved) => {
      const id = shift.id || shift._id;
      if (!id || approvingIds.includes(id)) return;
      setApprovingIds((previous) => [...previous, id]);
      try {
        if (shift.overtimeMs > 0 && shift.overtimeStatus !== "approved") {
          await shiftService.decideOvertime(id, approved);
        }
        if (shift.obMs > 0 && shift.obStatus !== "approved") {
          await shiftService.decideOb(id, approved);
        }
        await refreshHistory(selectedMonth);
      } catch (error) {
        console.error("Failed to decide overtime:", error);
        Alert.alert(t("common.error"), t("shifts.approveFailed"));
      } finally {
        setApprovingIds((previous) => previous.filter((item) => item !== id));
      }
    },
    [approvingIds, refreshHistory, selectedMonth, t],
  );

  const openManualHoursEditor = useCallback((shift) => {
    const ms = Number(shift?.manualDurationMs) || 0;
    const hours = Math.round((ms / 3600000) * 100) / 100;
    setManualHours(ms ? String(hours).replace(".", ",") : "");
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
    // A comma and a dot mean the same thing to a person typing "7,5".
    const hours = Number(String(manualHours || "0").replace(",", ".")) || 0;
    const durationMs = Math.round(hours * 3600000);

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
    manualHours,
    manualDateEntry,
    submitManualDateHours,
    submitManualHours,
    t,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={theme.content.surfaceMuted}
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
        {/* Saving lives in the day card (✓ in the Arbetstimmar row); one
            blue check per screen. */}
        {
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
        }
      </View>

      {/* Only block the whole screen on the FIRST load (no data yet). On every
          later focus useShiftHistory re-fetches and flips loading=true again —
          if we hid everything then, the calendar would blank out and "reappear"
          each time. Keep the (local) calendar visible and let data refresh in
          place instead. */}
      {loading && !days.length ? (
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

          {isAdmin ? (
            <View style={styles.filtersRow}>
              <View style={styles.filterHalf}>
                <ProjectFilterSelector
                  projects={projects}
                  selectedProjectId={filterProjectId}
                  onSelect={setFilterProjectId}
                  triggerStyle={styles.dropdownButton}
                  textStyle={styles.dropdownText}
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

          {selectMode ? (
            <Text style={styles.selectModeHint} numberOfLines={1}>
              {t("shifts.selectDaysHint")}
            </Text>
          ) : null}

          {/* Controls on top (month, week, days, day), the day's information
              below them. */}
          <ShiftWeekPicker
            styles={styles}
            t={t}
            semiBoldFontFamily={theme.text.fontFamily["semiBold"]}
            focusedDate={focusedDate}
            todayDateKey={todayDateKey}
            selectedMonth={selectedMonth}
            maxMonthKey={currentMonthKey}
            weekdayLabels={weekdayLabels}
            dayMap={dayMap}
            daySourceMs={daySourceMs}
            sourceColor={sourceMeta.color}
            hoursSource={hoursSource}
            pendingManual={pendingManual}
            dayOvertimeOf={dayOvertimeOf}
            selectMode={selectMode}
            selectedDates={selectedDates}
            onDayPress={handleDayPress}
            onFocusDate={focusDate}
            onPickMonth={pickMonth}
            viewMode={viewMode}
            onChangeViewMode={changeViewMode}
            periodLabel={exportPeriodLabel}
            onPickPeriod={openPeriodSheet}
          />

          {viewMode === "period" ? (
            <PeriodSummary
              summary={periodSummary}
              styles={styles}
              t={t}
              semiBoldFontFamily={theme.text.fontFamily["semiBold"]}
            />
          ) : null}

          {viewMode === "period" ? null : (
            <View
              style={styles.shiftDetailsContainer}
              onLayout={(e) => {
                calendarYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.shiftDetailsContent}>
                {!selectMode && canInlineEnter ? (
                  <DayHoursEntry
                    styles={styles}
                    t={t}
                    semiBoldFontFamily={theme.text.fontFamily["semiBold"]}
                    isEditing={inlineManualDate === focusedDate}
                    seed={inlineManualSeed}
                    inlineValueRef={inlineValueRef}
                    onStashInput={stashOpenInput}
                    onEdit={() => handleEditDay(focusedDate)}
                    onChangeTotal={changeInlineTotal}
                    split={inlineSplit}
                    onStepOvertime={stepInlineOvertime}
                    extras={openExtras}
                    onChangeExtra={changeInlineExtra}
                    absence={leaveOn(focusedDate)}
                    onReportAbsence={(type) => reportAbsence(focusedDate, type)}
                    savingAbsence={savingLeave}
                    onSave={saveAllManual}
                    saving={savingBatch}
                    pendingHours={pendingManual[focusedDate]}
                    pendingOvertime={pendingOvertime[focusedDate]}
                    hasShifts={detailShifts.length > 0}
                    onLayout={(e) => {
                      rowYRef.current[focusedDate] = e.nativeEvent.layout.y;
                    }}
                  />
                ) : null}
                {selectMode && selectedDates.length === 0 ? (
                  <Text style={styles.emptyDetailsText}>
                    {t("shifts.selectDatesHint")}
                  </Text>
                ) : detailShifts.length === 0 ? (
                  // The manual-hours card already says the day is empty.
                  !selectMode && canInlineEnter ? null : (
                    <Text style={styles.emptyDetailsText}>
                      {selectMode
                        ? t("shifts.noShiftsSelected")
                        : t("shifts.noShiftsDay")}
                    </Text>
                  )
                ) : (
                  detailShifts.map((shift) => {
                    return (
                      <View key={shift.id} style={styles.shiftCard}>
                        {isAdmin && shift.workerName ? (
                          <Text
                            style={styles.shiftWorkerName}
                            numberOfLines={1}
                          >
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
                            {/* The day's hours: what the worker declared when they
                              declared it, otherwise what the clock caught. A
                              card that says 0 h above 8 h declared reads as a
                              bug, even though both numbers are true. The source
                              is said in words, not in colour. */}
                            {formatDuration(effectiveDurationMs(shift))}
                            <Text style={styles.durationSource}>
                              {shift.manualDurationMs
                                ? ` · ${t("shifts.sourceManual")}`
                                : ` · ${t("shifts.sourceGps")}`}
                            </Text>
                          </Text>
                        </View>

                        <ShiftOvertime
                          shift={shift}
                          styles={styles}
                          t={t}
                          semiBoldFontFamily={theme.text.fontFamily["semiBold"]}
                          canDecide={isAdmin}
                          busy={approvingIds.includes(shift.id)}
                          onDecide={(approved) =>
                            decideOvertime(shift, approved)
                          }
                        />

                        <View style={styles.shiftExpandedContent}>
                          {/* Saved manual hours already head the card; the row
                            is only the way to add them. */}
                          {shift.status === "completed" &&
                          !shift.manualDurationMs &&
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
                                    fontFamily:
                                      theme.text.fontFamily["regular"],
                                  },
                                ]}
                              >
                                {t("shifts.manualHours")}
                              </Text>
                              <Text
                                style={[
                                  shift.manualDurationMs
                                    ? styles.manualHoursValue
                                    : styles.rowActionValue,
                                  {
                                    fontFamily:
                                      theme.text.fontFamily[
                                        shift.manualDurationMs
                                          ? "medium"
                                          : "regular"
                                      ],
                                  },
                                ]}
                              >
                                {shift.manualDurationMs
                                  ? formatDuration(shift.manualDurationMs)
                                  : `＋ ${t("shifts.manualHoursAdd")}`}
                              </Text>
                            </TouchableOpacity>
                          ) : null}

                          {/* When the declared hours replace the clocked ones,
                            show what the clock caught so the difference is
                            visible rather than silently overwritten. A day
                            the clock never ran has nothing to compare. */}
                          {Number(shift.durationMs) > 0 &&
                          shift.manualDurationMs ? (
                            <View style={styles.shiftDetailRow}>
                              <Text
                                style={[
                                  styles.shiftDetailLabel,
                                  {
                                    fontFamily:
                                      theme.text.fontFamily["regular"],
                                  },
                                ]}
                              >
                                {t("shifts.clocked")}
                              </Text>
                              <Text
                                style={[
                                  styles.shiftDetailValue,
                                  {
                                    fontFamily:
                                      theme.text.fontFamily["regular"],
                                  },
                                ]}
                              >
                                {formatDuration(shift.durationMs)}
                              </Text>
                            </View>
                          ) : null}

                          {/* Attest — the manager's confirmation of the day. */}
                          {isAdmin && shift.status === "completed" ? (
                            <TouchableOpacity
                              style={styles.shiftDetailRow}
                              activeOpacity={0.7}
                              onPress={() => toggleApproval(shift)}
                            >
                              <Text
                                style={[
                                  styles.shiftDetailLabel,
                                  {
                                    fontFamily:
                                      theme.text.fontFamily["regular"],
                                  },
                                ]}
                              >
                                {t("shifts.attest")}
                              </Text>
                              <Text
                                style={[
                                  // Green means one thing on this screen:
                                  // approved. Until then it is an action.
                                  shift.approvedAt
                                    ? styles.approvedValue
                                    : styles.rowActionValue,
                                  {
                                    fontFamily:
                                      theme.text.fontFamily[
                                        shift.approvedAt ? "medium" : "regular"
                                      ],
                                  },
                                ]}
                              >
                                {shift.approvedAt
                                  ? t("shifts.attested")
                                  : t("shifts.attestAction")}
                              </Text>
                            </TouchableOpacity>
                          ) : null}

                          {/* Dagens rapport — pay bucket, travel and the day's
                            note, on your own finished day. */}
                          {shift.status === "completed" &&
                          String(shift.workerId) === String(currentUserId) ? (
                            <TouchableOpacity
                              style={styles.shiftDetailRow}
                              activeOpacity={0.7}
                              onPress={() =>
                                navigation.navigate("DayReport", { shift })
                              }
                            >
                              <Text
                                style={[
                                  styles.shiftDetailLabel,
                                  {
                                    fontFamily:
                                      theme.text.fontFamily["regular"],
                                  },
                                ]}
                              >
                                {t("dayReport.title")}
                              </Text>
                              <Text
                                style={[
                                  shift.reportedAt
                                    ? styles.manualHoursValue
                                    : styles.rowActionValue,
                                  {
                                    fontFamily:
                                      theme.text.fontFamily[
                                        shift.reportedAt ? "medium" : "regular"
                                      ],
                                  },
                                ]}
                              >
                                {shift.reportedAt
                                  ? [
                                      shift.hourType &&
                                      shift.hourType !== "normal"
                                        ? t(
                                            `dayReport.hourType.${shift.hourType}`,
                                          )
                                        : null,
                                      shift.travelKm
                                        ? `${shift.travelKm} km`
                                        : null,
                                      shift.perDiem && shift.perDiem !== "none"
                                        ? t(
                                            `dayReport.perDiemOption.${shift.perDiem}`,
                                          )
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ") || t("dayReport.reported")
                                  : `＋ ${t("dayReport.add")}`}
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
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.shiftDetailValue,
                                {
                                  fontFamily: theme.text.fontFamily["regular"],
                                },
                              ]}
                            >
                              {shortAddress(shift.location) || "—"}
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
                                      onPress={() =>
                                        handleOpenShiftPhoto(photo)
                                      }
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
                                    fontFamily:
                                      theme.text.fontFamily["regular"],
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
          )}

          {viewMode === "period" ? null : (
            <SelectionSummary
              heroValueMs={heroValueMs}
              weekValueMs={weekValueMs}
              weekOvertimeMs={weekOvertimeMs}
              weekLabel={t("schedule.week", {
                number: getISOWeekNumber(new Date(`${weekDates[0]}T12:00:00`)),
              })}
              monthLabel={summaryMonthLabel}
              selectedDates={selectedDates}
              selectionSummary={selectionSummary}
              onClearSelection={clearSelectedDates}
              styles={styles}
              regularFontFamily={theme.text.fontFamily["regular"]}
              t={t}
            />
          )}
        </ScrollView>
      )}

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={openExportSheet}
        showAddButton
        renderAddContent={() => (
          <Text
            style={styles.exportFabText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {t("shiftHistory.export")}
          </Text>
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
        exportLabel={
          selectedDates.length
            ? null
            : viewMode === "period"
              ? exportPeriodLabel
              : viewMode === "week"
                ? t("schedule.week", {
                    number: getISOWeekNumber(
                      new Date(`${weekDates[0]}T12:00:00`),
                    ),
                  })
                : summaryMonthLabel
        }
        styles={styles}
        sheetStyles={sheetStyles}
        titleFontFamily={theme.text.fontFamily["semiBold"]}
        t={t}
      />

      <PeriodSheet
        visible={periodSheetOpen}
        onClose={closePeriodSheet}
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
        employees={pickerEmployees}
        filterWorkerIds={filterWorkerIds}
        setFilterWorkerIds={pickPeople}
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
        manualHours={manualHours}
        setManualHours={setManualHours}
        savingManualHours={savingManualHours}
        onSave={saveManualHours}
        onClear={() => submitManualHours(null)}
        styles={styles}
        t={t}
      />

      <ProjectPickModal
        visible={Boolean(batchAwaitingProject)}
        projects={projects}
        onPick={pickBatchProject}
        onClose={() => {
          setBatchAwaitingProject(null);
          batchSavingRef.current = false;
        }}
        styles={styles}
        t={t}
      />
    </View>
  );
}
