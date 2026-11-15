import React, { useMemo, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import useSheetEnter from "../../../hooks/useSheetEnter";
import { useTheme } from "../../../theme/ThemeContext";
import { onDark } from "../../../theme/colorUtils";
import { radius, size } from "../../../theme/tokens";
import { getDateLocale } from "../../../utils/dateLocale";
import {
  formatDateKey,
  formatExportPickerDate,
  parseDateKey,
} from "../../../utils/shifts";

// A calendar, never the wheel (owner 15.11).
const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "default";

// THE "Custom" period picker — Planning and Shifts both open this one sheet.
// No tabs inside: From and To at once, a calendar for the field that is
// active, Apply. `from` / `to` are day keys (YYYY-MM-DD).
export function PeriodSheet({ visible, from, to, onChange, onApply, onClose }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const sheetEnter = useSheetEnter(visible);
  const [target, setTarget] = useState("from");
  const fields = [
    { key: "from", label: t("shiftHistory.from"), value: from },
    { key: "to", label: t("shiftHistory.to"), value: to },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.container, sheetEnter]}>
        <View style={styles.handle} />
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("schedule.views.custom")}
          </Text>

          <View style={styles.card}>
            <View style={styles.fields}>
              {fields.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TouchableOpacity
                    testID={`period-${field.key}`}
                    style={[
                      styles.value,
                      target === field.key && styles.valueActive,
                    ]}
                    onPress={() => setTarget(field.key)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.valueText,
                        !field.value && styles.valuePlaceholder,
                      ]}
                    >
                      {formatExportPickerDate(field.value)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.picker}>
              <DateTimePicker
                // One calendar per field, in the app's language.
                key={target}
                locale={getDateLocale()}
                value={parseDateKey(target === "from" ? from : to)}
                mode="date"
                display={DATE_PICKER_DISPLAY}
                onChange={(_event, date) =>
                  date && onChange({ from, to, [target]: formatDateKey(date) })
                }
              />
            </View>
          </View>

          <TouchableOpacity
            testID="period-apply"
            style={styles.apply}
            onPress={onApply}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>{t("shifts.applyPeriod")}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingBottom: 28,
      maxHeight: "90%",
    },
    handle: {
      alignSelf: "center",
      backgroundColor: onDark(c, c.divider, "#CCCCCC"),
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
      gap: 12,
    },
    title: {
      color: c.textPrimary,
      fontSize: 22,
      textAlign: "center",
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    fields: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    field: {
      flex: 1,
      alignItems: "center",
    },
    label: {
      fontSize: 14,
      color: c.textPrimary,
      marginBottom: 4,
      textAlign: "center",
      width: "100%",
    },
    value: {
      width: "100%",
      backgroundColor: onDark(c, c.inputSurface, "rgba(245, 245, 245, 1)"),
      borderRadius: 20,
      paddingHorizontal: 12,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    valueActive: {
      borderColor: "#0091FF",
    },
    valueText: {
      fontSize: 15,
      color: c.textPrimary,
      textAlign: "center",
    },
    valuePlaceholder: {
      color: c.textMuted,
    },
    picker: {
      alignItems: "center",
      marginTop: 8,
    },
    apply: {
      width: "100%",
      height: size.control,
      backgroundColor: "#0091FF",
      borderRadius: radius.control,
      alignItems: "center",
      justifyContent: "center",
    },
    applyText: {
      fontSize: 18,
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });
