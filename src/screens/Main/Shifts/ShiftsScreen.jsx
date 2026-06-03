import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "react-native";
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
import {
  formatDuration,
  formatDurationShort,
  formatMonthLabel,
  formatTimeRange,
  resolveUploadUrl,
} from "../../../utils/shifts";

export default function ShiftsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [days, setDays] = useState([]);
  const [currentMonthDuration, setCurrentMonthDuration] = useState(0);
  const [previousMonthDuration, setPreviousMonthDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState("pdf");
  const [exporting, setExporting] = useState(false);
  const [expandedShiftId, setExpandedShiftId] = useState(null);

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
    setSelectedDate((previousDate) => {
      const nextDate =
        previousDate &&
        (data.days || []).some((day) => day.date === previousDate)
          ? previousDate
          : data.days?.[0]?.date || null;
      return nextDate;
    });
  }, []);

  const refreshHistory = useCallback(
    async (preferredMonth) => {
      try {
        setLoading(true);
        const months = await loadMonths();
        const nextMonth = preferredMonth || months[0];
        await loadHistory(nextMonth);
      } catch (error) {
        console.error("Failed to load shifts history:", error);
        setDays([]);
        setAvailableMonths([]);
        setSelectedDate(null);
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

  const selectedDay = selectedDate ? dayMap.get(selectedDate) : null;
  const selectedDayShifts = selectedDay?.shifts || [];
  const selectedDaySummary = useMemo(() => {
    if (!selectedDayShifts.length) {
      return null;
    }

    const shiftCount = selectedDayShifts.length;
    const totalDurationMs =
      selectedDay?.totalDurationMs ??
      selectedDayShifts.reduce(
        (total, shift) => total + (shift.durationMs || 0),
        0,
      );

    return `${shiftCount} ${shiftCount === 1 ? "shift" : "shifts"}, ${formatDuration(totalDurationMs)}`;
  }, [selectedDay, selectedDayShifts]);

  useEffect(() => {
    setExpandedShiftId(null);
  }, [selectedDate]);

  const calendarRows = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }

    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = (new Date(year, month - 1, 1).getDay() + 6) % 7;

    const cells = [];
    for (let index = 0; index < firstDayIndex; index += 1) {
      cells.push(
        <View key={`empty-start-${index}`} style={styles.calendarCellEmpty} />,
      );
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${selectedMonth}-${day.toString().padStart(2, "0")}`;
      const shiftDay = dayMap.get(dateStr);
      const isSelected = selectedDate === dateStr;

      cells.push(
        <TouchableOpacity
          key={dateStr}
          style={[
            styles.calendarCell,
            isSelected && styles.calendarCellSelected,
          ]}
          onPress={() => shiftDay && setSelectedDate(dateStr)}
          disabled={!shiftDay}
        >
          <Text
            style={styles.calendarDay}
          >
            {day}
          </Text>
          {shiftDay ? (
            <Text style={styles.calendarHours}>
              {formatDurationShort(shiftDay.totalDurationMs)}
            </Text>
          ) : null}
        </TouchableOpacity>,
      );
    }

    while (cells.length % 7 !== 0) {
      cells.push(
        <View
          key={`empty-end-${cells.length}`}
          style={styles.calendarCellEmpty}
        />,
      );
    }

    const rows = [];
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(
        <View key={`row-${index}`} style={styles.calendarRow}>
          {cells.slice(index, index + 7)}
        </View>,
      );
    }

    return rows;
  }, [dayMap, selectedDate, selectedMonth]);

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }

    if (!selectedMonth) {
      Alert.alert("No period selected", "Choose a month to export shifts.");
      return;
    }

    try {
      setExporting(true);
      await shiftService.exportReport({
        format: selectedExportType,
        month: selectedMonth,
      });
      setExportModalVisible(false);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to export shifts. Please try again.";
      Alert.alert("Export failed", message);
    } finally {
      setExporting(false);
    }
  }, [exporting, selectedExportType, selectedMonth]);

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
          Work shifts
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
            <Text
              style={[
                styles.exportLabel,
                { fontFamily: theme.text.fontFamily["semiBold"] },
              ]}
            >
              Period for export
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setPickerVisible(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { fontFamily: theme.text.fontFamily["semiBold"] },
                ]}
              >
                {formatMonthLabel(selectedMonth)}
              </Text>
              <Image
                style={styles.dropdownIcon}
                source={require("../../../assets/Arrow-down.png")}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarHeaderDay}>Mon</Text>
              <Text style={styles.calendarHeaderDay}>Tue</Text>
              <Text style={styles.calendarHeaderDay}>Wed</Text>
              <Text style={styles.calendarHeaderDay}>Thu</Text>
              <Text style={styles.calendarHeaderDay}>Fri</Text>
              <Text style={styles.calendarHeaderDay}>Sat</Text>
              <Text style={styles.calendarHeaderDay}>Sun</Text>
            </View>
            {calendarRows.length ? (
              calendarRows
            ) : (
              <Text style={styles.emptyMonthText}>
                No shifts for this period yet.
              </Text>
            )}
          </View>

          <View style={styles.shiftDetailsContainer}>
            <View style={styles.shiftDetailsHeader}>
              <Text
                style={[
                  styles.shiftTitle,
                  { fontFamily: theme.text.fontFamily["regular"] },
                ]}
              >
                Shifts on selected day
              </Text>
              {selectedDaySummary ? (
                <Text
                  style={[
                    styles.shiftSummary,
                    { fontFamily: theme.text.fontFamily["regular"] },
                  ]}
                >
                  {selectedDaySummary}
                </Text>
              ) : null}
            </View>

            <View style={styles.shiftDetailsContent}>
              {selectedDayShifts.length === 0 ? (
                <Text style={styles.emptyDetailsText}>
                  Select a highlighted day to see shift details.
                </Text>
              ) : (
                selectedDayShifts.map((shift) => {
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
                          style={[
                            styles.shiftProjectName,
                            { fontFamily: theme.text.fontFamily["regular"] },
                          ]}
                        >
                          {shift.projectName || "—"}
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
                              Project
                            </Text>
                            <Text
                              style={[
                                styles.shiftDetailValue,
                                { fontFamily: theme.text.fontFamily["regular"] },
                              ]}
                            >
                              {shift.projectName || "—"}
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
                              Location
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
                              Photos
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
                                    <Image
                                      key={`${shift.id}-photo-${index}`}
                                      style={styles.shiftImage}
                                      source={{
                                        uri: resolveUploadUrl(photo.url),
                                      }}
                                    />
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
                                No photos attached
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
              <Text style={styles.statLabel}>Current month:</Text>
              <Text style={styles.statValue}>
                {formatDuration(currentMonthDuration)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Previous month:</Text>
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
        onAddPress={() => setExportModalVisible(true)}
        showAddButton
        renderAddContent={() => (
          <Text style={styles.exportFabText}>Export</Text>
        )}
        addButtonStyle={styles.exportFabButton}
      />

      <Modal
        visible={exportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExportModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.exportModalCard}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text
              style={[
                styles.exportModalTitle,
                { fontFamily: theme.text.fontFamily["semiBold"] },
              ]}
            >
              Export shifts
            </Text>
            <Text style={styles.exportModalSubtitle}>
              Period:{" "}
              {selectedMonth ? formatMonthLabel(selectedMonth) : "Not selected"}
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
                <Text style={styles.exportMainButtonText}>Export</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            {availableMonths.length ? (
              availableMonths.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={styles.monthOption}
                  onPress={async () => {
                    setPickerVisible(false);
                    await refreshHistory(month);
                  }}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                      month === selectedMonth && styles.monthOptionTextSelected,
                    ]}
                  >
                    {formatMonthLabel(month)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.monthOptionText}>No periods yet</Text>
            )}
          </View>
        </TouchableOpacity>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  exportLabel: {
    color: "#052D50",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 24,
    paddingRight: 13,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(7, 133, 244, 0.45)",
    borderRadius: 71,
  },
  dropdownText: {
    color: "rgba(7, 92, 158, 1)",
    fontSize: 15,
    fontWeight: "600",
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: "rgba(7, 92, 158, 1)",
  },
  calendarContainer: {
    width: "100%",
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarHeaderDay: {
    color: "#698196",
    fontSize: 12,
    fontWeight: "500",
    width: 40,
    textAlign: "center",
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarCell: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  calendarCellSelected: {
    borderWidth: 1,
    borderColor: "rgba(168, 183, 195, 1)",
  },
  calendarCellEmpty: {
    width: 40,
    height: 40,
  },
  calendarDay: {
    color: "#052D5066",
    fontSize: 14,
    fontWeight: "500",
  },
  calendarHours: {
    color: "#052D50",
    fontSize: 10,
    marginTop: 2,
    backgroundColor: "rgba(228, 235, 240, 1)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  shiftDetailsContainer: {
    width: "100%",
    marginBottom: 12,
  },
  shiftDetailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  shiftDetailsContent: {
    gap: 12,
  },
  shiftTitle: {
    color: "rgba(122, 148, 168, 1)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    flex: 1,
  },
  shiftSummary: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
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
    fontSize: 13,
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
  exportModalCard: {
    backgroundColor: "#EEEEEE",
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  exportModalTitle: {
    color: "#052D50",
    fontSize: 22,
  },
  exportModalSubtitle: {
    color: "#698196",
    fontSize: 14,
  },
  exportSheetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportButtonsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#0091FF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
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
