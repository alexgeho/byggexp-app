import api from './api';

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

const filePart = (file, fallbackName = 'kvitto.jpg') => ({
  uri: file.uri,
  name: file.name || file.fileName || fallbackName,
  type: file.mimeType || file.type || 'image/jpeg',
});

export const expenseService = {
  // Whether receipt scanning (Claude vision) is configured on the backend.
  scanStatus: async () => {
    try {
      const { data } = await api.get('/scan/status');
      return Boolean(data?.enabled);
    } catch {
      return false;
    }
  },

  // Extract structured fields from a photographed receipt.
  scan: async (file) => {
    const formData = new FormData();
    formData.append('file', filePart(file));
    const { data } = await api.post('/scan', formData, multipartConfig);
    return data;
  },

  create: async (payload) => {
    const { data } = await api.post('/expenses', payload);
    return data;
  },

  // Attach the photo to a saved expense as its receipt.
  uploadReceipt: async (id, file) => {
    const formData = new FormData();
    formData.append('file', filePart(file));
    const { data } = await api.post(
      `/expenses/${id}/receipt`,
      formData,
      multipartConfig,
    );
    return data;
  },
};

export default expenseService;
