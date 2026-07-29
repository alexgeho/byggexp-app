import api from "./api";

// Clients (Kunder) — customers an offer/invoice is addressed to.
// Backend: /clients, guarded to SuperAdmin/CompanyAdmin.
export const clientService = {
  getAll: async () => {
    const { data } = await api.get("/clients");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/clients/${id}`);
    return data;
  },
  getNextNumber: async () => {
    const { data } = await api.get("/clients/next-number");
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/clients", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/clients/${id}`, payload);
    return data;
  },
};

export default clientService;
