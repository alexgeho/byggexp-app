import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  registerCompany: async ({ companyName, userName, email }) => {
    const { data } = await api.post('/auth/register-company', {
      companyName,
      userName,
      email,
    });
    return data;
  },

  registerSuperAdmin: async (userData) => {
    const { data } = await api.post('/auth/register-superadmin', userData);
    return data;
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return data;
  },

  logout: async () => {
  },
};

export default authService;
