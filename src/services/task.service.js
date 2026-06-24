import api from './api';

export const taskService = {
  getAll: async () => {
    const { data } = await api.get('/tasks');
    return data;
  },

  create: async (taskData) => {
    const isFormData = typeof FormData !== 'undefined' && taskData instanceof FormData;
    const { data } = await api.post('/tasks', taskData, isFormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined);
    return data;
  },

  getByProject: async (projectId) => {
    const { data } = await api.get(`/tasks/project/${projectId}`);
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
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

export default taskService;
