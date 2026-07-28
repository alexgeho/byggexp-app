import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
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
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { shiftService } from "../../../services";
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
  getCalendarWeekNumber,
  getCurrentMonthKey,
  getMonthDateRange,
  getTodayDateKey,
  parseDateKey,
  resolveUploadUrl,
} from "../../../utils/shifts";
import {
  getDocumentNameFromUrl,
  isImageDocument,
  isPdfDocument,
} from "../../../utils/documentPreview";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EXPORT_PERIOD_TABS = ["Month", "Custom"];
const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "spinner" : "default";

export default function ShiftsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const weekdayLabels = t("shifts.weekdays", { returnObjects: true });
  const exportBottomSheetRef = useRef(null);
  const periodBottomSheetRef = useRef(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [days, setDays] = useState([]);
  const [currentMonthDuration, setCurrentMonthDuration] = useState(0);
  const [previousMonthDuration, setPreviousMonthDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedExportType, setSelectedExportType] = useState("pdf");
  const [periodExportType, setPeriodExportType] = useState("pdf");
  const [exportPeriodTab, setExportPeriodTab] = useState("Month");
  const [exportFromMonth, setExportFromMonth] = useState("");
  const [exportToMonth, setExportToMonth] = useState("");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [datePickerTarget, setDatePickerTarget] = useState(null);
  const [exportPeriodApplied, setExportPeriodApplied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedShiftId, setExpandedShiftId] = useState(null);

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  const loadMonths = useCallback(async () => {
    const months = await shiftService.getMonths();
    setAvailableMonths(months);
    return months;
  }, []);

  const loadHistory = useCallback(async (month) => {
    const data = await shiftService.getHistory(month ? { month } : {});
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
  }, []);

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

  const calendarLayout = useMemo(() => {
    if (!selectedMonth) {
      return {
        columnDates: [],
        rowDates: [],
        rows: [],
      };
    }

    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const cells = [];

    for (let index = 0; index < firstDayIndex; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(`${selectedMonth}-${day.toString().padStart(2, "0")}`);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const columnDates = Array.from({ length: 7 }, () => []);
    const rowDates = [];

    for (let rowIndex = 0; rowIndex < cells.length / 7; rowIndex += 1) {
      const rowStartIndex = rowIndex * 7;
      const datesInRow = [];

      for (let columnIndex = 0; columnIndex < 7; columnIndex += 1) {
        const dateStr = cells[rowStartIndex + columnIndex];
        if (dateStr) {
          columnDates[columnIndex].push(dateStr);
          datesInRow.push(dateStr);
        }
      }

      rowDates.push(datesInRow);
    }

    const rows = [];
    for (let rowIndex = 0; rowIndex < cells.length / 7; rowIndex += 1) {
      const rowStartIndex = rowIndex * 7;
      const weekNumber = getCalendarWeekNumber(
        year,
        month,
        firstDayIndex,
        rowStartIndex,
      );

      rows.push({
        rowIndex,
        weekNumber,
        cells: cells.slice(rowStartIndex, rowStartIndex + 7),
      });
    }

    return {
      columnDates,
      rowDates,
      rows,
    };
  }, [selectedMonth]);

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

  useEffect(() => {
    setExpandedShiftId(null);
  }, [selectedDates]);

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
            const isSelected = selectedDates.includes(dateStr);
            const isToday = dateStr === todayDateKey;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calendarCell,
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
                {shiftDay ? (
                  <Text style={styles.calendarHours}>
                    {formatDurationShort(shiftDay.totalDurationMs)}
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

  const openPeriodSheet = useCallback(() => {
    setDatePickerTarget(null);
    setPeriodExportType("pdf");

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

  const handlePeriodExport = useCallback(async () => {
    if (exporting) {
      return;
    }

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

    try {
      setExporting(true);
      await shiftService.exportReport({
        format: periodExportType,
        from: range.from,
        to: range.to,
      });
      setExportPeriodApplied(true);
      closePeriodSheet();
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
    closePeriodSheet,
    exportFromDate,
    exportFromMonth,
    exportPeriodTab,
    exportToDate,
    exportToMonth,
    exporting,
    getPeriodExportRange,
    periodExportType,
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
    if (!selectedDates.length) {
      Alert.alert(t("shifts.noDatesTitle"), t("shifts.noDatesMessage"));
      return;
    }

    setSelectedExportType("pdf");
    exportBottomSheetRef.current?.expand();
  }, [selectedDates]);

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

    if (!selectedDates.length) {
      Alert.alert(t("shifts.noDatesTitle"), t("shifts.noDatesMessage"));
      return;
    }

    const sortedDates = [...selectedDates].sort();

    try {
      setExporting(true);
      await shiftService.exportReport({
        format: selectedExportType,
        dates: sortedDates.join(","),
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
  }, [closeExportSheet, exporting, selectedDates, selectedExportType]);

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
        <View style={styles.placeholder} />
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
          <View style={styles.exportSelector}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={openPeriodSheet}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !exportPeriodApplied && styles.dropdownPlaceholderText,
                  {
                    fontFamily: theme.text.fontFamily[
                      exportPeriodApplied ? "semiBold" : "regular"
                    ],
                  },
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
              <Text style={styles.emptyMonthText}>{t("shifts.emptyMonth")}</Text>
            )}
          </View>

          <View style={styles.shiftDetailsContainer}>
            {selectedDates.length > 0 && selectionSummary ? (
              <View style={styles.selectionSummaryCard}>
                <View style={styles.selectionSummaryStat}>
                  <Text
                    style={[
                      styles.selectionSummaryValue,
                      { fontFamily: theme.text.fontFamily["semiBold"] },
                    ]}
                  >
                    {formatDurationCompact(selectionSummary.totalDurationMs)}
                  </Text>
                  <Text style={styles.selectionSummaryLabel}>
                    {t("shifts.selected")}
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
                    {t("shifts.dayCount", { count: selectionSummary.dayCount })}
                  </Text>
                  <Text style={styles.selectionSummaryLabel}>
                    {t("shifts.selected")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.clearSelectionButton}
                  onPress={clearSelectedDates}
                  activeOpacity={0.85}
                >
                  <Icon name="x" size={18} color="#698196" />
                </TouchableOpacity>
              </View>
            ) : null}

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
                  const isExpanded = expandedShiftId === shift.id;

                  return (
                    <TouchableOpacity
                      key={shift.id}
                      style={styles.shiftCard}
                      onPress={() =>
                        setExpandedShiftId(isExpanded ? null : shift.id)
                      }
                      activeOpacity={0.85}
                    >
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

                      {!isExpanded ? (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.shiftProjectName,
                            { fontFamily: theme.text.fontFamily["regular"] },
                          ]}
                        >
                          {formatShiftListProjectName(shift.projectName)}
                        </Text>
                      ) : (
                        <View style={styles.shiftExpandedContent}>
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
                                { fontFamily: theme.text.fontFamily["regular"] },
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
                                { fontFamily: theme.text.fontFamily["regular"] },
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
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t("shifts.currentMonth")}</Text>
              <Text style={styles.statValue}>
                {formatDuration(currentMonthDuration)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t("shifts.previousMonth")}</Text>
              <Text style={styles.statValue}>
                {formatDuration(previousMonthDuration)}
              </Text>
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

            <View style={styles.exportSheetCard}>
              <View style={styles.exportButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    periodExportType === "pdf" && styles.exportButtonActive,
                  ]}
                  onPress={() => setPeriodExportType("pdf")}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.exportButtonText,
                      periodExportType === "pdf" &&
                        styles.exportButtonTextActive,
                    ]}
                  >
                    PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    periodExportType === "excel" && styles.exportButtonActive,
                  ]}
                  onPress={() => setPeriodExportType("excel")}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.exportButtonText,
                      periodExportType === "excel" &&
                        styles.exportButtonTextActive,
                    ]}
                  >
                    Excel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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
            style={[
              styles.exportMainButton,
              exporting && styles.exportMainButtonDisabled,
            ]}
            onPress={handlePeriodExport}
            disabled={exporting}
            activeOpacity={0.85}
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
              <Text style={styles.datePickerButtonText}>{t("common.done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
  },
  backButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentScrollContent: {
    paddingBottom: 140,
  },
  exportSelector: {
    width: "100%",
  },
  dropdownButton: {
    width: "100%",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingLeft: 24,
    paddingRight: 16,
    backgroundColor: "rgba(5, 45, 80, 0.05)",
    borderRadius: 71,
  },
  dropdownText: {
    flex: 1,
    color: "#052D50",
    fontSize: 19,
    fontWeight: "600",
  },
  dropdownPlaceholderText: {
    color: "#052D50",
    fontWeight: "400",
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: "#052D50",
  },
  calendarContainer: {
    width: "100%",
    marginBottom: 12,
  },
  calendarMonthBar: {
    paddingTop: 28,
    paddingBottom: 20,
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  calendarNavButton: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarNavButtonDisabled: {
    opacity: 0.45,
  },
  calendarNavLabel: {
    flex: 1,
    color: "#052D50",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  calendarWeekHeaderCell: {
    width: 28,
  },
  calendarDaysHeader: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarHeaderDayButton: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarHeaderDay: {
    color: "#698196",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  calendarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  calendarWeekNumberCell: {
    width: 28,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarWeekNumberText: {
    color: "#698196",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  calendarDaysRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarCell: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  calendarCellToday: {
    backgroundColor: "#FFFFFF",
  },
  calendarCellSelected: {
    backgroundColor: "rgba(7, 133, 244, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  calendarCellEmpty: {
    width: 42,
    height: 42,
  },
  calendarDay: {
    fontFamily: "DMSans-Regular",
    color: "#052D50",
    fontSize: 14,
    opacity: 0.5,
  },
  calendarDayToday: {
    opacity: 1,
  },
  calendarDaySelected: {
    color: "#FFFFFF",
    opacity: 1,
  },
  calendarHours: {
    fontFamily: "DMSans-Medium",
    color: "#052D50",
    fontSize: 10,
    opacity: 0.5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 20,
  },
  shiftDetailsContainer: {
    width: "100%",
    marginBottom: 12,
  },
  shiftDetailsContent: {
    gap: 12,
  },
  selectionSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.08)",
    paddingVertical: 16,
    marginBottom: 12,
  },
  selectionSummaryStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  selectionSummaryValue: {
    color: "#052D50",
    fontSize: 18,
  },
  selectionSummaryLabel: {
    color: "#698196",
    fontSize: 18,
  },
  selectionSummaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(5, 45, 80, 0.08)",
  },
  clearSelectionButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  shiftCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  shiftTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  shiftTimeText: {
    color: "rgba(122, 148, 168, 1)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    flex: 1,
  },
  shiftDurationText: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "500",
    textAlign: "right",
  },
  shiftProjectName: {
    color: "rgba(122, 148, 168, 1)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    marginTop: 4,
  },
  shiftExpandedContent: {
    marginTop: 8,
    gap: 8,
  },
  shiftDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  shiftDetailLabel: {
    color: "rgba(122, 148, 168, 1)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  shiftDetailValue: {
    color: "rgba(122, 148, 168, 1)",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "400",
    textAlign: "right",
    flex: 1,
  },
  shiftPhotosValue: {
    flex: 1,
    alignItems: "flex-end",
  },
  shiftPhotosScroll: {
    maxWidth: "100%",
  },
  shiftPhotosScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  shiftImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
  },
  statsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: "#698196",
    fontSize: 14,
  },
  statValue: {
    color: "#052D5099",
    fontSize: 16,
    fontWeight: "500",
  },
  exportFabButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  exportFabText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMonthText: {
    color: "#698196",
    textAlign: "center",
    marginTop: 12,
  },
  emptyDetailsText: {
    color: "#698196",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000040",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  bottomSheetBackground: {
    backgroundColor: "#EEEEEE",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: "#CCCCCC",
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  exportSheetBody: {
    gap: 12,
    marginBottom: 12,
  },
  exportSheetTitle: {
    color: "#052D50",
    fontSize: 22,
  },
  exportPeriodLabel: {
    color: "#052D50",
    fontSize: 16,
  },
  periodTabs: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-start",
  },
  periodTab: {
    height: 44,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  periodTabActive: {
    backgroundColor: "#0785F4",
    borderColor: "#0785F4",
  },
  periodTabText: {
    fontSize: 15,
    color: "#052D50",
  },
  periodTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  periodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  monthDateField: {
    flex: 1,
    alignItems: "center",
  },
  monthDateLabel: {
    fontSize: 14,
    color: "#052D50",
    marginBottom: 4,
    textAlign: "center",
    width: "100%",
  },
  monthWheelContainer: {
    width: "100%",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  monthWheel: {
    height: Platform.OS === "ios" ? 150 : 48,
    width: "100%",
    backgroundColor: "transparent",
  },
  monthWheelItem: {
    color: "#052D50",
    fontSize: 16,
  },
  dateValueCard: {
    width: "100%",
    backgroundColor: "rgba(245, 245, 245, 1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  dateValueText: {
    fontSize: 15,
    color: "#052D50",
    textAlign: "center",
  },
  dateValuePlaceholder: {
    color: "#698196",
  },
  exportSheetCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportButtonsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportButtonActive: {
    borderWidth: 2,
    borderColor: "rgba(7, 133, 244, 1)",
  },
  exportButtonText: {
    fontSize: 16,
    color: "#052D50",
  },
  exportButtonTextActive: {
    fontWeight: "600",
  },
  exportMainButton: {
    width: "100%",
    height: 60,
    backgroundColor: "#0091FF",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  datePickerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  datePickerTitle: {
    color: "#052D50",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  datePickerButton: {
    alignSelf: "flex-end",
    marginTop: 12,
    backgroundColor: "#0091FF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  datePickerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  exportMainButtonDisabled: {
    opacity: 0.7,
  },
  exportMainButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  monthOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  monthOptionText: {
    color: "#052D50",
    fontSize: 16,
  },
  monthOptionTextSelected: {
    color: "#0088FF",
    fontWeight: "700",
  },
});
