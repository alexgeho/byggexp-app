import api from './api';

export const userService = {
  getAll: async () => {
    const { data } = await api.get('/users');
    return data;
  },

  getByCompany: async (companyId) => {
    const { data } = await api.get(`/users/company/${companyId}`);
    return data;
  },

  getByProject: async (projectId) => {
    const { data } = await api.get(`/users/project/${projectId}`);
    return data;
  },

  getByRole: async (role) => {
    const { data } = await api.get(`/users/role/${role}`);
    return data;
  },

  getInfo: async (id) => {
    const { data } = await api.get(`/users/info/${id}`);
    return data;
  },

  getByEmail: async (email) => {
    const { data } = await api.get('/users/by-email', { params: { email } });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  create: async (userData) => {
    const { data } = await api.post('/users', userData);
    return data;
  },

  getByIds: async (ids) => {
    const { data } = await api.post('/users/by-ids', { ids });
    return data;
  },

  update: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },

  delete: async (id) => {
    await api.delete(`/users/${id}`);
  },

  getWorkers: async () => {
    return await userService.getByRole('worker');
  },

  getProjectAdmins: async () => {
    return await userService.getByRole('projectAdmin');
  },

  getCompanyAdmins: async () => {
    return await userService.getByRole('companyAdmin');
  },
};

export default userService;
