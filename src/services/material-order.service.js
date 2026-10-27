import api from "./api";

// Material orders to a grossist (Lundagrossisten…). Workers only create
// drafts; an admin sends them from the web.
export const materialOrderService = {
  listByProject: async (projectId) => {
    const { data } = await api.get("/material-orders", {
      params: { projectId },
    });
    return Array.isArray(data) ? data : data?.items || [];
  },
  get: async (id) => {
    const { data } = await api.get(`/material-orders/${id}`);
    return data;
  },
  // Grossist articles for the worker's search — no prices, at most 50.
  searchArticles: async ({ supplier, q } = {}) => {
    const { data } = await api.get("/material-orders/articles", {
      params: { supplier: supplier || undefined, q: q || undefined },
    });
    return Array.isArray(data) ? data : [];
  },
  // Grossists the company orders from (names; contact details for admins).
  listSuppliers: async () => {
    const { data } = await api.get("/material-orders/suppliers");
    return Array.isArray(data) ? data : [];
  },
  create: async (payload) => {
    const { data } = await api.post("/material-orders", payload);
    return data;
  },
  // Drafts only, and a worker only their own.
  update: async (id, payload) => {
    const { data } = await api.put(`/material-orders/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/material-orders/${id}`);
    return data;
  },
};

export default materialOrderService;
