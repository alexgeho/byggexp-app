import api from "./api";

export const taskService = {
  getAll: async () => {
    const { data } = await api.get("/tasks");
    return data;
  },

  create: async (taskData) => {
    const isFormData =
      typeof FormData !== "undefined" && taskData instanceof FormData;
    const { data } = await api.post(
      "/tasks",
      taskData,
      isFormData
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined,
    );
    return data;
  },

  getByProject: async (projectId) => {
    const { data } = await api.get(`/tasks/project/${projectId}`);
    return data;
  },

  // Fetch a single task by id. Used for deep-linking from a push
  // notification, where only the id is known. Falls back to locating the
  // task within its project (or the full list) if the backend has no
  // single-task endpoint.
  getById: async (id, projectId) => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      return data;
    } catch (error) {
      const list = projectId
        ? await taskService.getByProject(projectId)
        : await taskService.getAll();
      const match = (Array.isArray(list) ? list : []).find(
        (item) => (item?._id || item?.id) === id,
      );
      if (match) {
        return match;
      }
      throw error;
    }
  },

  update: async (id, taskData) => {
    const { data } = await api.put(`/tasks/${id}`, taskData);
    return data;
  },

  complete: async (id) => {
    const { data } = await api.patch(`/tasks/${id}/complete`);
    return data;
  },

  reopen: async (id) => {
    const { data } = await api.patch(`/tasks/${id}/reopen`);
    return data;
  },

  uploadDocuments: async (id, taskData) => {
    const { data } = await api.post(`/tasks/${id}/documents`, taskData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};

export default taskService;
