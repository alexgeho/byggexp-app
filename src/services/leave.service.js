import api from "./api";

export const leaveService = {
  // Absence / leave requests (Frånvaro) for the company, role-scoped.
  getAll: async () => {
    const { data } = await api.get("/leave");
    return data;
  },

  // A worker files their own absence; it waits for a manager.
  create: async ({ type, startDate, endDate, halfDay }) => {
    const { data } = await api.post("/leave", {
      type,
      startDate,
      endDate,
      halfDay,
    });
    return data;
  },
};

export default leaveService;
