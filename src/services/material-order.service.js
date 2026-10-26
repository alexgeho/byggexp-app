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
  // Grossist articles for the worker's search — no prices, at most 50.
  searchArticles: async ({ supplier, q } = {}) => {
    const { data } = await api.get("/material-orders/articles", {
      params: { supplier: supplier || undefined, q: q || undefined },
    });
    return Array.isArray(data) ? data : [];
  },
  create: async (payload) => {
    const { data } = await api.post("/material-orders", payload);
    return data;
  },
};

export default materialOrderService;
