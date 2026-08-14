import api from "./api";

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post("/auth/register", userData);
    return data;
  },

  registerCompany: async ({ companyName, userName, email }) => {
    const { data } = await api.post("/auth/register-company", {
      companyName,
      userName,
      email,
    });
    return data;
  },

  registerSuperAdmin: async (userData) => {
    const { data } = await api.post("/auth/register-superadmin", userData);
    return data;
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },

  magicLogin: async (code) => {
    const { data } = await api.post("/auth/magic-login", { code });
    return data;
  },

  // Ask the backend to email a fresh 6-digit sign-in code. Always resolves
  // (the API returns 200 even when the email isn't registered).
  requestCode: async (email) => {
    const { data } = await api.post("/auth/request-code", { email });
    return data;
  },

  // Exchange the emailed 6-digit code for a session.
  codeLogin: async (email, code) => {
    const { data } = await api.post("/auth/code-login", { email, code });
    return data;
  },

  logout: async () => {},
};

export default authService;
