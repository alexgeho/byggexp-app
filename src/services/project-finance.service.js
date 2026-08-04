import api from "./api";

const num = (value) => Number(value) || 0;
const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const matchesProject = (invoice, projectId) => {
  const raw = invoice?.projectId ?? invoice?.project;
  const id = raw && typeof raw === "object" ? raw._id || raw.id : raw;
  return String(id || "") === String(projectId);
};

// Assembles a single project's economy the same way the admin Finance tab does:
// each per-project summary is fetched separately and combined client-side.
// Resilient — any failed summary (e.g. a role without access) counts as 0.
export const projectFinanceService = {
  getEconomy: async (projectId, { project = {}, hoursWorked = 0 } = {}) => {
    const [expensesRes, supplierRes, ataRes, laborRes, invoicesRes] =
      await Promise.allSettled([
        api.get(`/expenses/project/${projectId}/summary`),
        api.get(`/supplier-invoices/project/${projectId}/summary`),
        api.get(`/ata/project/${projectId}/summary`),
        api.get("/hours/labor-cost"),
        api.get("/invoices"),
      ]);

    const ok = (res, pick, fallback = 0) =>
      res.status === "fulfilled"
        ? (pick(res.value.data) ?? fallback)
        : fallback;

    const expenses = num(ok(expensesRes, (d) => d.total));
    const supplier = num(ok(supplierRes, (d) => d.total));
    const ata = num(ok(ataRes, (d) => d.approvedTotal));
    const laborByProject = num(
      ok(laborRes, (d) => d.byProject?.[projectId], 0),
    );
    const invoices =
      invoicesRes.status === "fulfilled" ? invoicesRes.value.data || [] : [];

    const invoiced = invoices
      .filter((inv) => matchesProject(inv, projectId) && inv.status !== "draft")
      .reduce((sum, inv) => sum + num(inv.total), 0);

    const costRate = num(project.costRatePerHour);
    const billRate = num(project.billRatePerHour);
    const materials = num(project.spentMaterialsCost);
    // Prefer the project cost rate; otherwise fall back to per-employee labor.
    const laborCost = costRate > 0 ? hoursWorked * costRate : laborByProject;
    const laborBilled = billRate > 0 ? hoursWorked * billRate : 0;
    const totalCost = materials + supplier + expenses + laborCost;
    const margin = invoiced - totalCost;
    const marginPct = invoiced > 0 ? Math.round((margin / invoiced) * 100) : 0;

    return {
      hoursWorked: round2(hoursWorked),
      costRate,
      billRate,
      materials: round2(materials),
      supplier: round2(supplier),
      expenses: round2(expenses),
      ata: round2(ata),
      laborCost: round2(laborCost),
      laborBilled: round2(laborBilled),
      invoiced: round2(invoiced),
      totalCost: round2(totalCost),
      margin: round2(margin),
      marginPct,
    };
  },
};

export default projectFinanceService;
