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
import { formatShiftDayLabel, resolveUploadUrl } from "../../../utils/shifts";

import { createStyles } from "./ShiftHistoryPreview.styles";

// The daily-hours field shows/edits whole (or half) hours; the API stores ms.
function hoursFromMs(durationMs) {
  if (!durationMs) {
    return "";
  }
  return String(Math.round((durationMs / 3600000) * 10) / 10);
}

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
        ) : shifts.length ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {shifts.map(function renderShift(shift, index) {
              return (
                <View
                  key={shift.id || `${shift.startedAt}-${index}`}
                  style={[
                    styles.item,
                    index !== shifts.length - 1 && styles.itemDivider,
                  ]}
                >
                  <Text style={styles.dateText}>
                    {formatShiftDayLabel(shift.shiftDate || shift.startedAt)}
                  </Text>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLeftColumn}>
                      <Text style={styles.projectText} numberOfLines={2}>
                        {shift.projectName || t("createTask.untitledProject")}
                      </Text>

                      {shift.photos?.length ? (
                        <View style={styles.photosRow}>
                          {shift.photos
                            .slice(0, 3)
                            .map(function renderPhoto(photo, photoIndex) {
                              return (
                                <View
                                  key={`${shift.id}-photo-${photoIndex}`}
                                  style={styles.photoSquare}
                                >
                                  <Image
                                    style={styles.photoImage}
                                    source={{
                                      uri: resolveUploadUrl(photo.url),
                                    }}
                                  />
                                </View>
                              );
                            })}
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.summaryRightColumn}>
                      <View style={styles.hoursInputRow}>
                        <TextInput
                          style={styles.hoursInput}
                          defaultValue={hoursFromMs(shift.durationMs)}
                          keyboardType="numeric"
                          placeholder="–"
                          placeholderTextColor={secondaryIconColor}
                          returnKeyType="done"
                          onEndEditing={function onEndEditing(event) {
                            handleSaveHours(shift, event.nativeEvent.text);
                          }}
                        />
                        <Text style={styles.hoursSuffix}>h</Text>
                      </View>
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
