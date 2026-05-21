import api from './api';

export const chatService = {
  getAll: async () => {
    const { data } = await api.get('/chats');
    return data;
  },

  getById: async (chatId) => {
    const { data } = await api.get(`/chats/${chatId}`);
    return data;
  },

  getOrCreateDirect: async (participantId) => {
    const { data } = await api.post('/chats/direct', { participantId });
    return data;
  },

  getOrCreateProjectGroup: async (projectId, title) => {
    const payload = title ? { projectId, title } : { projectId };
    const { data } = await api.post('/chats/project-group', payload);
    return data;
  },

  getMessages: async (chatId) => {
    const { data } = await api.get(`/messages/chat/${chatId}`);
    return data;
  },

  markAsRead: async (chatId) => {
    const { data } = await api.post(`/chats/${chatId}/read`);
    return data;
  },

  sendMessage: async (chatId, text) => {
    const { data } = await api.post(`/messages/chat/${chatId}`, { text });
    return data;
  },
};

export default chatService;
