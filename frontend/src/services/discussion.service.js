import { apiClient } from "../utils/api.utils.js";

export const discussionService = {
  getCourseDiscussions: async ({ courseId, search = "", resolved = "", page = 1, limit = 20 }) => {
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (resolved !== "") params.append("resolved", resolved);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const response = await apiClient.get(`/discussions/course/${courseId}?${params.toString()}`);
    return response.data?.data;
  },

  getDiscussionById: async (discussionId) => {
    const response = await apiClient.get(`/discussions/${discussionId}`);
    return response.data?.data;
  },

  createDiscussion: async (payload) => {
    const response = await apiClient.post("/discussions", payload);
    return response.data?.data;
  },

  addReply: async ({ discussionId, content }) => {
    const response = await apiClient.post(`/discussions/${discussionId}/replies`, { content });
    return response.data?.data;
  },
};
