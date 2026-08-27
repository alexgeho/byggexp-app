import React from "react";
import {
  ActivityIndicator,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Feather";

import {
  formatDurationCompact,
  formatDurationShort,
  formatExportPickerDate,
  formatMonthLabel,
  parseDateKey,
} from "../../../utils/shifts";

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
  manualHoursH,
  setManualHoursH,
  manualHoursM,
  setManualHoursM,
  savingManualHours,
  onSave,
  onClear,
  styles,
  t,
}) {
  return (
    <Modal
      visible={Boolean(manualHoursShift) || Boolean(manualDateEntry)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>
            {t("shifts.manualHoursTitle")}
          </Text>
          <Text style={styles.manualHoursHint}>
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
              <Text style={styles.manualHoursUnit}>{t("shifts.unitHour")}</Text>
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

          {manualHoursShift?.manualDurationMs != null ? (
            <TouchableOpacity
              style={styles.manualHoursClearButton}
              onPress={onClear}
              disabled={savingManualHours}
            >
              <Text style={styles.manualHoursClearText}>
                {t("shifts.manualHoursClear")}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.manualHoursCancelButton}
            onPress={onClose}
            disabled={savingManualHours}
          >
            <Text style={styles.manualHoursCancelText}>
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
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
            <Text
              style={[
                styles.sourceBtnText,
                { fontFamily: mediumFontFamily },
                on && { color: s.color },
              ]}
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

// Two-stat summary card: current-month (or selected) total on the left, the
// previous month (or selected-day count) on the right, with a clear button
// while a day selection is active.
export function SelectionSummary({
  heroValueMs,
  previousMonthDuration,
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
          {formatDurationCompact(heroValueMs)}
        </Text>
        <Text style={styles.selectionSummaryLabel}>
          {hasSelection ? t("shifts.selected") : t("shifts.currentMonth")}
        </Text>
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
            : formatDurationCompact(previousMonthDuration)}
        </Text>
        <Text style={styles.selectionSummaryLabel}>
          {hasSelection ? t("shifts.selected") : t("shifts.previousMonth")}
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

// The month calendar: prev/next month bar, weekday header and the day grid.
// The grid rows are memoized on the same deps the screen used, so extracting
// this doesn't lose the memoization. Refs (rowYRef for keyboard scrolling,
// inlineValueRef for the in-cell input) are threaded in as props.
export function ShiftCalendar({
  styles,
  t,
  calendarYRef,
  canGoBackMonth,
  canGoForwardMonth,
  onPrevMonth,
  onNextMonth,
  selectedMonth,
  semiBoldFontFamily,
  weekdayLabels,
  onToggleColumn,
  calendarLayout,
  dayMap,
  selectedDates,
  todayDateKey,
  onDayPress,
  onEditDay,
  canEditDay,
  selectMode,
  onToggleWeekRow,
  daySourceMs,
  sourceColor,
  hoursSource,
  inlineManualDate,
  inlineManualSeed,
  inlineValueRef,
  onStashInput,
  pendingManual,
  rowYRef,
}) {
  const rows = React.useMemo(() => {
    return calendarLayout.rows.map((row) => (
      <View
        key={`row-${row.rowIndex}`}
        style={styles.calendarRow}
        onLayout={(e) => {
          const { y } = e.nativeEvent.layout;
          row.cells.forEach((cellDate) => {
            if (cellDate) {
              rowYRef.current[cellDate] = y;
            }
          });
        }}
      >
        <TouchableOpacity
          style={styles.calendarWeekNumberCell}
          onPress={() => onToggleWeekRow(row.rowIndex)}
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
            const savedMs = daySourceMs(shiftDay);
            const pendingHours = pendingManual[dateStr];
            const hasPending = hoursSource === "manual" && pendingHours != null;
            const displayMs = hasPending
              ? Math.round(pendingHours * 3600000)
              : savedMs;
            const isSelected = selectedDates.includes(dateStr);
            const isToday = dateStr === todayDateKey;

            const isInlineEditing =
              hoursSource === "manual" && inlineManualDate === dateStr;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calendarCell,
                  displayMs > 0 &&
                    !isSelected && {
                      backgroundColor: `${sourceColor}1A`,
                    },
                  isToday && !isSelected && styles.calendarCellToday,
                  isSelected && styles.calendarCellSelected,
                ]}
                onPress={() => onDayPress(dateStr)}
                activeOpacity={0.85}
              >
                {hasPending ? <View style={styles.pendingDot} /> : null}
                {selectMode ? (
                  <View
                    style={[
                      styles.calendarCheck,
                      isSelected && styles.calendarCheckOn,
                    ]}
                  >
                    {isSelected ? (
                      <Icon name="check" size={10} color="#FFFFFF" />
                    ) : null}
                  </View>
                ) : null}
                <Text
                  style={[
                    styles.calendarDay,
                    isToday && !isSelected && styles.calendarDayToday,
                    isSelected && styles.calendarDaySelected,
                  ]}
                >
                  {day}
                </Text>
                {isInlineEditing ? (
                  <TextInput
                    style={styles.calendarHoursInput}
                    defaultValue={inlineManualSeed}
                    onChangeText={(text) => {
                      inlineValueRef.current = text
                        .replace(/[^0-9.,]/g, "")
                        .slice(0, 5);
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
                ) : displayMs > 0 ? (
                  canEditDay ? (
                    <TouchableOpacity
                      onPress={() => onEditDay(dateStr)}
                      hitSlop={{ top: 6, bottom: 8, left: 12, right: 12 }}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.calendarHours,
                          !isSelected && { color: sourceColor },
                        ]}
                      >
                        {formatDurationShort(displayMs)}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={[
                        styles.calendarHours,
                        !isSelected && { color: sourceColor },
                      ]}
                    >
                      {formatDurationShort(displayMs)}
                    </Text>
                  )
                ) : canEditDay ? (
                  <TouchableOpacity
                    onPress={() => onEditDay(dateStr)}
                    hitSlop={{ top: 6, bottom: 8, left: 12, right: 12 }}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.calendarPlus,
                        isSelected && styles.calendarPlusSelected,
                      ]}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
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
    onDayPress,
    onEditDay,
    canEditDay,
    selectMode,
    onToggleWeekRow,
    daySourceMs,
    sourceColor,
    hoursSource,
    inlineManualDate,
    inlineManualSeed,
    pendingManual,
    onStashInput,
    styles,
    rowYRef,
    inlineValueRef,
  ]);

  return (
    <View
      style={styles.calendarContainer}
      onLayout={(e) => {
        calendarYRef.current = e.nativeEvent.layout.y;
      }}
    >
      <View style={styles.calendarMonthBar}>
        <View style={styles.calendarNav}>
          <TouchableOpacity
            style={[
              styles.calendarNavButton,
              !canGoBackMonth && styles.calendarNavButtonDisabled,
            ]}
            onPress={onPrevMonth}
            disabled={!canGoBackMonth}
            activeOpacity={0.85}
          >
            <Icon name="chevron-left" size={16} color="#0177DE" />
          </TouchableOpacity>
          <Text
            style={[
              styles.calendarNavLabel,
              { fontFamily: semiBoldFontFamily },
            ]}
          >
            {selectedMonth ? formatMonthLabel(selectedMonth) : ""}
          </Text>
          <TouchableOpacity
            style={[
              styles.calendarNavButton,
              !canGoForwardMonth && styles.calendarNavButtonDisabled,
            ]}
            onPress={onNextMonth}
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
          {CALENDAR_WEEKDAYS.map((label, columnIndex) => (
            <TouchableOpacity
              key={label}
              style={styles.calendarHeaderDayButton}
              onPress={() => onToggleColumn(columnIndex)}
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
      {rows.length ? (
        rows
      ) : (
        <Text style={styles.emptyMonthText}>{t("shifts.emptyMonth")}</Text>
      )}
    </View>
  );
}
