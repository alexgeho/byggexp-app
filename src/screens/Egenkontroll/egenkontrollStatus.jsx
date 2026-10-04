import React from "react";
import { useTranslation } from "react-i18next";

import { View } from "react-native";

import { Badge } from "../../components/common/ui";
import { radius } from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";

// Status → the same tinted pill + "•" as the staff live-status badge
// (utils/workerStatusBadge): signed = green, completed = blue, draft = amber.
const colorsFor = (c, status) =>
  status === "signed"
    ? { backgroundColor: c.statusAtWorkSoft, color: c.statusAtWork }
    : status === "completed"
      ? { backgroundColor: c.statusWaitingSoft, color: c.statusWaiting }
      : { backgroundColor: c.warningSoft, color: c.warning };

export function EgenkontrollStatusBadge({ status }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <Badge
      label={`• ${t(`egenkontroll.status.${status || "draft"}`)}`}
      {...colorsFor(theme.content, status)}
    />
  );
}

// { done, total } answered points, for egenkontroll.pointsDone.
export const progressOf = (item) => {
  const list = item?.items || [];
  return {
    done: list.filter((it) => it.result && it.result !== "pending").length,
    total: list.length,
  };
};

// Unfinished first (they still need the user), signed last; order kept within.
export const unfinishedFirst = (list) =>
  [...list].sort((a, b) => (a.status === "signed") - (b.status === "signed"));

// Thin progress track (same as the home "Kom igång" checklist).
export function EgenkontrollProgress({ item, trackColor }) {
  const { theme } = useTheme();
  const c = theme.content;
  const { done, total } = progressOf(item);
  const signed = item?.status === "signed";
  return (
    <View
      style={{
        height: 6,
        borderRadius: radius.full,
        overflow: "hidden",
        backgroundColor: trackColor || c.inputSurface,
      }}
    >
      <View
        style={{
          height: "100%",
          borderRadius: radius.full,
          width: `${total ? Math.round((done / total) * 100) : 0}%`,
          backgroundColor: signed ? c.success : c.accent,
        }}
      />
    </View>
  );
}
