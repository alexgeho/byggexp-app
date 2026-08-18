import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { shiftService } from "../services";
import { getCurrentMonthKey } from "../utils/shifts";

// Owns the shift-history calendar data — the per-day entries, the month totals,
// the list of months with data, and the current month/date selection — scoped
// to the given project/worker filters. Refetches on focus and whenever the
// filters change. Selection setters are returned so the screen's calendar and
// export flows can drive them.
export const useShiftHistory = ({ filterProjectId, workerIdsParam }) => {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [days, setDays] = useState([]);
  const [currentMonthDuration, setCurrentMonthDuration] = useState(0);
  const [previousMonthDuration, setPreviousMonthDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMonths = useCallback(async () => {
    const months = await shiftService.getMonths();
    setAvailableMonths(months);
    return months;
  }, []);

  const loadHistory = useCallback(
    async (month) => {
      const data = await shiftService.getHistory({
        ...(month ? { month } : {}),
        ...(filterProjectId ? { projectId: filterProjectId } : {}),
        ...(workerIdsParam ? { workerIds: workerIdsParam } : {}),
      });
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
    },
    [filterProjectId, workerIdsParam],
  );

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

  // Re-pull the calendar when the admin filters change.
  useEffect(() => {
    refreshHistory(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProjectId, workerIdsParam]);

  return {
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
  };
};
