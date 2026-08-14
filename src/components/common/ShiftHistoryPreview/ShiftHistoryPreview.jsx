import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
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

// Hours shown as whole/half hours; the API stores milliseconds.
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

// Read-only daily-report preview: a compact shift history. Tapping anywhere
// opens the full Shifts screen — no inline editing here (hours are entered on
// the home screen's round button).
export function ShiftHistoryPreview({
  colorMode = "dark",
  onClose,
  refreshKey = 0,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme, colorMode);
  const secondaryIconColor =
    colorMode === "light" ? `${theme.colors.text}80` : "rgba(255,255,255,0.72)";
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const hasLoadedRef = useRef(false);

  const loadShifts = useCallback(async function loadShifts() {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

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
      hasLoadedRef.current = true;
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

  const goToShifts = useCallback(
    function goToShifts() {
      navigation.navigate("Shifts");
    },
    [navigation],
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("shiftHistory.title")}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={goToShifts}
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
        ) : shifts.length ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {shifts.map(function renderShift(shift, index) {
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

              return (
                <TouchableOpacity
                  key={shift.id || `${shift.startedAt}-${index}`}
                  style={[
                    styles.item,
                    index !== shifts.length - 1 && styles.itemDivider,
                  ]}
                  activeOpacity={0.7}
                  onPress={goToShifts}
                >
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLeftColumn}>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {formatShortDay(shift.shiftDate || shift.startedAt)}
                        {" · "}
                        {shift.projectName || t("createTask.untitledProject")}
                      </Text>
                      {photosNode}
                    </View>

                    {shift.durationMs ? (
                      <View style={styles.hoursInputRow}>
                        <Text style={styles.hoursInputMuted}>
                          {hoursFromMs(shift.durationMs)}
                        </Text>
                        <Text style={styles.hoursSuffixMuted}>
                          {t("shiftHistory.hoursSuffix")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={styles.emptyState}
            activeOpacity={0.8}
            onPress={goToShifts}
          >
            <Text style={styles.emptyText}>{t("shiftHistory.empty")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default ShiftHistoryPreview;
