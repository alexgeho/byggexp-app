import api from "./api";

// The admin's Hours grid: every worker on a project's team, every working day
// in range, with the PLANNED hours taken from the project's work-day schedule
// (plus admin corrections, minus approved leave). The app's "Planned" source
// reads the same numbers, so the phone and the web never disagree.
export const hoursService = {
  // { from: "YYYY-MM-DD", to: "YYYY-MM-DD", projectId? }
  getGrid: async (params) => {
    const { data } = await api.get("/hours", { params });
    return data;
  },
};

export default hoursService;
