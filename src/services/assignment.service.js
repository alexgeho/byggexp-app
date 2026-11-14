import api from "./api";

// Staffing bookings (bemanning): one user planned on one project for a day.
// The same /assignments the web calendar reads and writes.
export const assignmentService = {
  getRange: async (from, to, projectId) => {
    const params = { from, to };
    if (projectId) params.projectId = projectId;
    const { data } = await api.get("/assignments", { params });
    return Array.isArray(data) ? data : [];
  },
  create: async (payload) => {
    const { data } = await api.post("/assignments", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/assignments/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    await api.delete(`/assignments/${id}`);
  },
};

export default assignmentService;
