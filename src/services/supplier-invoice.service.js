import api from "./api";

// Incoming (supplier) invoices — the bills the company has to PAY, as opposed to
// invoice.service.js which is what it sends to customers.
export const supplierInvoiceService = {
  getAll: async (projectId) => {
    const { data } = await api.get("/supplier-invoices", {
      params: projectId ? { projectId } : undefined,
    });
    return data;
  },

  create: async (payload) => {
    const { data } = await api.post("/supplier-invoices", payload);
    return data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/supplier-invoices/${id}`, payload);
    return data;
  },

  remove: async (id) => {
    const { data } = await api.delete(`/supplier-invoices/${id}`);
    return data;
  },

  // Attach the photographed or scanned bill to an invoice already registered.
  addAttachments: async (id, formData) => {
    const { data } = await api.post(
      `/supplier-invoices/${id}/attachments`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  // registered | approved | paid — marking one paid stops its reminders.
  setStatus: async (id, status) => {
    const { data } = await api.patch(`/supplier-invoices/${id}/status`, {
      status,
    });
    return data;
  },
};

export default supplierInvoiceService;
