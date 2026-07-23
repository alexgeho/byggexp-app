export const TOOL_STATUS = {
  AVAILABLE: "available",
  BROKEN: "broken",
  IN_REPAIR: "in_repair",
  OCCUPIED: "occupied",
};

export const DEFAULT_TOOL_STATUS = TOOL_STATUS.AVAILABLE;

export const TOOL_STATUS_OPTIONS = [
  { value: TOOL_STATUS.AVAILABLE, label: "Available", tone: "available" },
  { value: TOOL_STATUS.BROKEN, label: "Broken", tone: "broken" },
  { value: TOOL_STATUS.IN_REPAIR, label: "In repair", tone: "in_repair" },
  { value: TOOL_STATUS.OCCUPIED, label: "Occupied", tone: "occupied" },
];

export function getToolStatusMeta(status) {
  return (
    TOOL_STATUS_OPTIONS.find((option) => option.value === status) ||
    TOOL_STATUS_OPTIONS[0]
  );
}
