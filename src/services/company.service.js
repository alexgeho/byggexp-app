import api from './api';

export const companyService = {
  getAll: async () => {
    const { data } = await api.get('/company');
    return data;
  },

  getMyCompany: async () => {
    const { data } = await api.get('/company/my');
    return data;
  },

  getInfo: async (id) => {
    const { data } = await api.get(`/company/info/${id}`);
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/company/${id}`);
    return data;
  },

  create: async (companyData) => {
    const { data } = await api.post('/company', companyData);
    return data;
  },

  register: async (registerData) => {
    const { data } = await api.post('/company/register', registerData);
    return data;
  },

  getByIds: async (ids) => {
    const { data } = await api.post('/company/by-ids', { ids });
    return data;
  },

  update: async (id, companyData) => {
    const { data } = await api.put(`/company/${id}`, companyData);
    return data;
  },

  delete: async (id) => {
    await api.delete(`/company/${id}`);
  },
};

export default companyService;
