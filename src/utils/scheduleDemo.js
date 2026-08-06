// Client-only sample data for previewing the planning screen (varied task
// names -> varied colors). Never written to the backend; gated behind
// __DEV__ + a flag in ScheduleScreen so it can't reach production.
const pad = (value) => String(value).padStart(2, "0");

export const getScheduleDemoData = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const iso = (day) => `${year}-${pad(month + 1)}-${pad(day)}`;

  const workers = [
    {
      _id: "demo-w1",
      name: "Anna Karlsson",
      role: "worker",
      profession: "Snickare",
    },
    {
      _id: "demo-w2",
      name: "Erik Nilsson",
      role: "worker",
      profession: "Elektriker",
    },
    { _id: "demo-w3", name: "Sara Berg", role: "worker", profession: "Målare" },
    {
      _id: "demo-w4",
      name: "Johan Ek",
      role: "worker",
      profession: "Betongarbetare",
    },
  ];

  // Figma bar colors (blue / cyan / purple) — one per project so the demo
  // calendar reads clean, staggered and colorful like the design.
  const BLUE = "#2f6bed";
  const CYAN = "#35bdd6";
  const PURPLE = "#7a2bf0";

  const projects = [
    {
      _id: "demo-p1",
      name: "Villa Söderberg",
      location: "Storgatan 12",
      status: "in_progress",
      color: BLUE,
      workers: ["demo-w1", "demo-w2", "demo-w3"],
      beginningDate: iso(1),
      endDate: iso(20),
    },
    {
      _id: "demo-p2",
      name: "Kontor Vasastan",
      location: "Vasagatan 5",
      status: "planning",
      color: CYAN,
      workers: ["demo-w2", "demo-w4"],
      beginningDate: iso(4),
      endDate: iso(24),
    },
    {
      _id: "demo-p3",
      name: "Lager Nord",
      location: "Hamnvägen 3",
      status: "in_progress",
      color: PURPLE,
      workers: ["demo-w1", "demo-w4"],
      beginningDate: iso(7),
      endDate: iso(26),
    },
  ];

  const tasks = [
    {
      _id: "demo-t1",
      taskTitle: "Målning",
      projectId: "demo-p1",
      status: "open",
      color: BLUE,
      startDate: iso(1),
      dueDate: iso(6),
    },
    {
      _id: "demo-t2",
      taskTitle: "Rivning",
      projectId: "demo-p1",
      status: "open",
      color: BLUE,
      startDate: iso(9),
      dueDate: iso(13),
    },
    {
      _id: "demo-t3",
      taskTitle: "Elinstallation",
      projectId: "demo-p2",
      status: "open",
      color: CYAN,
      startDate: iso(4),
      dueDate: iso(10),
    },
    {
      _id: "demo-t4",
      taskTitle: "Gjutning",
      projectId: "demo-p3",
      status: "overdue",
      color: PURPLE,
      startDate: iso(7),
      dueDate: iso(14),
    },
    {
      _id: "demo-t5",
      taskTitle: "Stängsel",
      projectId: "demo-p1",
      status: "open",
      color: BLUE,
      startDate: iso(15),
      dueDate: iso(18),
    },
    {
      _id: "demo-t6",
      taskTitle: "Svetsning",
      projectId: "demo-p2",
      status: "completed",
      color: CYAN,
      startDate: iso(12),
      dueDate: iso(19),
    },
    {
      _id: "demo-t7",
      taskTitle: "Golvläggning",
      projectId: "demo-p3",
      status: "open",
      color: PURPLE,
      startDate: iso(16),
      dueDate: iso(23),
    },
  ];

  const leaves = [
    {
      _id: "demo-l1",
      userId: "demo-w3",
      type: "vacation",
      status: "approved",
      startDate: iso(13),
      endDate: iso(17),
    },
    {
      _id: "demo-l2",
      userId: "demo-w2",
      type: "sick",
      status: "approved",
      startDate: iso(20),
      endDate: iso(22),
    },
  ];

  return { workers, projects, tasks, leaves };
};
