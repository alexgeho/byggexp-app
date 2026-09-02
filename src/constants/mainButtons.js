// Icons are the Feather (fi:*) glyphs used in the Figma design, rendered as
// vectors so they stay crisp at any DPI (the old PNG exports were low-res and
// pixelated when upscaled on the home grid).
export const mainButtons = [
  {
    id: "employees",
    title: "Employees",
    vectorIcon: "user-plus",
    screen: "Employees",
    adminOnly: true,
  },
  {
    id: "tools",
    title: "Tools",
    vectorIcon: "tool",
    screen: "Tools",
  },
  {
    id: "camera",
    title: "Camera",
    vectorIcon: "camera",
    screen: "Camera",
  },
  {
    id: "chats",
    title: "Chats",
    vectorIcon: "message-circle",
    screen: "Chats",
  },
  {
    id: "shifts",
    title: "Shifts",
    vectorIcon: "clock",
    screen: "Shifts",
  },
  {
    id: "projects",
    title: "Projects",
    vectorIcon: "folder",
    screen: "Projects",
  },
  {
    id: "tasks",
    title: "Tasks",
    vectorIcon: "check-square",
    screen: "Tasks",
  },
];

export const homeSections = [
  {
    id: "shift-history",
    title: "Daily report",
  },
  {
    id: "tasks-history",
    title: "Tasks",
  },
  {
    id: "project-files",
    title: "Project Files",
  },
];

// Admin default: everything on (admins curate their own home). This is also the
// fallback default for any non-worker role.
export const defaultEnabledButtons = [
  "employees",
  "tools",
  "camera",
  "chats",
  "shifts",
  "projects",
  "tasks",
];

export const defaultEnabledSections = [
  "shift-history",
  "tasks-history",
  "project-files",
];

// Worker default: a lean home — Play + Camera round buttons (Camera is the
// default secondary action), Shifts + Tasks square buttons, and the Project
// Files block (shown only when a project is selected). Workers can enable the
// rest from Customize.
export const workerDefaultEnabledButtons = ["shifts", "tasks"];

export const workerDefaultEnabledSections = ["project-files"];

// Role-tailored first-launch defaults. Workers get the lean set above; every
// other role (the admins) gets the full set. Kept here (not in storage) so the
// storage layer stays role-agnostic and the UI resolves the default.
export function getDefaultEnabledButtons(role) {
  return role === "worker"
    ? [...workerDefaultEnabledButtons]
    : [...defaultEnabledButtons];
}

export function getDefaultEnabledSections(role) {
  return role === "worker"
    ? [...workerDefaultEnabledSections]
    : [...defaultEnabledSections];
}
