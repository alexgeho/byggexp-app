import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getDateLocale } from "../../../utils/dateLocale";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Feather";

import {
  formatDurationCompact,
  formatDurationShort,
  formatExportPickerDate,
  formatMonthLabel,
  formatMonthShort,
  parseDateKey,
} from "../../../utils/shifts";
import {
  addDaysToKey,
  getISOWeekNumber,
  monthKeyOf,
  weekDateKeys,
  weekStartKey,
} from "../../../utils/shiftsCalendar";

// Presentational sub-components split out of ShiftsScreen to keep that file
// smaller. Each is self-contained: it receives the themed `styles` object and
// `t` from the parent, so it does no data-fetching or theming of its own.

const EXPORT_PERIOD_TABS = ["Month", "Custom"];
const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "spinner" : "default";

// Admin filter: pick which employees the calendar/export is scoped to.
export function EmployeePickerModal({
  visible,
  employees,
  filterWorkerIds,
  setFilterWorkerIds,
  onClose,
  styles,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          <TouchableOpacity style={styles.datePickerButton} onPress={onClose}>
            <Text style={styles.datePickerButtonText}>{t("common.done")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Log/edit manual hours for a shift, or add hours to a specific date. Shows a
// project picker only in the add-to-date flow; a plain hours+minutes entry
// otherwise. All state and the save/clear actions are owned by the parent.
export function ManualHoursModal({
  manualHoursShift,
  manualDateEntry,
  onClose,
  projects,
  manualProjectId,
  setManualProjectId,
  manualHours,
  setManualHours,
  savingManualHours,
  onSave,
  onClear,
  styles,
  t,
}) {
  // A bottom sheet, not a centred dialog: the number pad covers the lower half
  // of the screen, and a centred card ends up with its own buttons underneath
  // it. Sliding up from the bottom and lifting with the keyboard keeps every
  // action reachable (Fitts's), and one decimal field replaces the h + min
  // pair, because hours are what gets reported and paid.
  return (
    <Modal
      visible={Boolean(manualHoursShift) || Boolean(manualDateEntry)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.manualSheetOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.manualSheetBackdrop} onPress={onClose} />

        <View style={styles.manualSheet}>
          <View style={styles.manualSheetGrab} />

          <Text style={styles.manualSheetTitle}>
            {t("shifts.manualHoursTitle")}
          </Text>
          <Text style={styles.manualSheetHint}>
            {manualDateEntry
              ? manualDateEntry.date
              : t("shifts.manualHoursHint")}
          </Text>

          {manualDateEntry ? (
            <View style={styles.manualProjectPicker}>
              <Text style={styles.manualProjectLabel}>
                {t("createTask.projectLabel")}
              </Text>
              <ScrollView
                style={styles.manualProjectList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {projects.length === 0 ? (
                  <Text style={styles.manualProjectEmpty}>
                    {t("shifts.manualHoursNoProject")}
                  </Text>
                ) : (
                  projects.map((project) => {
                    const projectId = project._id || project.id;
                    const active = projectId === manualProjectId;
                    return (
                      <TouchableOpacity
                        key={projectId}
                        style={[
                          styles.manualProjectOption,
                          active && styles.manualProjectOptionActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setManualProjectId(projectId)}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.manualProjectOptionText,
                            active && styles.manualProjectOptionTextActive,
                          ]}
                        >
                          {project.name || project.projectName || projectId}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.manualHoursRow}>
            <TextInput
              style={styles.manualHoursBigInput}
              value={manualHours}
              onChangeText={(text) =>
                // A comma and a dot mean the same thing to a person.
                setManualHours(text.replace(/[^0-9.,]/g, "").slice(0, 5))
              }
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#9BB0C1"
              autoFocus
            />
            <Text style={styles.manualHoursBigUnit}>
              {t("shifts.unitHour")}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.manualSheetSave,
              savingManualHours && styles.exportMainButtonDisabled,
            ]}
            onPress={onSave}
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

          <View style={styles.manualSheetFooter}>
            <TouchableOpacity onPress={onClose} disabled={savingManualHours}>
              <Text style={styles.manualHoursCancelText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>

            {manualHoursShift?.manualDurationMs ? (
              <TouchableOpacity onPress={onClear} disabled={savingManualHours}>
                <Text style={styles.manualHoursClearText}>
                  {t("shifts.manualHoursClear")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// "Which project are these hours for?" — shown when the worker saves typed
// days but has several projects and none chosen. A tap saves straight away.
export function ProjectPickModal({
  visible,
  projects,
  onPick,
  onClose,
  styles,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.manualSheetOverlay}>
        <Pressable style={styles.manualSheetBackdrop} onPress={onClose} />
        <View style={styles.manualSheet}>
          <View style={styles.manualSheetGrab} />
          <Text style={styles.manualSheetTitle}>
            {t("shifts.manualPickProjectTitle")}
          </Text>
          <ScrollView
            style={styles.manualProjectList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {projects.map((project) => {
              const projectId = project._id || project.id;
              return (
                <TouchableOpacity
                  key={projectId}
                  style={styles.manualProjectOption}
                  activeOpacity={0.8}
                  onPress={() => onPick(project)}
                >
                  <Text
                    numberOfLines={1}
                    style={styles.manualProjectOptionText}
                  >
                    {project.name || project.projectName || projectId}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.manualSheetFooter}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.manualHoursCancelText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Export bottom sheet: pick PDF/Excel, then export the selected period.
export function ExportSheet({
  visible,
  onClose,
  selectedExportType,
  setSelectedExportType,
  exporting,
  onExport,
  hasSelection,
  periodLabel,
  onPickPeriod,
  exportLabel,
  onPickDays,
  styles,
  sheetStyles,
  titleFontFamily,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={sheetStyles.backdrop} onPress={onClose} />
      <View style={sheetStyles.container}>
        <View style={styles.handleIndicator} />
        <View style={styles.bottomSheetContent}>
          <View style={styles.exportSheetBody}>
            <Text
              style={[styles.exportSheetTitle, { fontFamily: titleFontFamily }]}
            >
              {t("shifts.exportTitle")}
            </Text>

            {onPickPeriod ? (
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={onPickPeriod}
                activeOpacity={0.85}
              >
                <Text style={styles.dropdownText}>{periodLabel}</Text>
                <Icon
                  name="chevron-down"
                  size={18}
                  color={styles.navChevron?.color}
                />
              </TouchableOpacity>
            ) : null}

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

          {onPickDays ? (
            <TouchableOpacity
              style={styles.exportPickDays}
              onPress={onPickDays}
              activeOpacity={0.7}
            >
              <Text style={styles.dayEntryLink}>{t("shifts.pickDays")}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[
              styles.exportMainButton,
              exporting && styles.exportMainButtonDisabled,
            ]}
            onPress={onExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.exportMainButtonText}>
                {exportLabel
                  ? t("shifts.exportWhat", { what: exportLabel })
                  : t(
                      hasSelection
                        ? "shifts.exportSelected"
                        : "shifts.exportThisMonth",
                    )}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Period bottom sheet: pick a Month range (two month wheels) or a Custom range
// (From/To with an inline date wheel). Apply confirms. The date picker is
// rendered inline INSIDE this sheet — a stacked Modal would swallow the wheel's
// touches on iOS.
// One month-and-year choice as two wheels, the way a birth date is picked:
// the month by name on the left, the year on the right. A single wheel of
// "август 2026 г." was cut off at the column width ("август 202…").
function MonthYearWheels({ value, onChange, options, styles, prefix }) {
  const years = [...new Set(options.map((key) => key.slice(0, 4)))];
  const year = (value || options[0] || "").slice(0, 4);
  const month = (value || "").slice(5, 7);
  const monthsForYear = options
    .filter((key) => key.startsWith(`${year}-`))
    .map((key) => key.slice(5, 7));
  const monthName = (mm) => {
    const label = new Intl.DateTimeFormat(getDateLocale(), {
      month: "long",
    }).format(new Date(Number(year) || 2000, Number(mm) - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const changeYear = (nextYear) => {
    const available = options
      .filter((key) => key.startsWith(`${nextYear}-`))
      .map((key) => key.slice(5, 7));
    // Keep the month if that year has it, else the nearest one it does have.
    const nextMonth = available.includes(month)
      ? month
      : available[
          month > available[available.length - 1] ? available.length - 1 : 0
        ];
    if (nextMonth) onChange(`${nextYear}-${nextMonth}`);
  };

  return (
    <View style={styles.monthYearRow}>
      <View style={[styles.monthWheelContainer, styles.monthYearMonth]}>
        <Picker
          selectedValue={month}
          onValueChange={(mm) => onChange(`${year}-${mm}`)}
          style={styles.monthWheel}
          itemStyle={styles.monthWheelItem}
          selectionColor="rgb(245, 245, 245)"
        >
          {monthsForYear.map((mm) => (
            <Picker.Item
              key={`${prefix}-m-${mm}`}
              label={monthName(mm)}
              value={mm}
            />
          ))}
        </Picker>
      </View>
      <View style={[styles.monthWheelContainer, styles.monthYearYear]}>
        <Picker
          selectedValue={year}
          onValueChange={changeYear}
          style={styles.monthWheel}
          itemStyle={styles.monthWheelItem}
          selectionColor="rgb(245, 245, 245)"
        >
          {years.map((yy) => (
            <Picker.Item key={`${prefix}-y-${yy}`} label={yy} value={yy} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

export function PeriodSheet({
  visible,
  onClose,
  exportPeriodTab,
  setExportPeriodTab,
  exportFromMonth,
  setExportFromMonth,
  exportToMonth,
  setExportToMonth,
  exportMonthOptions,
  exportFromDate,
  exportToDate,
  datePickerTarget,
  setDatePickerTarget,
  onCustomDateChange,
  onApply,
  styles,
  sheetStyles,
  titleFontFamily,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={sheetStyles.backdrop} onPress={onClose} />
      <View style={sheetStyles.container}>
        <View style={styles.handleIndicator} />
        <View style={styles.bottomSheetContent}>
          <View style={styles.exportSheetBody}>
            <Text
              style={[styles.exportSheetTitle, { fontFamily: titleFontFamily }]}
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
                <View style={styles.monthRangeStack}>
                  <View>
                    <Text style={styles.monthDateLabel}>
                      {t("shiftHistory.from")}
                    </Text>
                    <MonthYearWheels
                      value={exportFromMonth}
                      onChange={setExportFromMonth}
                      options={exportMonthOptions}
                      styles={styles}
                      prefix="from"
                    />
                  </View>
                  <View>
                    <Text style={styles.monthDateLabel}>
                      {t("shiftHistory.to")}
                    </Text>
                    <MonthYearWheels
                      value={exportToMonth}
                      onChange={setExportToMonth}
                      options={exportMonthOptions}
                      styles={styles}
                      prefix="to"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.dateContainer}>
                  <View style={styles.monthDateField}>
                    <Text style={styles.monthDateLabel}>
                      {t("shiftHistory.from")}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dateValueCard,
                        (datePickerTarget || "from") === "from" &&
                          styles.dateValueCardActive,
                      ]}
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
                      style={[
                        styles.dateValueCard,
                        datePickerTarget === "to" && styles.dateValueCardActive,
                      ]}
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

              {exportPeriodTab === "Custom" ? (
                <View style={styles.inlineDatePicker}>
                  <DateTimePicker
                    value={parseDateKey(
                      (datePickerTarget || "from") === "from"
                        ? exportFromDate
                        : exportToDate,
                    )}
                    mode="date"
                    display={DATE_PICKER_DISPLAY}
                    onChange={onCustomDateChange}
                  />
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.exportMainButton}
            onPress={onApply}
            activeOpacity={0.85}
          >
            <Text style={styles.exportMainButtonText}>
              {t("shifts.applyPeriod")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Planned / Manual / GPS segmented toggle — picks which hours source drives
// the numbers and their colour.
export function HoursSourceToggle({
  sources,
  hoursSource,
  setHoursSource,
  styles,
  mediumFontFamily,
  t,
}) {
  return (
    <View style={styles.sourceToggle}>
      {sources.map((s) => {
        const on = s.key === hoursSource;
        return (
          <TouchableOpacity
            key={s.key}
            style={[styles.sourceBtn, on && styles.sourceBtnOn]}
            onPress={() => setHoursSource(s.key)}
            activeOpacity={0.85}
          >
            {/* One line, always: "Запланированные" is wider than a third of
                the bar and broke mid-word onto a second line. It shrinks to
                fit instead. */}
            <Text
              style={[
                styles.sourceBtnText,
                { fontFamily: mediumFontFamily },
                on && { color: s.color },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t(
                `shifts.hoursSource${s.key.charAt(0).toUpperCase()}${s.key.slice(1)}`,
                { defaultValue: s.label },
              )}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Two-stat summary card under the day: the week's total on the left and the
// month's on the right; while days are picked for export, their total and
// count instead, with a clear button.
export function SelectionSummary({
  heroValueMs,
  weekValueMs,
  weekOvertimeMs,
  weekLabel,
  monthLabel,
  selectedDates,
  selectionSummary,
  onClearSelection,
  styles,
  regularFontFamily,
  t,
}) {
  const hasSelection = selectedDates.length > 0;
  return (
    <View style={styles.selectionSummaryCard}>
      <View style={styles.selectionSummaryStat}>
        <Text
          style={[
            styles.selectionSummaryValue,
            { fontFamily: regularFontFamily },
          ]}
        >
          {formatDurationCompact(hasSelection ? heroValueMs : weekValueMs)}
        </Text>
        <Text style={styles.selectionSummaryLabel}>
          {hasSelection ? t("shifts.selected") : weekLabel}
        </Text>
        {!hasSelection && weekOvertimeMs > 0 ? (
          <Text style={styles.selectionSummaryOvertime}>
            {t("shifts.ofWhichOvertime", {
              hours: formatDurationCompact(weekOvertimeMs),
            })}
          </Text>
        ) : null}
      </View>

      <View style={styles.selectionSummaryDivider} />

      <View style={styles.selectionSummaryStat}>
        <Text
          style={[
            styles.selectionSummaryValue,
            { fontFamily: regularFontFamily },
          ]}
        >
          {hasSelection
            ? t("shifts.dayCount", { count: selectionSummary?.dayCount || 0 })
            : formatDurationCompact(heroValueMs)}
        </Text>
        <Text style={styles.selectionSummaryLabel}>
          {hasSelection ? t("shifts.selected") : monthLabel}
        </Text>
      </View>

      {hasSelection ? (
        <TouchableOpacity
          style={styles.clearSelectionButton}
          onPress={onClearSelection}
          activeOpacity={0.85}
        >
          <Icon name="x" size={18} color="#698196" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VIEW_MODES = ["week", "month", "period"];

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

// The week view's controls, all in one card at the top: the month (tap opens a
// month grid), the week ‹ ›, the seven days and the chosen day ‹ ›. What
// happened on the day is shown below the card, never inside it.
// Hours are only loaded for one month at a time, so days of a week that spill
// into the neighbouring month are dimmed; tapping one moves to that month.
export function ShiftWeekPicker({
  styles,
  t,
  semiBoldFontFamily,
  focusedDate,
  todayDateKey,
  selectedMonth,
  maxMonthKey,
  weekdayLabels,
  dayMap,
  daySourceMs,
  sourceColor,
  hoursSource,
  pendingManual,
  dayOvertimeOf,
  selectMode,
  selectedDates,
  onDayPress,
  onFocusDate,
  onPickMonth,
  viewMode = "week",
  onChangeViewMode,
  periodLabel,
  onPickPeriod,
}) {
  const [monthGridOpen, setMonthGridOpen] = React.useState(false);
  const [gridYear, setGridYear] = React.useState(() =>
    Number(focusedDate.slice(0, 4)),
  );
  const maxYear = Number(maxMonthKey.slice(0, 4));
  const weekKeys = weekDateKeys(focusedDate);
  const weekNumber = getISOWeekNumber(new Date(`${weekKeys[0]}T12:00:00`));
  const reachable = (dateKey) => monthKeyOf(dateKey) <= maxMonthKey;
  const step = (days) => {
    const next = addDaysToKey(focusedDate, days);
    return reachable(next) ? next : null;
  };
  const prevWeek = step(-7);
  const nextWeek = step(7);

  const toggleMonthGrid = () => {
    setGridYear(Number(focusedDate.slice(0, 4)));
    setMonthGridOpen((open) => !open);
  };

  const viewMonthKey = monthKeyOf(focusedDate);
  const shiftMonth = (delta) => {
    const [year, month] = viewMonthKey.split("-").map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return key <= maxMonthKey ? key : null;
  };
  const prevMonthKey = shiftMonth(-1);
  const nextMonthKey = shiftMonth(1);
  // Every week that touches the month, Monday first.
  const monthWeeks = [];
  for (
    let start = weekStartKey(`${viewMonthKey}-01`);
    monthKeyOf(start) <= viewMonthKey;
    start = addDaysToKey(start, 7)
  ) {
    monthWeeks.push(weekDateKeys(start));
  }

  const navButton = (target, icon, label, onGo = onFocusDate) => (
    <TouchableOpacity
      style={[styles.weekNavButton, !target && styles.weekNavButtonDisabled]}
      onPress={() => target && onGo(target)}
      disabled={!target}
      activeOpacity={0.85}
      accessibilityLabel={label}
    >
      <Icon name={icon} size={22} color={styles.navChevron?.color} />
    </TouchableOpacity>
  );

  const renderDay = (dateKey, columnIndex, compact) => {
    const inMonth = monthKeyOf(dateKey) === selectedMonth;
    const disabled = !reachable(dateKey) || (selectMode && !inMonth);
    const pendingHours = pendingManual[dateKey];
    const hasPending = hoursSource === "manual" && pendingHours != null;
    const displayMs = !inMonth
      ? 0
      : hasPending
        ? Math.round(pendingHours * 3600000)
        : daySourceMs(dayMap.get(dateKey), dateKey);
    const isOn = selectMode
      ? selectedDates.includes(dateKey)
      : dateKey === focusedDate;
    const isTodayCell = dateKey === todayDateKey;
    const overtime = inMonth ? dayOvertimeOf?.(dateKey) : null;

    return (
      <TouchableOpacity
        key={dateKey}
        style={[
          styles.weekDay,
          compact && styles.weekDayCompact,
          displayMs > 0 && !isOn && { backgroundColor: `${sourceColor}1A` },
          isTodayCell && !isOn && styles.weekDayToday,
          isOn && styles.weekDayOn,
          (!inMonth || disabled) && !isOn && styles.weekDayOut,
        ]}
        onPress={() => onDayPress(dateKey)}
        disabled={disabled}
        activeOpacity={0.85}
      >
        {hasPending ? <View style={styles.pendingDot} /> : null}
        {selectMode ? (
          <View style={[styles.calendarCheck, isOn && styles.calendarCheckOn]}>
            {isOn ? <Icon name="check" size={10} color="#FFFFFF" /> : null}
          </View>
        ) : null}
        {compact ? null : (
          <Text style={[styles.weekDayName, isOn && styles.weekDayTextOn]}>
            {(Array.isArray(weekdayLabels)
              ? weekdayLabels[columnIndex]
              : null) || CALENDAR_WEEKDAYS[columnIndex]}
          </Text>
        )}
        <Text
          style={[
            styles.weekDayNumber,
            compact && styles.weekDayNumberCompact,
            { fontFamily: semiBoldFontFamily },
            isOn && styles.weekDayTextOn,
          ]}
        >
          {Number(dateKey.slice(8))}
        </Text>
        <Text
          style={[
            styles.weekDayHours,
            displayMs > 0 ? { color: sourceColor } : styles.weekDayHoursEmpty,
            isOn && styles.weekDayTextOn,
          ]}
        >
          {displayMs > 0 ? formatDurationShort(displayMs) : "–"}
        </Text>
        {overtime && overtime.overtimeMs > 0 && displayMs > 0 ? (
          <HoursBar
            styles={styles}
            totalMs={displayMs}
            overtimeMs={overtime.overtimeMs}
            pending={overtime.pending}
            onAccent={isOn}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.weekCard}>
      {onChangeViewMode ? (
        <View style={styles.viewModeToggle}>
          {VIEW_MODES.map((mode) => {
            const on = mode === viewMode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.viewModeBtn, on && styles.viewModeBtnOn]}
                onPress={() => {
                  setMonthGridOpen(false);
                  onChangeViewMode(mode);
                }}
                activeOpacity={0.85}
                testID={`shifts-view-${mode}`}
              >
                <Text
                  style={[
                    styles.viewModeText,
                    on && styles.viewModeTextOn,
                    on && { fontFamily: semiBoldFontFamily },
                  ]}
                >
                  {t(`shifts.view.${mode}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {viewMode === "period" ? (
        <TouchableOpacity
          style={styles.periodPickButton}
          onPress={onPickPeriod}
          activeOpacity={0.85}
          testID="shifts-period-button"
        >
          <Text
            style={[styles.weekNavTitle, { fontFamily: semiBoldFontFamily }]}
          >
            {capitalize(periodLabel)}
          </Text>
          <Icon
            name="chevron-down"
            size={20}
            color={styles.navChevron?.color}
          />
        </TouchableOpacity>
      ) : viewMode === "month" ? (
        <View style={styles.weekNavRow}>
          {navButton(
            prevMonthKey,
            "chevron-left",
            "previous month",
            onPickMonth,
          )}
          <TouchableOpacity
            style={styles.weekNavTitleBox}
            onPress={toggleMonthGrid}
            activeOpacity={0.85}
            testID="shifts-month-button"
          >
            <View style={styles.monthTitleRow}>
              <Text
                style={[
                  styles.weekNavTitle,
                  { fontFamily: semiBoldFontFamily },
                ]}
              >
                {capitalize(formatMonthLabel(viewMonthKey))}
              </Text>
              <Icon
                name={monthGridOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={styles.navChevron?.color}
              />
            </View>
          </TouchableOpacity>
          {navButton(nextMonthKey, "chevron-right", "next month", onPickMonth)}
        </View>
      ) : null}

      {monthGridOpen ? (
        <View style={styles.monthGrid}>
          <View style={styles.monthGridYearRow}>
            <TouchableOpacity
              style={styles.monthGridYearButton}
              onPress={() => setGridYear((year) => year - 1)}
              activeOpacity={0.85}
            >
              <Icon
                name="chevron-left"
                size={20}
                color={styles.navChevron?.color}
              />
            </TouchableOpacity>
            <Text style={styles.monthGridYear}>{gridYear}</Text>
            <TouchableOpacity
              style={[
                styles.monthGridYearButton,
                gridYear >= maxYear && styles.weekNavButtonDisabled,
              ]}
              onPress={() => setGridYear((year) => year + 1)}
              disabled={gridYear >= maxYear}
              activeOpacity={0.85}
            >
              <Icon
                name="chevron-right"
                size={20}
                color={styles.navChevron?.color}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.monthGridCells}>
            {Array.from({ length: 12 }, (_, index) => {
              const monthKey = `${gridYear}-${String(index + 1).padStart(2, "0")}`;
              const isOn = monthKey === monthKeyOf(focusedDate);
              const disabled = monthKey > maxMonthKey;
              return (
                <TouchableOpacity
                  key={monthKey}
                  style={[
                    styles.monthGridCell,
                    isOn && styles.monthGridCellOn,
                    disabled && styles.weekNavButtonDisabled,
                  ]}
                  onPress={() => {
                    setMonthGridOpen(false);
                    onPickMonth(monthKey);
                  }}
                  disabled={disabled}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.monthGridCellText,
                      isOn && styles.monthGridCellTextOn,
                    ]}
                  >
                    {capitalize(formatMonthShort(monthKey))}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {viewMode === "week" ? (
        <View style={styles.weekNavRow}>
          {navButton(prevWeek, "chevron-left", "previous week")}
          <View style={styles.weekNavTitleBox}>
            <Text
              style={[styles.weekNavTitle, { fontFamily: semiBoldFontFamily }]}
            >
              {t("schedule.week", { number: weekNumber })}
            </Text>
          </View>
          {navButton(nextWeek, "chevron-right", "next week")}
        </View>
      ) : null}

      {viewMode === "month" ? (
        <View style={styles.weekStrip}>
          {CALENDAR_WEEKDAYS.map((fallback, columnIndex) => (
            <Text key={fallback} style={styles.monthWeekdayHeader}>
              {(Array.isArray(weekdayLabels)
                ? weekdayLabels[columnIndex]
                : null) || fallback}
            </Text>
          ))}
        </View>
      ) : null}
      {viewMode === "period"
        ? null
        : (viewMode === "month" ? monthWeeks : [weekKeys]).map((keys) => (
            <View
              key={keys[0]}
              style={[
                styles.weekStrip,
                viewMode === "month" && styles.monthStrip,
              ]}
            >
              {keys.map((dateKey, columnIndex) =>
                renderDay(dateKey, columnIndex, viewMode === "month"),
              )}
            </View>
          ))}
    </View>
  );
}

// The day's hours as one bar: normal in blue, övertid in orange — paler
// while the övertid still waits for a manager.
export function HoursBar({
  styles,
  totalMs,
  overtimeMs,
  obMs = 0,
  pending,
  onAccent,
  wide,
}) {
  const overtime = Math.min(overtimeMs || 0, totalMs);
  const ob = Math.min(obMs || 0, Math.max(0, totalMs - overtime));
  const normal = totalMs - overtime - ob;
  return (
    <View
      style={[
        styles.hoursBar,
        wide && styles.hoursBarWide,
        onAccent && styles.hoursBarOnAccent,
      ]}
      testID="shifts-hours-bar"
    >
      {normal > 0 ? (
        <View
          style={[
            styles.hoursBarNormal,
            onAccent && styles.hoursBarNormalOnAccent,
            { flex: normal },
          ]}
        />
      ) : null}
      {overtime > 0 ? (
        <View
          style={[
            styles.hoursBarOvertime,
            pending && styles.hoursBarPending,
            { flex: overtime },
          ]}
        />
      ) : null}
      {ob > 0 ? <View style={[styles.hoursBarOb, { flex: ob }]} /> : null}
    </View>
  );
}

// "Normal 8 h", "Övertid 2 h" and "OB 1 h" with their status, in a shift
// card when the day has övertid or OB; a manager gets Godkänn / Neka while
// any of it waits.
function PayStatusRow({ styles, t, label, ms, pending, valueStyle }) {
  return (
    <View style={styles.overtimeRow}>
      <Text style={styles.overtimeLabel}>{label}</Text>
      <View style={styles.overtimeValueGroup}>
        {pending ? null : (
          <Text style={[styles.overtimeChip, styles.overtimeChipOk]}>
            {t("shifts.overtimeApproved")}
          </Text>
        )}
        <Text style={[styles.overtimeValue, valueStyle]}>
          {formatDurationCompact(ms)}
        </Text>
      </View>
    </View>
  );
}

export function ShiftOvertime({
  shift,
  styles,
  t,
  semiBoldFontFamily,
  canDecide,
  busy,
  onDecide,
}) {
  const overtimeMs = Number(shift.overtimeMs) || 0;
  const obMs = Number(shift.obMs) || 0;
  if (!overtimeMs && !obMs) return null;
  const totalMs =
    shift.manualDurationMs != null
      ? Number(shift.manualDurationMs)
      : Number(shift.durationMs) || 0;
  const overtimePending = overtimeMs > 0 && shift.overtimeStatus !== "approved";
  const obPending = obMs > 0 && shift.obStatus !== "approved";
  const pending = overtimePending || obPending;

  return (
    <View style={styles.overtimeBox}>
      <HoursBar
        styles={styles}
        wide
        totalMs={Math.max(totalMs, overtimeMs + obMs)}
        overtimeMs={overtimeMs}
        obMs={obMs}
        pending={overtimePending}
      />
      <View style={styles.overtimeRow}>
        <Text style={styles.overtimeLabel}>
          {t("dayReport.hourType.normal")}
        </Text>
        <Text style={styles.overtimeValue}>
          {formatDurationCompact(Math.max(0, totalMs - overtimeMs - obMs))}
        </Text>
      </View>
      {overtimeMs ? (
        <PayStatusRow
          styles={styles}
          t={t}
          label={t("dayReport.hourType.overtime")}
          ms={overtimeMs}
          pending={overtimePending}
          valueStyle={styles.overtimeValueOrange}
        />
      ) : null}
      {obMs ? (
        <PayStatusRow
          styles={styles}
          t={t}
          label={t("shifts.ob")}
          ms={obMs}
          pending={obPending}
          valueStyle={styles.dayEntryStepValueOb}
        />
      ) : null}
      {canDecide && pending ? (
        <View style={styles.overtimeActions}>
          <TouchableOpacity
            style={styles.overtimeDeny}
            onPress={() => onDecide(false)}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.overtimeDenyText,
                { fontFamily: semiBoldFontFamily },
              ]}
            >
              {t("shifts.denyOvertime")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.overtimeApprove}
            onPress={() => onDecide(true)}
            disabled={busy}
            activeOpacity={0.85}
            testID="shifts-approve-overtime"
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.overtimeApproveText,
                  { fontFamily: semiBoldFontFamily },
                ]}
              >
                {t("shifts.approveOvertime")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// The chosen period at a glance: all hours, then each payslip line, then the
// hours month by month.
export function PeriodSummary({ summary, styles, t, semiBoldFontFamily }) {
  if (!summary) {
    return (
      <View style={styles.dayEntryCard}>
        <ActivityIndicator />
      </View>
    );
  }
  const { totals, rows } = summary;
  const normalMs = Math.max(0, totals.ms - totals.overtimeMs - totals.obMs);
  const lines = [
    [t("dayReport.hourType.normal"), formatDurationCompact(normalMs), null],
    totals.overtimeMs > 0 && [
      t("dayReport.hourType.overtime"),
      formatDurationCompact(totals.overtimeMs),
      styles.overtimeValueOrange,
    ],
    totals.obMs > 0 && [
      t("shifts.ob"),
      formatDurationCompact(totals.obMs),
      styles.dayEntryStepValueOb,
    ],
    totals.travelH > 0 && [
      t("shifts.travelTime"),
      formatDurationCompact(Math.round(totals.travelH * 3600000)),
      null,
    ],
    totals.km > 0 && [
      `${t("shifts.car")} (km)`,
      String(Math.round(totals.km)),
      null,
    ],
    totals.perDiemHalf + totals.perDiemFull > 0 && [
      t("dayReport.perDiem"),
      [
        totals.perDiemFull
          ? `${totals.perDiemFull} × ${t("dayReport.perDiemOption.full")}`
          : null,
        totals.perDiemHalf
          ? `${totals.perDiemHalf} × ${t("dayReport.perDiemOption.half")}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      null,
    ],
  ].filter(Boolean);

  return (
    <View style={styles.dayEntryCard}>
      <View style={styles.dayEntryValueRow}>
        <Text style={styles.dayEntryLabel}>{t("shifts.totalHours")}</Text>
        <Text
          style={[styles.periodTotalValue, { fontFamily: semiBoldFontFamily }]}
        >
          {formatDurationCompact(totals.ms)}
        </Text>
      </View>
      {lines.map(([label, value, valueStyle]) => (
        <View key={label} style={styles.overtimeRow}>
          <Text style={styles.overtimeLabel}>{label}</Text>
          <Text style={[styles.overtimeValue, valueStyle]}>{value}</Text>
        </View>
      ))}
      {rows.length > 1 ? (
        <>
          <Text style={styles.dayEntrySection}>{t("shifts.view.month")}</Text>
          {rows.map((row) => (
            <View key={row.month} style={styles.overtimeRow}>
              <Text style={styles.overtimeLabel}>
                {capitalize(formatMonthLabel(row.month))}
              </Text>
              <Text style={styles.overtimeValue}>
                {formatDurationCompact(row.ms)}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

// One pay line of the day card with − / + (OB, Restid, Bil).
function DayStepRow({
  styles,
  label,
  value,
  valueStyle,
  onStep,
  step,
  semiBoldFontFamily,
}) {
  return (
    <View style={styles.dayEntryOvertimeRow}>
      <Text style={styles.dayEntryLabel}>{label}</Text>
      <View style={styles.dayEntryStepper}>
        <TouchableOpacity
          style={styles.dayEntryStep}
          onPress={() => onStep(-step)}
          activeOpacity={0.7}
          accessibilityLabel={`${label} −`}
        >
          <Icon name="minus" size={18} color={styles.weekNavIcon?.color} />
        </TouchableOpacity>
        <Text
          style={[
            styles.dayEntryStepValue,
            valueStyle,
            { fontFamily: semiBoldFontFamily },
          ]}
        >
          {value}
        </Text>
        <TouchableOpacity
          style={styles.dayEntryStep}
          onPress={() => onStep(step)}
          activeOpacity={0.7}
          accessibilityLabel={`${label} +`}
        >
          <Icon name="plus" size={18} color={styles.weekNavIcon?.color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// A typed pay line like Arbetstimmar: ✎ focuses the number, typed in place
// (Restid, Bil). On the right ↺ copies the last day's value; saving is the
// one ✓ above.
function DayInputRow({
  styles,
  t,
  semiBoldFontFamily,
  label,
  value,
  decimal,
  onChange,
  copyValue,
  onCopy,
}) {
  const inputRef = React.useRef(null);
  const shown = value ? String(value).replace(".", ",") : "";
  return (
    <View style={styles.dayEntryOvertimeRow}>
      <Text style={styles.dayEntryLabel}>{label}</Text>
      <View style={styles.dayEntryStepper}>
        <TouchableOpacity
          style={styles.dayEntryStep}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={0.7}
          accessibilityLabel={`${label} ${t("shifts.editHours")}`}
        >
          <Icon name="edit-2" size={16} color={styles.weekNavIcon?.color} />
        </TouchableOpacity>
        <View style={styles.dayEntryHoursCell}>
          <TextInput
            ref={inputRef}
            style={[
              styles.dayEntryHoursInput,
              { fontFamily: semiBoldFontFamily },
            ]}
            defaultValue={shown}
            onChangeText={(text) => {
              const clean = text.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, "");
              onChange(parseFloat(clean.replace(",", ".")) || 0);
            }}
            keyboardType={decimal ? "decimal-pad" : "number-pad"}
            selectTextOnFocus
            placeholder="0"
            placeholderTextColor={styles.dayEntryHint?.color}
          />
        </View>
        {copyValue != null && onCopy ? (
          <TouchableOpacity
            style={styles.dayEntryStep}
            onPress={() => onCopy(copyValue)}
            activeOpacity={0.7}
            accessibilityLabel={`${label}: ${t("shifts.sameAsLast")}`}
          >
            <Icon
              name="rotate-ccw"
              size={16}
              color={styles.weekNavIcon?.color}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.dayEntryStepSlot} />
        )}
      </View>
    </View>
  );
}

// Pick-one chips under a label (Traktamente, Frånvaro).
function DayChoiceRow({ styles, label, options, value, onPick, disabled }) {
  return (
    <View style={styles.dayEntryChoice}>
      <Text style={styles.dayEntryLabel}>{label}</Text>
      <View style={styles.dayEntryChips}>
        {options.map(([key, text]) => {
          const active = key === value;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.dayEntryChip, active && styles.dayEntryChipActive]}
              onPress={() => onPick(key)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayEntryChipText,
                  active && styles.dayEntryChipTextActive,
                ]}
              >
                {text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ABSENCE_TYPES = ["sick", "vab", "vacation", "parental", "leave"];

// The day's absence: what was reported (and whether the manager agreed), or
// the types to report one with.
function DayAbsenceRow({ styles, t, absence, onReport, saving }) {
  const [open, setOpen] = React.useState(false);
  if (absence) {
    return (
      <View style={styles.dayEntryValueRow}>
        <Text style={styles.dayEntryLabel}>{t("shifts.absence")}</Text>
        <Text style={styles.dayEntryAbsenceValue}>
          {`${t(`schedule.leaveTypes.${absence.type}`)} · ${
            absence.status === "approved"
              ? t("shifts.overtimeApproved")
              : t("shifts.absencePending")
          }`}
        </Text>
      </View>
    );
  }
  // Folded to one line until asked for, so it doesn't compete with the hours.
  if (!open) {
    return (
      <TouchableOpacity
        style={styles.dayEntryValueRow}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dayEntryLabel}>{t("shifts.absence")}</Text>
        <Text style={styles.dayEntryLink}>{`＋ ${t("dayReport.add")}`}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <DayChoiceRow
      styles={styles}
      label={t("shifts.absence")}
      options={ABSENCE_TYPES.map((type) => [
        type,
        t(`schedule.leaveTypes.${type}`),
      ])}
      value={null}
      onPick={onReport}
      disabled={saving}
    />
  );
}

// Manual hours for the chosen day, typed in a card under the week controls.
// The value lands in the pending map like before and is saved with the header
// check or the Save button here. What goes over the day's plan is proposed as
// övertid; − / + change it.
export function DayHoursEntry({
  styles,
  t,
  semiBoldFontFamily,
  isEditing,
  seed,
  inlineValueRef,
  onStashInput,
  onChangeTotal,
  split,
  onStepOvertime,
  onEdit,
  onSave,
  saving,
  pendingHours,
  pendingOvertime,
  hasShifts,
  onLayout,
  extras,
  onChangeExtra,
  absence,
  onReportAbsence,
  savingAbsence,
  dayShift,
  onOpenDayReport,
  previousTravel,
  extrasVersion = 0,
}) {
  const [noteOpen, setNoteOpen] = React.useState(false);
  const hoursInputRef = React.useRef(null);
  const absenceRow = onReportAbsence ? (
    <DayAbsenceRow
      styles={styles}
      t={t}
      absence={absence}
      onReport={onReportAbsence}
      saving={savingAbsence}
    />
  ) : null;
  const saveButton = (
    <TouchableOpacity
      style={styles.dayEntryPrimary}
      onPress={onSave}
      disabled={saving}
      activeOpacity={0.85}
    >
      {saving ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text
          style={[
            styles.dayEntryPrimaryText,
            { fontFamily: semiBoldFontFamily },
          ]}
        >
          {t("common.save")}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isEditing) {
    return (
      <View style={styles.dayEntryCard} onLayout={onLayout}>
        {split ? (
          <>
            {split.total > 0 ? (
              <HoursBar
                styles={styles}
                wide
                totalMs={split.total * 3600000}
                overtimeMs={split.overtime * 3600000}
                obMs={split.ob * 3600000}
              />
            ) : null}
            <Text style={styles.dayEntryHint}>
              {t("shifts.dayTotal", {
                total: formatDurationCompact(Math.round(split.total * 3600000)),
                plan: formatDurationCompact(Math.round(split.plan * 3600000)),
              })}
            </Text>
          </>
        ) : null}
        <View style={styles.dayEntryOvertimeRow}>
          <Text style={styles.dayEntryLabel}>{t("shifts.workHours")}</Text>
          {/* Same columns as the − / + rows, so every number sits in one
              line; the hours are typed into the round cell in the middle. */}
          <View style={styles.dayEntryStepper}>
            <TouchableOpacity
              style={styles.dayEntryStep}
              onPress={() => hoursInputRef.current?.focus()}
              activeOpacity={0.7}
              accessibilityLabel={t("shifts.editHours")}
            >
              <Icon name="edit-2" size={16} color={styles.weekNavIcon?.color} />
            </TouchableOpacity>
            <View style={styles.dayEntryHoursCell}>
              <TextInput
                ref={hoursInputRef}
                style={[
                  styles.dayEntryHoursInput,
                  { fontFamily: semiBoldFontFamily },
                ]}
                defaultValue={seed}
                onChangeText={(text) => {
                  const clean = text.replace(/[^0-9.,]/g, "").slice(0, 5);
                  inlineValueRef.current = clean;
                  onChangeTotal?.(clean);
                }}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
                placeholder="0"
                placeholderTextColor="#9BB0C1"
                onSubmitEditing={onStashInput}
                onBlur={onStashInput}
              />
            </View>
            <TouchableOpacity
              style={[styles.dayEntryStep, styles.dayEntryStepSave]}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.85}
              accessibilityLabel={t("common.save")}
              testID="shifts-save-hours"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {split ? (
          <>
            <View style={styles.dayEntryOvertimeRow}>
              <Text style={styles.dayEntryLabel}>
                {t("dayReport.hourType.overtime")}
              </Text>
              <View style={styles.dayEntryStepper}>
                <TouchableOpacity
                  style={styles.dayEntryStep}
                  onPress={() => onStepOvertime(-0.5)}
                  activeOpacity={0.7}
                  accessibilityLabel="less overtime"
                >
                  <Icon
                    name="minus"
                    size={18}
                    color={styles.weekNavIcon?.color}
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.dayEntryStepValue,
                    { fontFamily: semiBoldFontFamily },
                  ]}
                >
                  {formatDurationShort(Math.round(split.overtime * 3600000))}
                </Text>
                <TouchableOpacity
                  style={styles.dayEntryStep}
                  onPress={() => onStepOvertime(0.5)}
                  activeOpacity={0.7}
                  accessibilityLabel="more overtime"
                >
                  <Icon
                    name="plus"
                    size={18}
                    color={styles.weekNavIcon?.color}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}
        {extras && onChangeExtra ? (
          <>
            <DayStepRow
              styles={styles}
              semiBoldFontFamily={semiBoldFontFamily}
              label={t("shifts.ob")}
              value={formatDurationShort(Math.round(extras.ob * 3600000))}
              valueStyle={styles.dayEntryStepValueOb}
              step={0.5}
              onStep={(delta) => onChangeExtra("ob", delta)}
            />
            <Text style={styles.dayEntrySection}>
              {t("dayReport.travelLabel")}
            </Text>
            <DayInputRow
              key={`travel-${extrasVersion}`}
              styles={styles}
              t={t}
              semiBoldFontFamily={semiBoldFontFamily}
              label={t("shifts.travelTime")}
              value={extras.travel}
              decimal
              onChange={(value) => onChangeExtra("travelSet", value)}
              copyValue={
                previousTravel?.travel > 0 &&
                previousTravel.travel !== extras.travel
                  ? previousTravel.travel
                  : null
              }
              onCopy={(value) => onChangeExtra("copyTravel", value)}
            />
            <DayInputRow
              key={`km-${extrasVersion}`}
              styles={styles}
              t={t}
              semiBoldFontFamily={semiBoldFontFamily}
              label={`${t("shifts.car")} (km)`}
              value={extras.km}
              onChange={(value) => onChangeExtra("kmSet", value)}
              copyValue={
                previousTravel?.km > 0 && previousTravel.km !== extras.km
                  ? previousTravel.km
                  : null
              }
              onCopy={(value) => onChangeExtra("copyKm", value)}
            />
            <DayChoiceRow
              styles={styles}
              label={t("dayReport.perDiem")}
              options={["none", "half", "full"].map((key) => [
                key,
                t(`dayReport.perDiemOption.${key}`),
              ])}
              value={extras.perDiem || "none"}
              onPick={(key) => onChangeExtra("perDiem", key)}
            />
          </>
        ) : null}
        {absenceRow}
        {onOpenDayReport
          ? [
              [
                "photos",
                t("shifts.photos"),
                Array.isArray(dayShift?.photos) && dayShift.photos.length
                  ? String(dayShift.photos.length)
                  : null,
              ],
              ["expenses", t("shifts.receipts"), null],
            ].map(([focus, label, count]) => (
              <TouchableOpacity
                key={focus}
                style={styles.dayEntryValueRow}
                onPress={() => onOpenDayReport(focus)}
                activeOpacity={0.7}
              >
                <Text style={styles.dayEntryLabel}>{label}</Text>
                <Text
                  style={count ? styles.dayEntryCount : styles.dayEntryLink}
                >
                  {count || `＋ ${t("dayReport.add")}`}
                </Text>
              </TouchableOpacity>
            ))
          : null}
        {extras && onChangeExtra ? (
          noteOpen || extras.note ? (
            <View style={styles.dayEntryChoice}>
              <Text style={styles.dayEntryLabel}>{t("shifts.comment")}</Text>
              <TextInput
                style={styles.dayEntryNote}
                defaultValue={extras.note}
                onChangeText={(text) => onChangeExtra("note", text)}
                multiline
                autoFocus={noteOpen && !extras.note}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dayEntryValueRow}
              onPress={() => setNoteOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dayEntryLabel}>{t("shifts.comment")}</Text>
              <Text style={styles.dayEntryLink}>
                {`＋ ${t("dayReport.add")}`}
              </Text>
            </TouchableOpacity>
          )
        ) : null}
      </View>
    );
  }

  if (pendingHours != null) {
    const totalMs = Math.round(pendingHours * 3600000);
    const overtimeMs = Math.round((pendingOvertime || 0) * 3600000);
    return (
      <View style={styles.dayEntryCard} onLayout={onLayout}>
        <View style={styles.dayEntryValueRow}>
          <Text style={styles.dayEntryLabel}>{t("shifts.manualHours")}</Text>
          <TouchableOpacity onPress={onEdit} activeOpacity={0.6}>
            <Text style={styles.dayEntryValue}>
              {formatDurationCompact(totalMs)}
            </Text>
          </TouchableOpacity>
        </View>
        {overtimeMs > 0 ? (
          <>
            <HoursBar
              styles={styles}
              wide
              totalMs={totalMs}
              overtimeMs={overtimeMs}
              pending
            />
            <Text style={styles.dayEntryHint}>
              {t("shifts.overtimeSplitShort", {
                normal: formatDurationCompact(totalMs - overtimeMs),
                overtime: formatDurationCompact(overtimeMs),
              })}
            </Text>
          </>
        ) : null}
        {saveButton}
      </View>
    );
  }

  if (hasShifts) {
    return (
      <TouchableOpacity
        style={styles.dayEntrySecondary}
        onPress={onEdit}
        onLayout={onLayout}
        activeOpacity={0.85}
      >
        <Icon name="edit-2" size={16} color={styles.weekNavIcon?.color} />
        <Text
          style={[
            styles.dayEntrySecondaryText,
            { fontFamily: semiBoldFontFamily },
          ]}
        >
          {t("shifts.editHours")}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.dayEntryCard} onLayout={onLayout}>
      {absence ? null : (
        <Text style={styles.dayEntryEmpty}>{t("shifts.noShiftsDay")}</Text>
      )}
      <TouchableOpacity
        style={styles.dayEntryPrimary}
        onPress={onEdit}
        activeOpacity={0.85}
        testID="shifts-add-hours"
      >
        <Text
          style={[
            styles.dayEntryPrimaryText,
            { fontFamily: semiBoldFontFamily },
          ]}
        >
          {`＋ ${t("shifts.addHours")}`}
        </Text>
      </TouchableOpacity>
      {absenceRow}
    </View>
  );
}
