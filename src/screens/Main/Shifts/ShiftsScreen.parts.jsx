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

import {
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
                {t("shiftHistory.export")}
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
