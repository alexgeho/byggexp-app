import api from './api';

export const taskService = {
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
