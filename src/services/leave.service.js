import api from "./api";

export const leaveService = {
  // Absence / leave requests (Frånvaro) for the company, role-scoped.
  getAll: async () => {
    const { data } = await api.get("/leave");
    return data;
  },
};

export default leaveService;
