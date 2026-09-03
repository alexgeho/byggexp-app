import React, { useMemo } from "react";

import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import { createStyles } from "./HomeOnboarding.styles";

// "Kom igång" first-run checklist. Renders on Home for admins until every step
// is done (or the card is dismissed). Steps auto-tick from real data via
// useOnboardingProgress; tapping a step routes to the matching screen.
const STEP_ICON = {
  project: "folder",
  team: "user-plus",
  shift: "clock",
  location: "map-pin",
  notifications: "bell",
};

export function HomeOnboarding({ steps, completed, total, onDismiss }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accent = theme.colors.primary;
  const progress = total > 0 ? completed / total : 0;

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

      {steps.map((step) => (
        <TouchableOpacity
          key={step.key}
          style={styles.row}
          disabled={step.done}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(step.screen)}
        >
          <View
            style={[
              styles.check,
              step.done
                ? { backgroundColor: accent, borderColor: accent }
                : { borderColor: theme.content.border },
            ]}
          >
            {step.done ? (
              <Icon name="check" size={14} color="#FFFFFF" />
            ) : (
              <Icon
                name={STEP_ICON[step.key]}
                size={13}
                color={theme.content.textMuted}
              />
            )}
          </View>

          <Text
            style={[styles.rowLabel, step.done && styles.rowLabelDone]}
            numberOfLines={1}
          >
            {t(`onboarding.step.${step.key}`)}
          </Text>

          {!step.done && (
            <Icon
              name="chevron-right"
              size={18}
              color={theme.content.textMuted}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
