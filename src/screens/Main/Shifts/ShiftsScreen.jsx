import React, { useCallback, useMemo, useState } from "react";
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
import { standardScreenHeaderSpacing } from "../../../styles/screenLayout";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { shiftService } from "../../../services";
import {
  formatDuration,
  formatDurationShort,
  formatMonthLabel,
  formatShiftDate,
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
            !shiftDay && styles.calendarCellMuted,
            isSelected && styles.calendarCellSelected,
          ]}
          onPress={() => shiftDay && setSelectedDate(dateStr)}
          disabled={!shiftDay}
        >
          <Text
            style={[
              styles.calendarDay,
              isSelected && styles.calendarDaySelected,
            ]}
          >
            {day}
          </Text>
          {shiftDay ? (
            <Text
              style={[
                styles.calendarHours,
                isSelected && styles.calendarHoursSelected,
              ]}
            >
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
            <Text style={styles.exportLabel}>Select period for export</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setPickerVisible(true)}
            >
              <Text style={styles.dropdownText}>
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
            <Text
              style={[
                styles.shiftTitle,
                { fontFamily: theme.text.fontFamily["semiBold"] },
              ]}
            >
              Shift details for{" "}
              {selectedDay ? formatShiftDate(selectedDay.date) : "—"}
            </Text>

            <View style={styles.shiftDetailsContent}>
              {selectedDayShifts.length === 0 ? (
                <Text style={styles.emptyDetailsText}>
                  Select a highlighted day to see shift details.
                </Text>
              ) : (
                selectedDayShifts.map((shift) => (
                  <View key={shift.id} style={styles.shiftCard}>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftLabel}>Work hours:</Text>
                      <Text style={styles.shiftValue}>
                        {formatTimeRange(shift.startedAt, shift.endedAt)}
                      </Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftLabel}>Duration:</Text>
                      <Text style={styles.shiftValue}>
                        {formatDuration(shift.durationMs)}
                      </Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftLabel}>Project:</Text>
                      <Text style={styles.shiftValue}>
                        {shift.projectName || "—"}
                      </Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftLabel}>Location:</Text>
                      <Text style={styles.shiftValue}>
                        {shift.location || "—"}
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.shiftImagesRow}
                    >
                      {shift.photos?.length ? (
                        shift.photos.map((photo, index) => (
                          <Image
                            key={`${shift.id}-photo-${index}`}
                            style={styles.shiftImage}
                            source={{ uri: resolveUploadUrl(photo.url) }}
                          />
                        ))
                      ) : (
                        <Text style={styles.noPhotosText}>
                          No photos attached
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                ))
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
    flex: 1,
    backgroundColor: "#EEEEEE",
    padding: 16,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...standardScreenHeaderSpacing,
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
  placeholder: {
    width: 36,
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
    fontSize: 14,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  dropdownText: {
    color: "#052D50",
    fontSize: 14,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
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
    backgroundColor: "#e0e0e0",
  },
  calendarCellMuted: {
    backgroundColor: "#f3f3f3",
  },
  calendarCellSelected: {
    backgroundColor: "#0088FF",
  },
  calendarCellEmpty: {
    width: 40,
    height: 40,
  },
  calendarDay: {
    color: "#052D50",
    fontSize: 14,
    fontWeight: "500",
  },
  calendarDaySelected: {
    color: "#ffffff",
  },
  calendarHours: {
    color: "#ffffff",
    fontSize: 10,
    marginTop: 2,
    backgroundColor: "#0088FF",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  calendarHoursSelected: {
    backgroundColor: "#ffffff",
    color: "#0088FF",
  },
  shiftDetailsContainer: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  shiftDetailsContent: {
    gap: 12,
  },
  shiftTitle: {
    color: "#052D50",
    fontSize: 17,
    marginBottom: 12,
  },
  shiftCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  shiftInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  shiftLabel: {
    color: "#698196",
    fontSize: 14,
  },
  shiftValue: {
    color: "#052D50",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  shiftImagesRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  shiftImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
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
    color: "#052D50",
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
  noPhotosText: {
    color: "#698196",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000040",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
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
