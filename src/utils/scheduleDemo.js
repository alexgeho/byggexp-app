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
    { _id: "demo-w1", name: "Anna Karlsson", role: "worker", profession: "Snickare" },
    { _id: "demo-w2", name: "Erik Nilsson", role: "worker", profession: "Elektriker" },
    { _id: "demo-w3", name: "Sara Berg", role: "worker", profession: "Målare" },
    { _id: "demo-w4", name: "Johan Ek", role: "worker", profession: "Betongarbetare" },
  ];

  const projects = [
    {
      _id: "demo-p1",
      name: "Villa Söderberg",
      location: "Storgatan 12",
      status: "in_progress",
      workers: ["demo-w1", "demo-w2", "demo-w3"],
      beginningDate: iso(1),
      endDate: iso(20),
    },
    {
      _id: "demo-p2",
      name: "Kontor Vasastan",
      location: "Vasagatan 5",
      status: "planning",
      workers: ["demo-w2", "demo-w4"],
      beginningDate: iso(3),
      endDate: iso(24),
    },
    {
      _id: "demo-p3",
      name: "Lager Nord",
      location: "Hamnvägen 3",
      status: "in_progress",
      workers: ["demo-w1", "demo-w4"],
      beginningDate: iso(5),
      endDate: iso(26),
    },
  ];

  const tasks = [
    { _id: "demo-t1", taskTitle: "Målning", projectId: "demo-p1", status: "open", startDate: iso(2), dueDate: iso(6) },
    { _id: "demo-t2", taskTitle: "Rivning", projectId: "demo-p1", status: "open", startDate: iso(8), dueDate: iso(12) },
    { _id: "demo-t3", taskTitle: "Elinstallation", projectId: "demo-p2", status: "open", startDate: iso(3), dueDate: iso(9) },
    { _id: "demo-t4", taskTitle: "Gjutning", projectId: "demo-p3", status: "overdue", startDate: iso(5), dueDate: iso(12) },
    { _id: "demo-t5", taskTitle: "Stängsel", projectId: "demo-p1", status: "open", startDate: iso(14), dueDate: iso(17) },
    { _id: "demo-t6", taskTitle: "Svetsning", projectId: "demo-p2", status: "completed", startDate: iso(12), dueDate: iso(18) },
    { _id: "demo-t7", taskTitle: "Golvläggning", projectId: "demo-p3", status: "open", startDate: iso(16), dueDate: iso(22) },
  ];

  return { workers, projects, tasks };
};
