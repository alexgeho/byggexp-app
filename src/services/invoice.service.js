import api from "./api";

// Invoices (Faktura). Backend: /invoices, guarded to SuperAdmin/CompanyAdmin.
// Invoices are immutable once they leave "draft" — correct via credit().
export const invoiceService = {
  getAll: async () => {
    const { data } = await api.get("/invoices");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },
  getNextNumber: async () => {
    const { data } = await api.get("/invoices/next-number");
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/invoices", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/invoices/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/invoices/${id}`);
    return data;
  },
  copy: async (id) => {
    const { data } = await api.post(`/invoices/${id}/copy`);
    return data;
  },
  credit: async (id) => {
    const { data } = await api.post(`/invoices/${id}/credit`);
    return data;
  },
  // Emails the customer with the PDF attached; flips draft -> sent.
  send: async (id, body) => {
    const { data } = await api.post(`/invoices/${id}/send`, body || {});
    return data;
  },
  setStatus: async (id, status) => {
    const { data } = await api.patch(`/invoices/${id}/status`, { status });
    return data;
  },
  pdfPath: (id) => `/invoices/${id}/pdf`,
};

export default invoiceService;
