import api from "./api";
import { withoutInternal } from "../utils/internalProject";

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

// Lists leave out «Intern tid» unless the caller picks a project for a shift
// ({ includeInternal: true }) — it is not a client site.
const scope = (projects, options = {}) =>
  options.includeInternal ? projects : withoutInternal(projects);

export const projectService = {
  getAll: async (options = {}) => {
    const { data } = await api.get("/projects");
    return sortProjects(scope(data, options), options.sort);
  },

  getMyProjects: async (options = {}) => {
    const { data } = await api.get("/projects/my");
    return sortProjects(scope(data, options), options.sort);
  },

  getByCompany: async (companyId, options = {}) => {
    const { data } = await api.get(`/projects/company/${companyId}`);
    return sortProjects(scope(data, options), options.sort);
  },

  getPopulated: async (options = {}) => {
    const { data } = await api.get("/projects/populated");
    return scope(data, options);
  },

  // Every project the caller can access, each populated (incl. tasks) in a
  // single request — replaces looping getPopulatedById per project. Works for
  // all roles (unlike admin-only /projects/populated).
  getMyPopulated: async (options = {}) => {
    const { data } = await api.get("/projects/my/populated");
    return scope(data, options);
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
