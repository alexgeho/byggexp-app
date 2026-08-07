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
    title: "Shift history",
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
