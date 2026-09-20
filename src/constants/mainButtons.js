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
  // Offers and invoices, each its own entity with its own list — the button
  // opens the list, where "+" creates one, exactly like every other entity.
  // Same Feather glyphs the menu uses. Gated on the finance capability, so a
  // delegated "office" user gets them without an admin role — and off by
  // default: they are added from Customize like any other button.
  {
    id: "offer",
    title: "Offer",
    vectorIcon: "file-text",
    screen: "Offers",
    permission: "finance.manage",
  },
  {
    id: "invoice",
    title: "Invoice",
    // A money glyph, not a second sheet of paper — an invoice has to read as
    // different from the offer next to it at a glance. Feather has no coins;
    // dollar-sign is its money symbol.
    vectorIcon: "dollar-sign",
    screen: "Invoices",
    permission: "finance.manage",
  },
];

export const homeSections = [
  // "Mitt arbete" — bills to pay + overdue tasks, the app's slice of the admin
  // panel's Mitt-arbete page. Off by default: it is added from Customize.
  {
    id: "my-work",
    title: "My work",
  },
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
  {
    id: "notes",
    title: "Notes",
  },
];

// What the home screen looks like once the onboarding question is answered.
// One question with two answers replaces a screen full of equally-weighted
// choices: the same Choice Overload the law warns about is not solved by
// hiding features, but by cutting the number of decisions taken at once.
// Nothing is lost — every feature stays in the menu, this is only the desk.
export const HOME_PRESETS = {
  // Legacy: "I work on my own" is no longer offered (the question asks the
  // web's two), but anyone who answered it before keeps their layout.
  solo: {
    buttons: ["shifts", "projects", "offer", "invoice"],
    sections: ["my-work", "notes"],
  },
  // A crew: who works where, and what they have to do.
  team: {
    buttons: ["shifts", "employees", "projects", "tasks"],
    sections: ["shift-history", "tasks-history"],
  },
  // Mostly paperwork.
  billing: {
    buttons: ["offer", "invoice", "projects", "tasks"],
    sections: ["my-work", "shift-history"],
  },
};

// Admin default (company-admin / admin first launch): the six square buttons
// per the 1.1.1 spec — Anställda, Verktyg, Chattar, Arbetspass, Projekt,
// Uppgifter. Camera stays available as the round secondary action + in Customize,
// it's just not one of the default grid buttons. Also the fallback for any
// non-worker role. Admins can add/remove the rest from Customize.
// First launch, before the question is answered: the three things every role
// starts from. The rest arrives with the answer, or from Customize.
export const defaultEnabledButtons = ["shifts", "projects", "tasks"];

export const defaultEnabledSections = ["shift-history", "notes"];

// Worker default: a lean home — Play + Camera round buttons (Camera is the
// default secondary action), Shifts + Tasks square buttons, and the Project
// Files block (shown only when a project is selected). Workers can enable the
// rest from Customize.
export const workerDefaultEnabledButtons = ["shifts", "tasks"];

export const workerDefaultEnabledSections = ["project-files", "notes"];

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
