import api from "./api";

export const bugReportService = {
  create: async (bugReportData) => {
    const isFormData =
      typeof FormData !== "undefined" && bugReportData instanceof FormData;
    const { data } = await api.post(
      "/bug-reports",
      bugReportData,
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
};

export default bugReportService;
