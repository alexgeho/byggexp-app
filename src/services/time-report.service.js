import api from './api';

export const timeReportService = {
  create: async (reportData) => {
    const { data } = await api.post('/time-reports', reportData);
    return data;
  },

  getMyReports: async () => {
    const { data } = await api.get('/time-reports/my');
    return data;
  },

  getByProject: async (projectId) => {
    const { data } = await api.get(`/time-reports/project/${projectId}`);
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/time-reports/${id}`);
    return data;
  },

  update: async (id, reportData) => {
    const { data } = await api.put(`/time-reports/${id}`, reportData);
    return data;
  },

  delete: async (id) => {
    await api.delete(`/time-reports/${id}`);
  },

  export: async (projectId, filters) => {
    const { data } = await api.post(`/time-reports/export`, {
      projectId,
      ...filters,
    }, {
      responseType: 'blob',
    });
    return data;
  },
};

export default timeReportService;
