import React from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../components/common/ui";
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
