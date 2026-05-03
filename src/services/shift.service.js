import api from './api';

const getMultipartConfig = (payload) => (
  typeof FormData !== 'undefined' && payload instanceof FormData
    ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    : undefined
);

export const shiftService = {
  start: async (projectId) => {
    const { data } = await api.post('/shifts/start', { projectId });
    return data;
  },

  pause: async (shiftId) => {
    const { data } = await api.post(`/shifts/${shiftId}/pause`);
    return data;
  },

  resume: async (shiftId) => {
    const { data } = await api.post(`/shifts/${shiftId}/resume`);
    return data;
  },

  complete: async (shiftId) => {
    const { data } = await api.post(`/shifts/${shiftId}/complete`);
    return data;
  },

  getCurrent: async (projectId) => {
    const { data } = await api.get('/shifts/current', {
      params: projectId ? { projectId } : undefined,
    });
    return data;
  },

  getMonths: async (params = {}) => {
    const { data } = await api.get('/shifts/months', { params });
    return data;
  },

  getHistory: async (params = {}) => {
    const { data } = await api.get('/shifts/history', { params });
    return data;
  },

  list: async (params = {}) => {
    const { data } = await api.get('/shifts/list', { params });
    return data;
  },

  uploadPhotos: async (shiftId, files) => {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append('photos', {
        uri: file.uri,
        name: file.name || `shift-photo-${index + 1}.jpg`,
        type: file.mimeType || file.type || 'image/jpeg',
      });
    });

    const { data } = await api.post(
      `/shifts/${shiftId}/photos`,
      formData,
      getMultipartConfig(formData),
    );

    return data;
  },
};

export default shiftService;
