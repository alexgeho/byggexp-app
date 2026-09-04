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
// highlighted "do this next" step. Steps auto-tick from real data via
// useOnboardingProgress; tapping a step routes to the screen that finishes it.
// For admins a footer CTA points at the money path (offer/invoice), like the
// admin checklist's billing focus.
const STEP_ICON = {
  project: "folder",
  team: "user-plus",
  shift: "clock",
  location: "map-pin",
  notifications: "bell",
};

export function HomeOnboarding({ role, steps, completed, total, onDismiss }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accent = theme.colors.primary;
  const progress = total > 0 ? completed / total : 0;
  const isWorker = role === "worker";

  // Attention hierarchy: the first not-done step is the single "do this next"
  // focal point — highlighted with a primary CTA. Everything else is muted.
  const activeKey = steps.find((s) => !s.done)?.key || null;

  const goToStep = (step) => {
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
          <Text style={styles.subtitle}>
            {t("onboarding.progress", "{{done}} av {{total}} klara", {
              done: completed,
              total,
            })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={t("onboarding.dismiss", "Dölj")}
        >
          <Icon name="x" size={20} color={theme.content.textMuted} />
        </TouchableOpacity>
      </View>

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

      <View style={styles.list}>
        {steps.map((step) => {
          const isActive = !step.done && step.key === activeKey;
          return (
            <TouchableOpacity
              key={step.key}
              style={[styles.row, isActive && styles.rowActive]}
              disabled={step.done}
              activeOpacity={0.7}
              onPress={() => goToStep(step)}
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
    </View>
  );
}
