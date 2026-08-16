import api from "./api";

const getMultipartConfig = (payload) =>
  typeof FormData !== "undefined" && payload instanceof FormData
    ? {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    : undefined;

export const userService = {
  getAll: async () => {
    const { data } = await api.get("/users");
    return data;
  },

  getByCompany: async (companyId) => {
    const { data } = await api.get(`/users/company/${companyId}`);
    return data;
  },

  getMyCompanyUsers: async () => {
    const { data } = await api.get("/users/my-company");
    return data;
  },

  // Colleagues the current user can chat with (all roles; workers get
  // co-project members, admins get the whole company).
  getColleagues: async () => {
    const { data } = await api.get("/users/colleagues");
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
    const { data } = await api.get("/users/by-email", { params: { email } });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  getDetail: async (id) => {
    const { data } = await api.get(`/users/${id}/detail`);
    return data;
  },

  getNotes: async (id) => {
    const { data } = await api.get(`/users/${id}/notes`);
    return data;
  },

  createNote: async (id, text) => {
    const { data } = await api.post(`/users/${id}/notes`, { text });
    return data;
  },

  deleteNote: async (id, noteId) => {
    const { data } = await api.delete(`/users/${id}/notes/${noteId}`);
    return data;
  },

  create: async (userData) => {
    const { data } = await api.post("/users", userData);
    return data;
  },

  getByIds: async (ids) => {
    const { data } = await api.post("/users/by-ids", { ids });
    return data;
  },

  update: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },

  // Capability catalog incl. defaultsByRole — used to compute minimal
  // granted/revoked overrides when toggling a permission.
  getPermissionsCatalog: async () => {
    const { data } = await api.get("/users/permissions/catalog");
    return data;
  },

  // Replace a user's permission overrides (companyAdmin/superadmin only).
  updatePermissions: async (id, { granted = [], revoked = [] }) => {
    const { data } = await api.put(`/users/permissions/${id}`, {
      granted,
      revoked,
    });
    return data;
  },

  uploadAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append("avatar", {
      uri: file.uri,
      name: file.name || `avatar-${Date.now()}.jpg`,
      type: file.mimeType || file.type || "image/jpeg",
    });

    const { data } = await api.post(
      `/users/${id}/avatar`,
      formData,
      getMultipartConfig(formData),
    );

    return data;
  },

  uploadDocuments: async (id, files) => {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append("documents", {
        uri: file.uri,
        name: file.name || `document-${index + 1}`,
        type: file.mimeType || file.type || "application/octet-stream",
      });
    });

    const { data } = await api.post(
      `/users/${id}/documents`,
      formData,
      getMultipartConfig(formData),
    );

    return data;
  },

  delete: async (id) => {
    await api.delete(`/users/${id}`);
  },

  // Delete (GDPR-erase) the currently authenticated user's own account.
  deleteAccount: async () => {
    await api.post("/gdpr/me/erase");
  },

  getWorkers: async () => {
    return await userService.getByRole("worker");
  },

  getProjectAdmins: async () => {
    return await userService.getByRole("projectAdmin");
  },

  getCompanyAdmins: async () => {
    return await userService.getByRole("companyAdmin");
  },
};

export default userService;
