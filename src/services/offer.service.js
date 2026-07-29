import api from "./api";

// Offers (Offert). Backend: /offers, guarded to SuperAdmin/CompanyAdmin.
// Offers have no server-side email — the app shares the PDF and marks the
// offer sent via update({ status: "sent" }).
export const offerService = {
  getAll: async () => {
    const { data } = await api.get("/offers");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/offers/${id}`);
    return data;
  },
  getNextNumber: async () => {
    const { data } = await api.get("/offers/next-number");
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/offers", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/offers/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/offers/${id}`);
    return data;
  },
  copy: async (id) => {
    const { data } = await api.post(`/offers/${id}/copy`);
    return data;
  },
  markSent: async (id) => {
    const { data } = await api.put(`/offers/${id}`, { status: "sent" });
    return data;
  },
  // Relative path to the PDF endpoint (download via file system with auth).
  pdfPath: (id) => `/offers/${id}/pdf`,
};

export default offerService;
