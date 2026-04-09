import api from './api';

export const projectService = {
  getAll: async () => {
    const { data } = await api.get('/projects');
    return data;
  },

  getMyProjects: async () => {
    const { data } = await api.get('/projects/my');
    return data;
  },

  getByCompany: async (companyId) => {
    const { data } = await api.get(`/projects/company/${companyId}`);
    return data;
  },

  getPopulated: async () => {
    const { data } = await api.get('/projects/populated');
    return data;
  },

  getInfo: async (id) => {
    const { data } = await api.get(`/projects/info/${id}`);
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  getPopulatedById: async (id) => {
    const { data } = await api.get(`/projects/${id}/populated`);
    return data;
  },

  create: async (projectData) => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },

  getByIds: async (ids) => {
    const { data } = await api.post('/projects/by-ids', { ids });
    return data;
  },

  addWorkers: async (projectId, workerIds) => {
    const { data } = await api.post(`/projects/${projectId}/workers`, {
      workerIds,
    });
    return data;
  },

  addAdmin: async (projectId, userId) => {
    const { data } = await api.post(`/projects/${projectId}/admins/${userId}`);
    return data;
  },

  update: async (id, projectData) => {
    const { data } = await api.put(`/projects/${id}`, projectData);
    return data;
  },

  removeWorker: async (projectId, workerId) => {
    await api.delete(`/projects/${projectId}/workers/${workerId}`);
  },

  delete: async (id) => {
    await api.delete(`/projects/${id}`);
  },
};

export default projectService;
