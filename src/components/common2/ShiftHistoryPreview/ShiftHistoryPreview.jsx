import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import shiftService from "../../../services/shift.service";
import {
  formatDuration,
  formatShiftDayLabel,
} from "../../../utils/shifts";

import { createStyles } from "./ShiftHistoryPreview.styles";

function formatTimeLabel(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatTimeRangeCompact(startedAt, endedAt) {
  const startLabel = formatTimeLabel(startedAt);
  if (!startLabel) {
    return "—";
  }

  const endLabel = formatTimeLabel(endedAt);
  if (!endLabel) {
    return `${startLabel}-...`;
  }

  return `${startLabel}-${endLabel}`;
}

export function ShiftHistoryPreview({
  colorMode = "dark",
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme, colorMode);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);

  const loadShifts = useCallback(async function loadShifts() {
    try {
      setLoading(true);

      const data = await shiftService.list();
      const nextShifts = [...(data?.items || [])].sort(function sortShifts(
        leftShift,
        rightShift,
      ) {
        return (
          new Date(rightShift.startedAt).getTime() -
          new Date(leftShift.startedAt).getTime()
        );
      });

      setShifts(nextShifts);
    } catch (error) {
      console.error("Failed to load shift history preview:", error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShifts();
    }, [loadShifts]),
  );

  const previewItems = useMemo(() => {
    return shifts.slice(0, 4);
  }, [shifts]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Shift history</Text>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate("Shifts")}
          activeOpacity={0.8}
        >
          <Text style={styles.linkText}>View all</Text>
          <Icon name="arrow-right" size={18} color="#FFFFFF" style={styles.linkIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : previewItems.length ? (
          <View style={styles.list}>
            {previewItems.map(function renderShift(shift, index) {
              return (
                <View
                  key={shift.id || `${shift.startedAt}-${index}`}
                  style={[
                    styles.item,
                    index !== previewItems.length - 1 &&
                      styles.itemDivider,
                  ]}
                >
                  <Text style={styles.dateText}>
                    {formatShiftDayLabel(
                      shift.shiftDate || shift.startedAt,
                    )}
                  </Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.projectText} numberOfLines={2}>
                      {shift.projectName || "Untitled project"}
                    </Text>

                    <View style={styles.summaryRightColumn}>
                      <Text style={styles.durationText}>
                        {formatDuration(shift.durationMs)}
                      </Text>

                      <Text style={styles.timeText}>
                        {formatTimeRangeCompact(
                          shift.startedAt,
                          shift.endedAt,
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No shifts yet.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default ShiftHistoryPreview;
