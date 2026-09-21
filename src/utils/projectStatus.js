// Project status colors. Mirrors the admin's semantic scheme
// (blue = planned, green = active, grey = done, amber = paused) using the
// app's soft-badge shades — dark text on a light tinted background — so the
// labels stay readable on light surfaces.
export const PROJECT_STATUS_BADGES = {
  planning: { color: "#0785F4", backgroundColor: "#0785F41A" }, // blue — scheduled
  in_progress: { color: "#248A3D", backgroundColor: "#34C75924" }, // green — active
  completed: { color: "#698196", backgroundColor: "#69819624" }, // grey — done, muted
  on_hold: { color: "#C77700", backgroundColor: "#FF95001F" }, // amber — paused
};

const DEFAULT_STATUS_BADGE = {
  color: "#698196",
  backgroundColor: "#69819624",
};

// Dark theme: the same semantics, but the bright foreground + translucent
// tint the dark tokens define. The light pairs above are tuned for a white
// card and go muddy on a near-black one.
const darkStatusBadges = (c) => ({
  planning: { color: c.accent, backgroundColor: c.accentSoft },
  in_progress: { color: c.success, backgroundColor: c.successSoft },
  completed: { color: c.textSecondary, backgroundColor: c.statusOffDutySoft },
  on_hold: { color: c.warning, backgroundColor: c.warningSoft },
});

export function getProjectStatusBadgeStyle(status, content) {
  if (content?.scheme === "dark") {
    const badges = darkStatusBadges(content);
    return badges[status] || badges.completed;
  }
  return PROJECT_STATUS_BADGES[status] || DEFAULT_STATUS_BADGE;
}

export function formatProjectStatus(status) {
  if (!status) return "";

  const normalized = status.replace(/_/g, " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
