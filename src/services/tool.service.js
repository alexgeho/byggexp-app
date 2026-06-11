import api from './api';

export const toolService = {
  getAll: async () => {
    const { data } = await api.get('/tools');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/tools/${id}`);
    return data;
  },

  create: async (toolData) => {
    const isFormData = typeof FormData !== 'undefined' && toolData instanceof FormData;
    const { data } = await api.post('/tools', toolData, isFormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined);
    return data;
  },

  update: async (id, toolData) => {
    const isFormData = typeof FormData !== 'undefined' && toolData instanceof FormData;
    const { data } = await api.put(`/tools/${id}`, toolData, isFormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined);
    return data;
  },

  remove: async (id) => {
    const { data } = await api.delete(`/tools/${id}`);
    return data;
  },

  attachToWorker: async (workerId, toolIds) => {
    const { data } = await api.post('/tools/attach-to-worker', {
      workerId,
      toolIds,
    });
    return data;
  },

  attachToProject: async (projectId, toolIds) => {
    const { data } = await api.post('/tools/attach-to-project', {
      projectId,
      toolIds,
    });
    return data;
  },
};

export default toolService;
