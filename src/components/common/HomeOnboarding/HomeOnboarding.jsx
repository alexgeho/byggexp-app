import React, { useMemo, useState } from "react";

import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import { track } from "../../../utils/analytics";
import { createStyles } from "./HomeOnboarding.styles";

// "Kom igång" first-run checklist. Mirrors the admin dashboard's onboarding
// principle (Linear/Stripe style): a short list of setup steps, each with a
// title + one-line description and a single highlighted "do this next" step.
//
// Admin steps deep-link to the screen that finishes them. Worker steps act in
// place on Home (select project, log time, customise) via callbacks, since those
// live inline on Home rather than on separate screens. The "report time" step
// opens a chooser sheet: automatic (GPS) or two manual ways.
const STEP_ICON = {
  project: "folder",
  team: "user-plus",
  shift: "clock",
  selectProject: "folder",
  timeReport: "clock",
  profile: "user",
  customize: "sliders",
  time: "clock",
  location: "map-pin",
  notifications: "bell",
};

export function HomeOnboarding({
  role,
  steps,
  completed,
  total,
  onDismiss,
  onStartShift,
  onLogHours,
  onSelectProject,
  onCustomize,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accent = theme.colors.primary;
  const progress = total > 0 ? completed / total : 0;
  const isWorker = role === "worker";
  const single = total === 1;

  // The "report time" chooser sheet — remembers the tapped step's GPS mode so
  // the automatic option knows whether to clock in or route to location setup.
  const [timeSheet, setTimeSheet] = useState(null); // null | { mode }

  const activeKey = steps.find((s) => !s.done)?.key || null;

  const runStep = (step) => {
    track("onboarding_step_clicked", { step: step.key, mode: step.mode });
    switch (step.action) {
      case "time":
        setTimeSheet({ mode: step.mode });
        return;
      case "selectProject":
        onSelectProject?.();
        return;
      case "customize":
        onCustomize?.();
        return;
      default:
        navigation.navigate(step.screen);
    }
  };

  const chooseTime = (method) => {
    const mode = timeSheet?.mode;
    setTimeSheet(null);
    track("onboarding_time_method", { method, mode });
    if (method === "gps") {
      // GPS configured (location granted) → start the live timer; otherwise
      // send them to set location up first.
      if (mode === "auto") onStartShift?.();
      else navigation.navigate("LocationConsent");
    } else if (method === "manual") {
      onLogHours?.();
    } else if (method === "shifts") {
      navigation.navigate("Shifts");
    }
  };

  const goToBilling = () => {
    track("onboarding_billing_clicked", { role });
    navigation.navigate("Economy");
  };

  const TimeOption = ({ icon, title, desc, onPress }) => (
    <TouchableOpacity
      style={styles.sheetRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconCircle,
          { borderColor: accent, backgroundColor: theme.content.accentSoft },
        ]}
      >
        <Icon name={icon} size={16} color={accent} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>
          {desc}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={theme.content.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t("onboarding.title", "Kom igång")}</Text>
          {!single ? (
            <Text style={styles.subtitle}>
              {t("onboarding.progress", "{{done}} av {{total}} klara", {
                done: completed,
                total,
              })}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={t("onboarding.dismiss", "Dölj")}
        >
          <Icon name="x" size={20} color={theme.content.textMuted} />
        </TouchableOpacity>
      </View>

      {!single ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: accent,
              },
            ]}
          />
        </View>
      ) : null}

      <View style={styles.list}>
        {steps.map((step) => {
          const isActive = !step.done && step.key === activeKey;
          return (
            <TouchableOpacity
              key={step.key}
              style={[styles.row, isActive && styles.rowActive]}
              disabled={step.done}
              activeOpacity={0.7}
              onPress={() => runStep(step)}
            >
              <View
                style={[
                  styles.iconCircle,
                  step.done
                    ? { backgroundColor: accent, borderColor: accent }
                    : isActive
                      ? {
                          backgroundColor: theme.content.accentSoft,
                          borderColor: accent,
                        }
                      : { borderColor: theme.content.border },
                ]}
              >
                {step.done ? (
                  <Icon name="check" size={15} color="#FFFFFF" />
                ) : (
                  <Icon
                    name={STEP_ICON[step.key]}
                    size={15}
                    color={isActive ? accent : theme.content.textMuted}
                  />
                )}
              </View>

              <View style={styles.rowBody}>
                {isActive ? (
                  <Text style={[styles.eyebrow, { color: accent }]}>
                    {t("onboarding.startHere", "Börja här")}
                  </Text>
                ) : null}
                <Text
                  style={[styles.rowTitle, step.done && styles.rowTitleDone]}
                  numberOfLines={1}
                >
                  {t(`onboarding.step.${step.key}`)}
                </Text>
                {!step.done ? (
                  <Text style={styles.rowDesc} numberOfLines={2}>
                    {t(`onboarding.stepDesc.${step.key}`, "")}
                  </Text>
                ) : null}
              </View>

              {step.done ? (
                <Text style={styles.doneTag}>
                  {t("onboarding.done", "Klar")}
                </Text>
              ) : (
                <Icon
                  name="chevron-right"
                  size={20}
                  color={isActive ? accent : theme.content.textMuted}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {!isWorker ? (
        <TouchableOpacity
          style={styles.footerCta}
          activeOpacity={0.85}
          onPress={goToBilling}
        >
          <Icon name="file-text" size={16} color={accent} />
          <Text style={[styles.footerCtaText, { color: accent }]}>
            {t("onboarding.billingCta", "Skapa offert eller faktura")}
          </Text>
          <Icon name="chevron-right" size={18} color={accent} />
        </TouchableOpacity>
      ) : null}

      {/* Report-time chooser: automatic (GPS) or two manual ways. */}
      <Modal
        visible={timeSheet !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeSheet(null)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setTimeSheet(null)}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {t("onboarding.timeSheet.title", "Rapportera din tid")}
            </Text>

            <TimeOption
              icon="map-pin"
              title={t("onboarding.timeSheet.gps", "Automatiskt (GPS)")}
              desc={t(
                "onboarding.timeSheet.gpsDesc",
                "Stämpla in på plats — tiden räknas av sig själv.",
              )}
              onPress={() => chooseTime("gps")}
            />
            <TimeOption
              icon="edit-3"
              title={t("onboarding.timeSheet.manual", "Fyll i timmar")}
              desc={t(
                "onboarding.timeSheet.manualDesc",
                "Ange antal timmar direkt.",
              )}
              onPress={() => chooseTime("manual")}
            />
            <TimeOption
              icon="list"
              title={t("onboarding.timeSheet.shifts", "I Arbetspass")}
              desc={t(
                "onboarding.timeSheet.shiftsDesc",
                "Skriv in eller justera tid i dina pass.",
              )}
              onPress={() => chooseTime("shifts")}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
