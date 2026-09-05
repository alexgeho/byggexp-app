import React, { useMemo, useState } from "react";

import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import {
  successPopupIconColor,
  successPopupIconBackground,
} from "../../../theme/settings";
import { track } from "../../../utils/analytics";
import { createStyles } from "./HomeOnboarding.styles";

// "Kom igång" first-run checklist.
// - Worker: fixed 4-step flow; the time step opens a chooser sheet.
// - Admin: a two-direction focus (fieldwork / billing) mirroring the web —
//   a routing question, a focused step list, and a switch to the other focus.
const STEP_ICON = {
  project: "folder",
  team: "user-plus",
  shift: "clock",
  task: "check-square",
  tools: "tool",
  companyDetails: "briefcase",
  client: "users",
  article: "package",
  billing: "file-text",
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
  // Admin focus routing
  needsFocus = false,
  focus = null,
  onChooseFocus,
  onChangeFocus,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accent = theme.colors.primary;
  const progress = total > 0 ? completed / total : 0;
  const isWorker = role === "worker";
  const single = total === 1;
  const showProgress = !single && !needsFocus;

  const [timeSheet, setTimeSheet] = useState(null);

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
      if (mode === "auto") onStartShift?.();
      else navigation.navigate("LocationConsent");
    } else if (method === "manual") {
      onLogHours?.();
    } else if (method === "shifts") {
      navigation.navigate("Shifts");
    }
  };

  // Subtitle: routing question when unanswered, else progress / a "change focus".
  const subtitle = needsFocus
    ? t("onboarding.focus.question", "Vad är viktigast just nu?")
    : t("onboarding.progress", "{{done}} av {{total}} klara", {
        done: completed,
        total,
      });

  // The other focus, to switch to (only shown once a focus is picked).
  const otherFocus =
    focus === "fieldwork"
      ? "billing"
      : focus === "billing"
        ? "fieldwork"
        : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t("onboarding.title", "Kom igång")}</Text>
          {!single ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={t("onboarding.dismiss", "Dölj")}
        >
          <Icon name="x" size={20} color={theme.content.textMuted} />
        </TouchableOpacity>
      </View>

      {showProgress ? (
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

      {/* Admin routing question (mirrors web): pick a direction. */}
      {needsFocus ? (
        <View style={styles.focusChoices}>
          <TouchableOpacity
            style={styles.focusBtn}
            activeOpacity={0.85}
            onPress={() => onChooseFocus?.("fieldwork")}
          >
            <Icon name="folder" size={16} color={accent} />
            <Text style={[styles.focusBtnText, { color: accent }]}>
              {t("onboarding.focus.fieldwork", "Hantera projekt och team")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.focusBtn}
            activeOpacity={0.85}
            onPress={() => onChooseFocus?.("billing")}
          >
            <Icon name="file-text" size={16} color={accent} />
            <Text style={[styles.focusBtnText, { color: accent }]}>
              {t("onboarding.focus.billing", "Skicka offert eller faktura")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onChooseFocus?.("skip")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.focusSkip}>
              {t("onboarding.focus.skip", "Hoppa över")}
            </Text>
          </TouchableOpacity>
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
                    ? {
                        backgroundColor: successPopupIconBackground,
                        borderColor: successPopupIconBackground,
                      }
                    : isActive
                      ? {
                          backgroundColor: theme.content.accentSoft,
                          borderColor: accent,
                        }
                      : { borderColor: theme.content.border },
                ]}
              >
                {step.done ? (
                  <Icon name="check" size={15} color={successPopupIconColor} />
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

      {/* Switch to the other focus (once one is picked). */}
      {otherFocus ? (
        <TouchableOpacity
          style={styles.footerCta}
          activeOpacity={0.85}
          onPress={() => onChooseFocus?.(otherFocus)}
        >
          <Icon
            name={otherFocus === "billing" ? "file-text" : "folder"}
            size={16}
            color={accent}
          />
          <Text style={[styles.footerCtaText, { color: accent }]}>
            {otherFocus === "billing"
              ? t("onboarding.focus.billing", "Skicka offert eller faktura")
              : t("onboarding.focus.fieldwork", "Hantera projekt och team")}
          </Text>
          <Icon name="chevron-right" size={18} color={accent} />
        </TouchableOpacity>
      ) : null}

      {/* Change focus (re-open the routing question). */}
      {!isWorker && !needsFocus && focus && focus !== "skip" ? (
        <TouchableOpacity
          onPress={() => onChangeFocus?.()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.changeFocus}>
            {t("onboarding.focus.change", "Byt fokus")}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Worker report-time chooser sheet. */}
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
              styles={styles}
              accent={accent}
              theme={theme}
              icon="map-pin"
              title={t("onboarding.timeSheet.gps", "Automatiskt (GPS)")}
              desc={t(
                "onboarding.timeSheet.gpsDesc",
                "Stämpla in på plats — tiden räknas av sig själv.",
              )}
              onPress={() => chooseTime("gps")}
            />
            <TimeOption
              styles={styles}
              accent={accent}
              theme={theme}
              icon="edit-3"
              title={t("onboarding.timeSheet.manual", "Fyll i timmar")}
              desc={t(
                "onboarding.timeSheet.manualDesc",
                "Ange antal timmar direkt.",
              )}
              onPress={() => chooseTime("manual")}
            />
            <TimeOption
              styles={styles}
              accent={accent}
              theme={theme}
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

function TimeOption({ styles, accent, theme, icon, title, desc, onPress }) {
  return (
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
}
