import React, { useMemo } from "react";

import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import { track } from "../../../utils/analytics";
import { createStyles } from "./HomeOnboarding.styles";

// "Kom igång" first-run checklist. Mirrors the admin dashboard's onboarding
// principle (Linear/Stripe style): a short list of setup steps, each with a
// title + one-line description, live completion detection, and a single
// highlighted "do this next" step.
//
// Admin steps deep-link to the screen that finishes them. The worker's single
// step ("log your first time") is adaptive and acts in-place on Home instead of
// navigating: with location granted it nudges Play (auto clock-in); without it,
// it opens the manual hours wheel — via the onStartShift / onLogHours callbacks.
const STEP_ICON = {
  project: "folder",
  team: "user-plus",
  shift: "clock",
  time: "clock",
  location: "map-pin",
  notifications: "bell",
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// i18n key for a step's title/description. The adaptive time step keys off its
// mode (auto/manual); every other step keys off its plain key.
const titleKey = (step) =>
  step.action === "time"
    ? `onboarding.step.time${cap(step.mode)}`
    : `onboarding.step.${step.key}`;
const descKey = (step) =>
  step.action === "time"
    ? `onboarding.stepDesc.time${cap(step.mode)}`
    : `onboarding.stepDesc.${step.key}`;

export function HomeOnboarding({
  role,
  steps,
  completed,
  total,
  onDismiss,
  onStartShift,
  onLogHours,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accent = theme.colors.primary;
  const progress = total > 0 ? completed / total : 0;
  const isWorker = role === "worker";
  const single = total === 1; // hide progress chrome for a one-step card

  // Attention hierarchy: the first not-done step is the single "do this next"
  // focal point — highlighted with a primary CTA. Everything else is muted.
  const activeKey = steps.find((s) => !s.done)?.key || null;

  const runStep = (step) => {
    if (step.action === "time") {
      track("onboarding_step_clicked", { step: step.key, mode: step.mode });
      if (step.mode === "auto") {
        onStartShift?.();
      } else {
        onLogHours?.();
      }
      return;
    }
    track("onboarding_step_clicked", { step: step.key });
    navigation.navigate(step.screen);
  };

  const goToBilling = () => {
    track("onboarding_billing_clicked", { role });
    navigation.navigate("Economy");
  };

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
                  {t(titleKey(step))}
                </Text>
                {!step.done ? (
                  <Text style={styles.rowDesc} numberOfLines={2}>
                    {t(descKey(step), "")}
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
    </View>
  );
}
