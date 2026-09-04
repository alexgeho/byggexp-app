import api from "./api";

export const articleService = {
  getAll: async () => {
    const { data } = await api.get("/articles");
    return data;
  },
  getNextNumber: async () => {
    const { data } = await api.get("/articles/next-number");
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/articles", payload);
    return data;
  },
};

export default articleService;
