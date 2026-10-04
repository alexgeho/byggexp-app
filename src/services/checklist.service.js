import api from "./api";

// Egenkontroll (KMA checklists). Backend: /checklists. AI: draft points from a
// contract, and fill points in from site photos (result + date + photo).
export const checklistService = {
  aiStatus: async () => {
    const { data } = await api.get("/checklists/ai-status");
    return data;
  },
  getAll: async (projectId) => {
    const { data } = await api.get("/checklists", {
      params: projectId ? { projectId } : {},
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/checklists/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/checklists", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/checklists/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/checklists/${id}`);
    return data;
  },
  sign: async (id, signedByName) => {
    const { data } = await api.post(`/checklists/${id}/sign`, { signedByName });
    return data;
  },
  // file = { uri, name, mimeType } → { title, category, items, sourceDocument }
  draftFromDocument: async (file) => {
    const body = new FormData();
    body.append("file", {
      uri: file.uri,
      name: file.name || "avtal.pdf",
      type: file.mimeType || "application/pdf",
    });
    const { data } = await api.post("/checklists/draft-from-document", body, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180000,
    });
    return data;
  },
  // photos = [{ uri, name, mimeType }], meta = [{ takenAt, lat, lng }] (same order)
  addPhotos: async (id, photos, meta = []) => {
    const body = new FormData();
    photos.forEach((p, i) =>
      body.append("photos", {
        uri: p.uri,
        name: p.name || `foto-${i + 1}.jpg`,
        type: p.mimeType || "image/jpeg",
      }),
    );
    body.append("meta", JSON.stringify(meta));
    const { data } = await api.post(`/checklists/${id}/photos`, body, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180000,
    });
    return data;
  },
  decide: async (id, index, accept) => {
    const { data } = await api.post(
      `/checklists/${id}/items/${index}/suggestion`,
      { accept },
    );
    return data;
  },
};

export default checklistService;
