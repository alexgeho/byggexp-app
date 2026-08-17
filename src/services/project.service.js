import api from "./api";

const getProjectSortTimestamp = (project) => {
  const value =
    project?.createdAt || project?.updatedAt || project?.beginningDate || null;

  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortProjects = (projects, sort) => {
  if (!Array.isArray(projects) || !sort) {
    return projects;
  }

  const sorted = [...projects];

  if (sort === "newest") {
    return sorted.sort(
      (left, right) =>
        getProjectSortTimestamp(right) - getProjectSortTimestamp(left),
    );
  }

  if (sort === "oldest") {
    return sorted.sort(
      (left, right) =>
        getProjectSortTimestamp(left) - getProjectSortTimestamp(right),
    );
  }

  return projects;
};

export const projectService = {
  getAll: async (options = {}) => {
    const { data } = await api.get("/projects");
    return sortProjects(data, options.sort);
  },

  getMyProjects: async (options = {}) => {
    const { data } = await api.get("/projects/my");
    return sortProjects(data, options.sort);
  },

  getByCompany: async (companyId, options = {}) => {
    const { data } = await api.get(`/projects/company/${companyId}`);
    return sortProjects(data, options.sort);
  },

  getPopulated: async () => {
    const { data } = await api.get("/projects/populated");
    return data;
  },

  // Every project the caller can access, each populated (incl. tasks) in a
  // single request — replaces looping getPopulatedById per project. Works for
  // all roles (unlike admin-only /projects/populated).
  getMyPopulated: async () => {
    const { data } = await api.get("/projects/my/populated");
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

  searchAddressSuggestions: async (query, limit = 8) => {
    const { data } = await api.get("/projects/geocode/search", {
      params: {
        query,
        limit,
      },
    });
    return data;
  },

  reverseGeocode: async (latitude, longitude) => {
    const { data } = await api.get("/projects/geocode/reverse", {
      params: {
        lat: latitude,
        lon: longitude,
      },
    });
    return data;
  },

  create: async (projectData) => {
    const isFormData =
      typeof FormData !== "undefined" && projectData instanceof FormData;
    const { data } = await api.post(
      "/projects",
      projectData,
      isFormData
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined,
    );
    return data;
  },

  getByIds: async (ids) => {
    const { data } = await api.post("/projects/by-ids", { ids });
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

  uploadDocuments: async (id, projectData) => {
    const { data } = await api.post(`/projects/${id}/documents`, projectData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  update: async (id, projectData) => {
    const isFormData =
      typeof FormData !== "undefined" && projectData instanceof FormData;
    const { data } = await api.put(
      `/projects/${id}`,
      projectData,
      isFormData
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined,
    );
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
