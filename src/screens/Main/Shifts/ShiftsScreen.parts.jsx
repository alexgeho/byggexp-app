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
  formatDayTitle,
  formatDurationCompact,
  formatDurationShort,
  formatExportPickerDate,
  formatMonthLabel,
  formatMonthShort,
  formatWeekRange,
  parseDateKey,
} from "../../../utils/shifts";
import {
  addDaysToKey,
  getISOWeekNumber,
  monthKeyOf,
  weekDateKeys,
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
            onPress={onExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.exportMainButtonText}>
                {t(
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
  const prevDay = step(-1);
  const nextDay = step(1);
  const isToday = focusedDate === todayDateKey;

  const toggleMonthGrid = () => {
    setGridYear(Number(focusedDate.slice(0, 4)));
    setMonthGridOpen((open) => !open);
  };

  const navButton = (target, icon, label) => (
    <TouchableOpacity
      style={[styles.weekNavButton, !target && styles.weekNavButtonDisabled]}
      onPress={() => target && onFocusDate(target)}
      disabled={!target}
      activeOpacity={0.85}
      accessibilityLabel={label}
    >
      <Icon name={icon} size={22} color={styles.weekNavIcon?.color} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.weekCard}>
      <View style={styles.weekMonthRow}>
        <TouchableOpacity
          style={styles.weekMonthButton}
          onPress={toggleMonthGrid}
          activeOpacity={0.85}
          testID="shifts-month-button"
        >
          <Text
            style={[styles.weekMonthText, { fontFamily: semiBoldFontFamily }]}
          >
            {capitalize(formatMonthLabel(monthKeyOf(focusedDate)))}
          </Text>
          <Icon
            name={monthGridOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={styles.weekNavIcon?.color}
          />
        </TouchableOpacity>
        {!isToday ? (
          <TouchableOpacity
            style={styles.todayChip}
            onPress={() => {
              setMonthGridOpen(false);
              onFocusDate(todayDateKey);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.todayChipText}>{t("chat.today")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

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
                color={styles.weekNavIcon?.color}
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
                color={styles.weekNavIcon?.color}
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

      <View style={styles.weekNavRow}>
        {navButton(prevWeek, "chevron-left", "previous week")}
        <View style={styles.weekNavTitleBox}>
          <Text
            style={[styles.weekNavTitle, { fontFamily: semiBoldFontFamily }]}
          >
            {t("schedule.week", { number: weekNumber })}
          </Text>
          <Text style={styles.weekNavSub}>
            {formatWeekRange(weekKeys[0], weekKeys[6])}
          </Text>
        </View>
        {navButton(nextWeek, "chevron-right", "next week")}
      </View>

      <View style={styles.weekStrip}>
        {weekKeys.map((dateKey, columnIndex) => {
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
                displayMs > 0 &&
                  !isOn && { backgroundColor: `${sourceColor}1A` },
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
                <View
                  style={[styles.calendarCheck, isOn && styles.calendarCheckOn]}
                >
                  {isOn ? (
                    <Icon name="check" size={10} color="#FFFFFF" />
                  ) : null}
                </View>
              ) : null}
              <Text style={[styles.weekDayName, isOn && styles.weekDayTextOn]}>
                {(Array.isArray(weekdayLabels)
                  ? weekdayLabels[columnIndex]
                  : null) || CALENDAR_WEEKDAYS[columnIndex]}
              </Text>
              <Text
                style={[
                  styles.weekDayNumber,
                  { fontFamily: semiBoldFontFamily },
                  isOn && styles.weekDayTextOn,
                ]}
              >
                {Number(dateKey.slice(8))}
              </Text>
              <Text
                style={[
                  styles.weekDayHours,
                  displayMs > 0
                    ? { color: sourceColor }
                    : styles.weekDayHoursEmpty,
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
        })}
      </View>

      {!selectMode ? (
        <View style={[styles.weekNavRow, styles.dayBar]}>
          {navButton(prevDay, "chevron-left", "previous day")}
          <View style={styles.weekNavTitleBox}>
            <Text
              style={[styles.dayBarTitle, { fontFamily: semiBoldFontFamily }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatDayTitle(focusedDate)}
            </Text>
            {isToday ? (
              <Text style={styles.weekNavSub}>{t("chat.today")}</Text>
            ) : null}
          </View>
          {navButton(nextDay, "chevron-right", "next day")}
        </View>
      ) : null}
    </View>
  );
}

// The day's hours as one bar: normal in blue, övertid in orange — paler
// while the övertid still waits for a manager.
export function HoursBar({
  styles,
  totalMs,
  overtimeMs,
  pending,
  onAccent,
  wide,
}) {
  const overtime = Math.min(overtimeMs, totalMs);
  return (
    <View
      style={[
        styles.hoursBar,
        wide && styles.hoursBarWide,
        onAccent && styles.hoursBarOnAccent,
      ]}
      testID="shifts-hours-bar"
    >
      {totalMs - overtime > 0 ? (
        <View
          style={[
            styles.hoursBarNormal,
            onAccent && styles.hoursBarNormalOnAccent,
            { flex: totalMs - overtime },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.hoursBarOvertime,
          pending && styles.hoursBarPending,
          { flex: overtime },
        ]}
      />
    </View>
  );
}

// "Normal 8 h" and "Övertid 2 h" with its status, in a shift card when the
// day has övertid; a manager gets Godkänn / Neka while it waits.
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
  if (!overtimeMs) return null;
  const totalMs =
    shift.manualDurationMs != null
      ? Number(shift.manualDurationMs)
      : Number(shift.durationMs) || 0;
  const pending = shift.overtimeStatus !== "approved";

  return (
    <View style={styles.overtimeBox}>
      <HoursBar
        styles={styles}
        wide
        totalMs={Math.max(totalMs, overtimeMs)}
        overtimeMs={overtimeMs}
        pending={pending}
      />
      <View style={styles.overtimeRow}>
        <Text style={styles.overtimeLabel}>
          {t("dayReport.hourType.normal")}
        </Text>
        <Text style={styles.overtimeValue}>
          {formatDurationCompact(Math.max(0, totalMs - overtimeMs))}
        </Text>
      </View>
      <View style={styles.overtimeRow}>
        <Text style={styles.overtimeLabel}>
          {t("dayReport.hourType.overtime")}
        </Text>
        <View style={styles.overtimeValueGroup}>
          <Text
            style={[
              styles.overtimeChip,
              pending ? styles.overtimeChipPending : styles.overtimeChipOk,
            ]}
          >
            {pending
              ? t("shifts.overtimePending")
              : t("shifts.overtimeApproved")}
          </Text>
          <Text style={[styles.overtimeValue, styles.overtimeValueOrange]}>
            {formatDurationCompact(overtimeMs)}
          </Text>
        </View>
      </View>
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
}) {
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
        <Text style={styles.dayEntryLabel}>{t("shifts.manualHours")}</Text>
        <View style={styles.dayEntryInputRow}>
          <TextInput
            style={[styles.dayEntryInput, { fontFamily: semiBoldFontFamily }]}
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
          <Text style={styles.dayEntryUnit}>h</Text>
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
            {split.total > 0 ? (
              <HoursBar
                styles={styles}
                wide
                totalMs={split.total * 3600000}
                overtimeMs={split.overtime * 3600000}
                pending
              />
            ) : null}
            <Text style={styles.dayEntryHint}>
              {t("shifts.overtimeSplit", {
                normal: formatDurationCompact(
                  Math.round((split.total - split.overtime) * 3600000),
                ),
                overtime: formatDurationCompact(
                  Math.round(split.overtime * 3600000),
                ),
                plan: formatDurationCompact(Math.round(split.plan * 3600000)),
              })}
            </Text>
          </>
        ) : null}
        {saveButton}
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
      <Text style={styles.dayEntryEmpty}>{t("shifts.noShiftsDay")}</Text>
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
    </View>
  );
}
