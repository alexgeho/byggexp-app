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

  // Step 1: minimal sign-up — name/company + email only. A confirmation link is
  // emailed; the password is chosen later, on the page that link opens.
  registerCompany: async ({ companyName, email }) => {
    const { data } = await api.post("/auth/register-company", {
      companyName,
      email,
    });
    return data;
  },

  // Re-send the confirmation link for a pending sign-up.
  resendRegistration: async (email) => {
    const { data } = await api.post("/auth/register-company/resend", { email });
    return data;
  },

  // "Forgot password": email a reset link. Always resolves (the API returns 200
  // even when the email isn't registered). The link opens a web page where the
  // user picks a new password, then signs in with email + that password.
  requestPasswordReset: async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
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
