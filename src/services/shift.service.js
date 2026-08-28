import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getToken } from "../utils/storage";
import api, { API_BASE_URL } from "./api";

const getMultipartConfig = (payload) =>
  typeof FormData !== "undefined" && payload instanceof FormData
    ? {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    : undefined;

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};

const sanitizeFilePart = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const buildExportFileName = ({
  format = "pdf",
  from,
  to,
  month,
  dates,
  workerName,
  projectName,
}) => {
  const extension = format === "excel" ? "xlsx" : "pdf";
  const rangePart =
    sanitizeFilePart(
      month ||
        dates?.replace(/,/g, "-") ||
        `${from || "from"}-${to || "to"}` ||
        "all-time",
    ) || "all-time";
  const workerPart = sanitizeFilePart(workerName);
  const projectPart = sanitizeFilePart(projectName);
  const nameParts = ["shift-report", rangePart, workerPart, projectPart].filter(
    Boolean,
  );

  return `${nameParts.join("-")}.${extension}`;
};

export const shiftService = {
  start: async (projectId) => {
    const { data } = await api.post("/shifts/start", { projectId });
    return data;
  },

  pause: async (shiftId, payload = {}) => {
    const { data } = await api.post(`/shifts/${shiftId}/pause`, payload);
    return data;
  },

  resume: async (shiftId, payload = {}) => {
    const { data } = await api.post(`/shifts/${shiftId}/resume`, payload);
    return data;
  },

  complete: async (shiftId, payload = {}) => {
    const { data } = await api.post(`/shifts/${shiftId}/complete`, payload);
    return data;
  },

  getCurrent: async (projectId) => {
    const { data } = await api.get("/shifts/current", {
      params: projectId ? { projectId } : undefined,
    });
    return data;
  },

  getMonths: async (params = {}) => {
    const { data } = await api.get("/shifts/months", { params });
    return data;
  },

  getHistory: async (params = {}) => {
    const { data } = await api.get("/shifts/history", { params });
    return data;
  },

  list: async (params = {}) => {
    const { data } = await api.get("/shifts/list", { params });
    return data;
  },

  exportReport: async ({
    format = "pdf",
    workerName,
    projectName,
    ...params
  } = {}) => {
    const token = await getToken();
    if (!token) {
      throw new Error("Authentication token is missing.");
    }

    const baseDirectory =
      FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!baseDirectory) {
      throw new Error("Local file storage is unavailable on this device.");
    }

    const fileName = buildExportFileName({
      format,
      workerName,
      projectName,
      ...params,
    });
    const queryString = buildQueryString({ format, ...params });
    const url = `${API_BASE_URL}/shifts/export${queryString ? `?${queryString}` : ""}`;
    const downloadResult = await FileSystem.downloadAsync(
      url,
      `${baseDirectory}${fileName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (downloadResult.status < 200 || downloadResult.status >= 300) {
      throw new Error("Failed to generate shift export.");
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType:
          format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
        dialogTitle: "Share shift report",
        UTI:
          format === "excel"
            ? "org.openxmlformats.spreadsheetml.sheet"
            : "com.adobe.pdf",
      });
    }

    return downloadResult;
  },

  setManualHours: async (shiftId, durationMs) => {
    const { data } = await api.post(`/shifts/${shiftId}/manual-hours`, {
      durationMs,
    });
    return data;
  },

  // Create (or update) a manual-hours entry for a specific date, with no
  // clock-in. Workers may only pass their own workerId. Upserts by
  // worker+project+date on the backend.
  addManualHours: async ({ workerId, projectId, date, durationMs }) => {
    const { data } = await api.post("/shifts/manual", {
      workerId,
      projectId,
      date,
      durationMs,
    });
    return data;
  },

  uploadPhotos: async (shiftId, files) => {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append("photos", {
        uri: file.uri,
        name: file.name || `shift-photo-${index + 1}.jpg`,
        type: file.mimeType || file.type || "image/jpeg",
      });
    });

    const { data } = await api.post(
      `/shifts/${shiftId}/photos`,
      formData,
      getMultipartConfig(formData),
    );

    return data;
  },
};

export default shiftService;
