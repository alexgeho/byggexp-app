import api from "./api";

// Anteckningar — personal notes. Backend: /notes, private per user
// (tenant-isolated). Every authenticated user manages their own.
export const notesService = {
  getAll: async () => {
    const { data } = await api.get("/notes");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/notes/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/notes", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/notes/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/notes/${id}`);
    return data;
  },
};

export default notesService;
