import { getDateLocale } from "../../../utils/dateLocale";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import React, { useRef, useState, useContext, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AuthContext from "../../../contexts/AuthContext";
import { useTheme } from "../../../theme/ThemeContext";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { shiftService } from "../../../services";
import {
  formatDuration,
  formatMonthLabel,
  formatShiftDayLabel,
  formatTimeRange,
} from "../../../utils/shifts";
import { useFocusEffect } from "@react-navigation/native";

const PERIOD_OPTIONS = ["All time", "Month", "Year", "Custom"];
const PERIOD_KEYS = {
  "All time": "allTime",
  Month: "month",
  Year: "year",
  Custom: "custom",
};
const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "calendar";

export const ShiftHistory = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const periodLabel = (value) =>
    t(`shiftHistory.periods.${PERIOD_KEYS[value] || "month"}`, value);
  const bottomSheetRef = useRef(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState("pdf");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [datePickerTarget, setDatePickerTarget] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const {
    projectId,
    workerId,
    workerName,
    type = "history",
  } = route.params || {};
  const currentUserId = user?._id || user?.id;
  const effectiveWorkerId =
    workerId || (user?.role === "worker" ? currentUserId : null);
  const titleName =
    workerName ||
    (user?.role === "worker" ? user?.name : t("shiftHistory.title"));

  const getPeriodRange = useCallback((monthKey) => {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return { from: "", to: "" };
    }

    const [year, month] = monthKey.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    return {
      from: `${monthKey}-01`,
      to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
    };
  }, []);

  const getYearRange = useCallback(
    (year) => ({
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    }),
    [],
  );

  const formatDateValue = useCallback(
    (value) => {
    if (!value) {
      return t("shiftHistory.selectDate");
    }

    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(getDateLocale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    },
    [t],
  );

  const formatDateForApi = useCallback((date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const parseDateValue = useCallback((value) => {
    if (!value) {
      return new Date();
    }

    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }, []);

  const applyPeriod = useCallback(
    (nextPeriod, months = []) => {
      setSelectedPeriod(nextPeriod);

      if (nextPeriod === "Custom") {
        setPeriodPickerOpen(false);
        return;
      }

      if (nextPeriod === "All time") {
        if (months.length > 0) {
          const firstMonth = months[months.length - 1];
          const lastMonth = months[0];
          const { from } = getPeriodRange(firstMonth);
          const { to } = getPeriodRange(lastMonth);
          setFromDate(from);
          setToDate(to);
        } else {
          setFromDate("");
          setToDate("");
        }
        setPeriodPickerOpen(false);
        return;
      }

      if (nextPeriod === "Month") {
        const targetMonth = months[0];
        if (targetMonth) {
          const { from, to } = getPeriodRange(targetMonth);
          setFromDate(from);
          setToDate(to);
        } else {
          setFromDate("");
          setToDate("");
        }
        setPeriodPickerOpen(false);
        return;
      }

      if (nextPeriod === "Year") {
        const sourceMonth = months[0];
        const targetYear = sourceMonth?.slice(0, 4);
        if (targetYear) {
          const { from, to } = getYearRange(targetYear);
          setFromDate(from);
          setToDate(to);
        } else {
          setFromDate("");
          setToDate("");
        }
        setPeriodPickerOpen(false);
      }
    },
    [getPeriodRange, getYearRange],
  );

  const filterDaysByWorker = useCallback(
    (inputDays) => {
      if (!effectiveWorkerId) {
        return inputDays || [];
      }

      return (inputDays || []).reduce((result, day) => {
        const shifts = (day?.shifts || []).filter(
          (shift) => shift.workerId === effectiveWorkerId,
        );

        if (!shifts.length) {
          return result;
        }

        result.push({
          ...day,
          shifts,
          totalDurationMs: shifts.reduce(
            (total, shift) => total + (shift.durationMs || 0),
            0,
          ),
        });

        return result;
      }, []);
    },
    [effectiveWorkerId],
  );

  const loadShiftDays = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams = {
        ...(projectId ? { projectId } : {}),
        ...(effectiveWorkerId ? { workerId: effectiveWorkerId } : {}),
      };
      const [months, data] = await Promise.all([
        shiftService.getMonths(filterParams),
        shiftService.list(filterParams),
      ]);

      setAvailableMonths(months || []);
      setDays(filterDaysByWorker(data.days));

      if ((months || []).length > 0) {
        setSelectedPeriod("Month");
        const { from, to } = getPeriodRange(months[0]);
        setFromDate(from);
        setToDate(to);
      } else {
        setSelectedPeriod("Month");
        setFromDate("");
        setToDate("");
      }
    } catch (error) {
      console.error("Failed to load shift history list:", error);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveWorkerId, filterDaysByWorker, getPeriodRange, projectId]);

  useFocusEffect(
    useCallback(() => {
      loadShiftDays();
    }, [loadShiftDays]),
  );

  const openWorkerModal = () => {
    setPeriodPickerOpen(false);
    bottomSheetRef.current?.expand();
  };

  const closeWorkerModal = () => {
    setPeriodPickerOpen(false);
    setDatePickerTarget(null);
    bottomSheetRef.current?.close();
  };

  const renderBottomSheetBackdrop = useCallback(
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

      const formattedDate = formatDateForApi(date);
      if (datePickerTarget === "from") {
        setFromDate(formattedDate);
      } else {
        setToDate(formattedDate);
      }
    },
    [datePickerTarget, formatDateForApi],
  );

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      Alert.alert(
        t("shiftHistory.invalidPeriodTitle"),
        t("shiftHistory.invalidPeriodMessage"),
      );
      return;
    }

    try {
      setExporting(true);

      await shiftService.exportReport({
        format: selectedExportType,
        projectId,
        workerId: effectiveWorkerId,
        from: fromDate,
        to: toDate,
        workerName: titleName,
      });

      bottomSheetRef.current?.close();
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
    effectiveWorkerId,
    exporting,
    fromDate,
    projectId,
    selectedExportType,
    titleName,
    toDate,
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
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.projectName,
            { fontFamily: theme.text.fontFamily["medium"] },
          ]}
        >
          {t("shiftHistory.title")}
        </Text>
        <View style={styles.backZeroButton} />
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>
          {titleName || t("shiftHistory.title")}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, width: "100%" }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0091FF" />
          </View>
        ) : days.length === 0 ? (
          <Text style={styles.emptyStateText}>{t("shiftHistory.empty")}</Text>
        ) : (
          days.map((day) => (
            <TouchableOpacity
              key={day.date}
              style={[styles.shiftItem, { marginBottom: 12 }]}
              activeOpacity={0.9}
            >
              <View style={styles.shiftHeader}>
                <Text style={styles.dateText}>
                  {formatShiftDayLabel(day.date)}
                </Text>
                <Text style={styles.totalText}>
                  {t("shiftHistory.total", {
                    duration: formatDuration(day.totalDurationMs),
                  })}
                </Text>
              </View>

              {day.shifts.map((shift, index) => (
                <View
                  key={shift.id}
                  style={index === 0 ? styles.shiftBody : styles.subShift}
                >
                  <View style={styles.shiftProjectContainer}>
                    {shift.workerName && !effectiveWorkerId ? (
                      <Text style={styles.workerInlineText}>
                        {shift.workerName}
                      </Text>
                    ) : null}
                    <Text style={styles.projectInlineText}>
                      {shift.projectName}
                    </Text>
                    <Text style={styles.locationText}>
                      {shift.location || t("shiftHistory.noLocation")}
                    </Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.durationText}>
                      {formatDuration(shift.durationMs)}
                    </Text>
                    <Text style={styles.timeRangeText}>
                      {formatTimeRange(shift.startedAt, shift.endedAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["45%", "72%"]}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBottomSheetBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.sheetCard}>
            <View style={styles.periodContainer}>
              <Text style={styles.periodLabel}>
                {t("shiftHistory.periodLabel")}
              </Text>
              <TouchableOpacity
                style={styles.periodDropdown}
                onPress={() => setPeriodPickerOpen((previous) => !previous)}
              >
                <Text style={styles.periodValue}>
                  {periodLabel(selectedPeriod)}
                </Text>
                <Image
                  style={styles.dropdownArrow}
                  source={require("../../../assets/Arrow-down.png")}
                />
              </TouchableOpacity>
            </View>
          </View>

          {periodPickerOpen ? (
            <View style={styles.sheetCard}>
              <View style={styles.periodOptions}>
                {PERIOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.periodOptionButton,
                      selectedPeriod === option &&
                        styles.periodOptionButtonActive,
                    ]}
                    onPress={() => applyPeriod(option, availableMonths)}
                  >
                    <Text
                      style={[
                        styles.periodOptionText,
                        selectedPeriod === option &&
                          styles.periodOptionTextActive,
                      ]}
                    >
                      {periodLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.sheetCard}>
            <View style={styles.dateContainer}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>{t("shiftHistory.from")}</Text>
                <TouchableOpacity
                  style={[
                    styles.dateValueCard,
                    selectedPeriod !== "Custom" && styles.dateValueCardDisabled,
                  ]}
                  onPress={() =>
                    selectedPeriod === "Custom" && setDatePickerTarget("from")
                  }
                  activeOpacity={selectedPeriod === "Custom" ? 0.8 : 1}
                >
                  <Text
                    style={[
                      styles.dateValueText,
                      !fromDate && styles.dateValuePlaceholder,
                    ]}
                  >
                    {formatDateValue(fromDate)}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>{t("shiftHistory.to")}</Text>
                <TouchableOpacity
                  style={[
                    styles.dateValueCard,
                    selectedPeriod !== "Custom" && styles.dateValueCardDisabled,
                  ]}
                  onPress={() =>
                    selectedPeriod === "Custom" && setDatePickerTarget("to")
                  }
                  activeOpacity={selectedPeriod === "Custom" ? 0.8 : 1}
                >
                  <Text
                    style={[
                      styles.dateValueText,
                      !toDate && styles.dateValuePlaceholder,
                    ]}
                  >
                    {formatDateValue(toDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

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
              <Text style={styles.exportMainButtonText}>
                {t("shiftHistory.export")}
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={openWorkerModal}
        showAddButton
        renderAddContent={() => (
          <Text style={styles.exportFabText}>{t("shiftHistory.export")}</Text>
        )}
        addButtonStyle={styles.exportFabButton}
      />

      <Modal
        visible={Boolean(datePickerTarget)}
        transparent={true}
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
              value={parseDateValue(
                datePickerTarget === "from" ? fromDate : toDate,
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
};

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    ...standardScreenHeader,
  },
  backButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  backZeroButton: {
    padding: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  projectName: {
    color: "#052D50",
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "500",
  },
  titleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  screenTitle: {
    color: "#052D50",
    fontSize: 36,
    flex: 1,
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
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 96,
    width: "100%",
  },
  loadingContainer: {
    paddingTop: 32,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#698196",
    textAlign: "center",
    marginTop: 24,
  },
  shiftItem: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateText: {
    color: "#0785F4",
  },
  totalText: {
    color: "#0785F4",
  },
  shiftBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftProjectContainer: {
    width: "45%",
    gap: 4,
  },
  projectInlineText: {
    color: "#052D50",
    fontWeight: "600",
  },
  workerInlineText: {
    color: "#0785F4",
    fontSize: 13,
    fontWeight: "600",
  },
  locationText: {
    color: "#052D50",
  },
  timeContainer: {
    gap: 4,
    alignItems: "flex-end",
  },
  durationText: {
    color: "#052D50",
  },
  timeRangeText: {
    color: "#052D5050",
  },
  subShift: {
    borderTopWidth: 1,
    borderColor: "#E6E6E6",
    paddingTop: 8,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    zIndex: 4,
    position: "relative",
  },
  bottomSheetContent: {
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  sheetCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportSheetCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  workerModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#052D50",
    marginBottom: 20,
  },
  periodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  periodLabel: {
    fontSize: 16,
    color: "#052D50",
  },
  periodDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  periodOptions: {
    gap: 12,
  },
  periodOptionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  periodOptionButtonActive: {
    borderColor: "#0091FF",
    backgroundColor: "#EAF4FF",
  },
  periodOptionText: {
    color: "#052D50",
    fontSize: 15,
  },
  periodOptionTextActive: {
    color: "#0091FF",
    fontWeight: "700",
  },
  periodEmptyText: {
    color: "#698196",
    fontSize: 14,
  },
  periodValue: {
    fontSize: 16,
    color: "#052D50",
  },
  dropdownArrow: {
    width: 16,
    height: 16,
    marginLeft: 8,
    tintColor: "#052D50",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: "#052D50",
    marginBottom: 4,
  },
  dateValueCard: {
    backgroundColor: "rgba(245, 245, 245, 1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },
  dateValueCardDisabled: {
    opacity: 0.72,
  },
  dateValueText: {
    fontSize: 15,
    color: "#052D50",
  },
  dateValuePlaceholder: {
    color: "#698196",
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  datePickerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
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
});
