import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import shiftService from "../../../services/shift.service";
import { resolveUploadUrl } from "../../../utils/shifts";

import { createStyles } from "./ShiftHistoryPreview.styles";

// The daily-hours field shows/edits whole (or half) hours; the API stores ms.
function hoursFromMs(durationMs) {
  if (!durationMs) {
    return "";
  }
  return String(Math.round((durationMs / 3600000) * 10) / 10);
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Compact date like "Aug 13" for the single-line date + project meta row.
function formatShortDay(raw) {
  if (!raw) {
    return "";
  }
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);
  if (Number.isNaN(dt.getTime())) {
    return "";
  }
  return `${SHORT_MONTHS[dt.getMonth()]} ${dt.getDate()}`;
}

function parseShiftDate(shift) {
  const raw = shift?.shiftDate || shift?.startedAt;
  if (!raw) {
    return null;
  }
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// Today's row gets the big white hours entry; past rows show muted hours.
function isTodayShift(shift) {
  const dt = parseShiftDate(shift);
  if (!dt) {
    return false;
  }
  const now = new Date();
  return (
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate()
  );
}

// Daily report only ever shows today + earlier days — future-dated shifts
// (test data, scheduling) are hidden so the block reads as a diary.
function isPastShift(shift) {
  const dt = parseShiftDate(shift);
  if (!dt) {
    return false;
  }
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return dt.getTime() < startOfToday.getTime();
}

// Today's date as YYYY-MM-DD for the always-present "log today's hours" row.
function todayDateStr() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Preview-only mock rows for populating the block during design review.
// Off in production — real data comes from the API.
const SHOW_MOCK_DATA = false;

function buildMockShifts() {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const iso = (offsetDays) => new Date(now - offsetDays * dayMs).toISOString();
  const day = (offsetDays) => iso(offsetDays).slice(0, 10);
  return [
    {
      id: "mock-today",
      shiftDate: day(0),
      startedAt: iso(0),
      projectName: "GPS test By 18",
      durationMs: 0, // no hours yet -> editable field
      photos: [
        { url: "https://picsum.photos/id/1067/200/200" },
        { url: "https://picsum.photos/id/1078/200/200" },
      ],
    },
    {
      id: "mock-1",
      shiftDate: day(1),
      startedAt: iso(1),
      projectName: "Byggnation av BRF Peter",
      durationMs: 8 * 3600000, // has hours -> read-only, no field
      photos: [],
    },
    {
      id: "mock-2",
      shiftDate: day(2),
      startedAt: iso(2),
      projectName: "Stambyte BRF Solrosen",
      durationMs: 6.5 * 3600000,
      photos: [],
    },
  ];
}

export function ShiftHistoryPreview({
  colorMode = "dark",
  onClose,
  refreshKey = 0,
  todayProjectName = "",
  onSaveTodayHours,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme, colorMode);
  const secondaryIconColor =
    colorMode === "light" ? `${theme.colors.text}80` : "rgba(255,255,255,0.72)";
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);

  const loadShifts = useCallback(async function loadShifts() {
    try {
      setLoading(true);

      const data = await shiftService.list();
      const nextShifts = [...(data?.items || [])].sort(
        function sortShifts(leftShift, rightShift) {
          return (
            new Date(rightShift.startedAt).getTime() -
            new Date(leftShift.startedAt).getTime()
          );
        },
      );

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

  useEffect(() => {
    void loadShifts();
  }, [loadShifts, refreshKey]);

  const handleSaveHours = useCallback(
    async function handleSaveHours(shift, rawText) {
      const normalized = String(rawText || "")
        .replace(",", ".")
        .trim();
      if (!normalized) {
        return;
      }

      const hours = Number(normalized);
      if (!Number.isFinite(hours) || hours < 0) {
        return;
      }

      const durationMs = Math.round(hours * 3600000);
      if (durationMs === shift.durationMs) {
        return;
      }

      try {
        await shiftService.setManualHours(shift.id, durationMs);
        loadShifts();
      } catch (error) {
        console.error("Failed to save manual hours:", error);
      }
    },
    [loadShifts],
  );

  const baseShifts = SHOW_MOCK_DATA
    ? [...buildMockShifts(), ...shifts]
    : shifts;

  // Exactly one "today" row, always first: reuse the real shift for today if
  // one exists (deduping any repeats), otherwise a placeholder so the worker
  // can still log hours. Placeholder saves go through onSaveTodayHours
  // (addManualHours); a real today row uses setManualHours on its id.
  const todayShift = baseShifts.find(isTodayShift);
  const olderShifts = baseShifts.filter(isPastShift);
  const todayRow = todayShift || {
    id: "today-entry",
    isTodayPlaceholder: true,
    shiftDate: todayDateStr(),
    projectName: todayProjectName,
    durationMs: 0,
    photos: [],
  };
  const displayShifts = [todayRow, ...olderShifts];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("shiftHistory.title")}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Shifts")}
            activeOpacity={0.8}
          >
            <Text style={styles.linkText}>{t("common.viewAll")}</Text>
            <Icon
              name="arrow-right"
              size={18}
              color={secondaryIconColor}
              style={styles.linkIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Icon name="x" size={18} color={secondaryIconColor} />
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : displayShifts.length ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {displayShifts.map(function renderShift(shift, index) {
              const photosNode = shift.photos?.length ? (
                <View style={styles.photosRow}>
                  {shift.photos.slice(0, 3).map(function renderPhoto(photo, i) {
                    return (
                      <View
                        key={shift.id + "-photo-" + i}
                        style={styles.photoSquare}
                      >
                        <Image
                          style={styles.photoImage}
                          source={{ uri: resolveUploadUrl(photo.url) }}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : null;
              const today = isTodayShift(shift);

              return (
                <View
                  key={shift.id || `${shift.startedAt}-${index}`}
                  style={[
                    styles.item,
                    index !== displayShifts.length - 1 && styles.itemDivider,
                  ]}
                >
                  <View
                    style={[styles.summaryRow, today && styles.summaryRowToday]}
                  >
                    <View style={styles.summaryLeftColumn}>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {formatShortDay(shift.shiftDate || shift.startedAt)}
                        {" · "}
                        {shift.projectName || t("createTask.untitledProject")}
                      </Text>
                      {photosNode}
                    </View>

                    <View style={styles.summaryRightColumn}>
                      {today ? (
                        <View style={styles.todayHoursRow}>
                          <TextInput
                            style={styles.hoursInputBig}
                            defaultValue={hoursFromMs(shift.durationMs)}
                            keyboardType="numeric"
                            placeholder=""
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            returnKeyType="done"
                            onEndEditing={function onEndEditing(event) {
                              // Today's hours always upsert by date so it works
                              // whether or not a shift already exists today.
                              if (onSaveTodayHours) {
                                onSaveTodayHours(event.nativeEvent.text);
                              } else {
                                handleSaveHours(shift, event.nativeEvent.text);
                              }
                            }}
                          />
                          <Icon
                            name="edit-2"
                            size={24}
                            color="#FFFFFF"
                            style={styles.hoursPencil}
                          />
                        </View>
                      ) : (
                        <View style={styles.hoursInputRow}>
                          <TextInput
                            style={styles.hoursInputMuted}
                            defaultValue={hoursFromMs(shift.durationMs)}
                            keyboardType="numeric"
                            placeholder=""
                            placeholderTextColor={secondaryIconColor}
                            returnKeyType="done"
                            onEndEditing={function onEndEditing(event) {
                              handleSaveHours(shift, event.nativeEvent.text);
                            }}
                          />
                          <Text style={styles.hoursSuffixMuted}>h</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {t("shiftHistory.noShiftsYet")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default ShiftHistoryPreview;
