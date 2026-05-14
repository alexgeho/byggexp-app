import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import {
  getRepeatOptionState,
  getRepeatLabel,
  normalizeTaskNotificationSettings,
  REPEAT_OPTIONS,
} from "../../../utils/taskNotifications";

export default function TaskNotificationRepeatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const startDate = route.params?.startDate || null;
  const dueDate = route.params?.dueDate || null;
  const settings = useMemo(
    () => normalizeTaskNotificationSettings(route.params?.notificationSettings),
    [route.params?.notificationSettings],
  );

  const initialRepeat = useMemo(() => {
    const nextRepeat =
      route.params?.selectedRepeat || settings.repeat || "none";
    const repeatState = getRepeatOptionState({
      repeatKey: nextRepeat,
      startDate,
      dueDate,
      settings,
    });

    return repeatState.disabled ? "none" : nextRepeat;
  }, [dueDate, route.params?.selectedRepeat, settings, startDate]);

  const [selectedRepeat, setSelectedRepeat] = useState(initialRepeat);

  const handleSave = () => {
    navigation.navigate({
      name: "TaskNotifications",
      params: { repeatSelection: selectedRepeat },
      merge: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <BackButton
            backgroundColor={"rgb(253 253 253)"}
            tint="light"
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>Repeat</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.description}>
          Repeating notifications stop automatically at the due date and only
          work when at least one reminder is enabled.
        </Text>

        <View style={styles.card}>
          {REPEAT_OPTIONS.map((option, index) => {
            const optionState = getRepeatOptionState({
              repeatKey: option.key,
              startDate,
              dueDate,
              settings,
            });
            const isSelected = selectedRepeat === option.key;

            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionRow,
                  index === REPEAT_OPTIONS.length - 1 && styles.optionRowLast,
                ]}
                activeOpacity={optionState.disabled ? 1 : 0.85}
                disabled={optionState.disabled}
                onPress={() => setSelectedRepeat(option.key)}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionLabel,
                      optionState.disabled && styles.optionLabelDisabled,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionHelper,
                      optionState.disabled && styles.optionHelperDisabled,
                    ]}
                  >
                    {optionState.helperText}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                    optionState.disabled && styles.radioOuterDisabled,
                  ]}
                >
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Applied limits</Text>
          <Text style={styles.noteText}>
            {`Selected mode: ${getRepeatLabel(selectedRepeat)}.`}
          </Text>
          <Text style={styles.noteText}>
            Hourly works only for tasks due within 24 hours and sends up to 8
            reminders.
          </Text>
          <Text style={styles.noteText}>
            Daily works only for tasks due within 30 days and sends up to 14
            reminders.
          </Text>
          <Text style={styles.noteText}>
            Weekly works only for tasks that still have at least 7 days before
            the due date and sends up to 8 reminders.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <Icon name="check" size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save repeat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF5FB",
  },
  contentContainer: {
    padding: 12,
    paddingTop: 48,
    paddingBottom: 140,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    fontFamily: "DMSans-SemiBold",
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  description: {
    color: "#698196",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 12,
  },
  optionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    color: "#052D50",
    fontSize: 16,
    fontFamily: "DMSans-SemiBold",
    marginBottom: 4,
  },
  optionLabelDisabled: {
    color: "rgba(5, 45, 80, 0.45)",
  },
  optionHelper: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 18,
  },
  optionHelperDisabled: {
    color: "rgba(105, 129, 150, 0.8)",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#C5D4E2",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#0091FF",
  },
  radioOuterDisabled: {
    opacity: 0.55,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#0091FF",
  },
  noteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  noteTitle: {
    color: "#052D50",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
  },
  noteText: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "rgba(238, 245, 251, 0.96)",
  },
  saveButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans-SemiBold",
  },
});
