export const mainButtons = [
  {
    id: "employees",
    title: "Employees",
    icon: require("../assets/mainButtons/employees.png"),
    screen: "Employees",
    adminOnly: true,
  },
  {
    id: "tools",
    title: "Instruments",
    icon: require("../assets/mainButtons/tools.png"),
    screen: "Tools",
  },
  {
    id: "camera",
    title: "Camera",
    icon: require("../assets/mainButtons/Camera.png"),
    screen: "Camera",
  },
  {
    id: "chats",
    title: "Chats",
    icon: require("../assets/mainButtons/messager.png"),
    screen: "Chats",
  },
  {
    id: "shifts",
    title: "Shifts",
    icon: require("../assets/mainButtons/shifts.png"),
    screen: "Shifts",
  },
  {
    id: "projects",
    title: "Projects",
    icon: require("../assets/mainButtons/projects.png"),
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
  "project-files",
];