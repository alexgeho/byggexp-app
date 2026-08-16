import api from "./api";

// Report/block controls required for user-generated content (App Store
// Review Guideline 1.2). Mirrors the backend `moderation` module.
export const moderationService = {
  // Ids the current user has blocked.
  getBlocked: async () => {
    const { data } = await api.get("/moderation/blocked");
    return data;
  },

  blockUser: async (userId) => {
    const { data } = await api.post(`/moderation/block/${userId}`);
    return data;
  },

  unblockUser: async (userId) => {
    const { data } = await api.delete(`/moderation/block/${userId}`);
    return data;
  },

  // reason: "spam" | "harassment" | "inappropriate" | "other"
  reportContent: async ({
    reportedUserId,
    chatId,
    messageId,
    reason,
    note,
  }) => {
    const { data } = await api.post("/moderation/report", {
      reportedUserId,
      chatId,
      messageId,
      reason,
      note,
    });
    return data;
  },
};

export default moderationService;
