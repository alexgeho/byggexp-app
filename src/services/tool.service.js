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

  replaceWorkerAssignments: async (workerId, toolIds) => {
    const { data } = await api.put(`/tools/worker/${workerId}/assignments`, {
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

  // Look up a tool by the QR code printed on its label (e.g. "TL-4K9Q2X").
  scanByQr: async (qrId) => {
    const { data } = await api.get(`/tools/scan/${encodeURIComponent(qrId)}`);
    return data;
  },

  // Hand a tool over to a person / project, or return it to storage (empty
  // toUserId). Logs an event server-side.
  handoff: async (id, payload) => {
    const { data } = await api.post(`/tools/${id}/handoff`, payload);
    return data;
  },

  history: async (id) => {
    const { data } = await api.get(`/tools/${id}/history`);
    return data;
  },
};

export default toolService;
