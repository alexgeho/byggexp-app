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

  // registered | approved | paid — marking one paid stops its reminders.
  setStatus: async (id, status) => {
    const { data } = await api.patch(`/supplier-invoices/${id}/status`, {
      status,
    });
    return data;
  },
};

export default supplierInvoiceService;
