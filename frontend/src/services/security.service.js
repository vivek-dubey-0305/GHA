import { apiClient } from "../utils/api.utils.js";

export const securityService = {
  changePassword: async (payload) => {
    const response = await apiClient.post("/user/auth/change-password", payload);
    return response.data;
  },

  getSessions: async () => {
    const response = await apiClient.get("/user/auth/sessions");
    return response.data?.data?.sessions || [];
  },

  revokeSession: async (sessionId) => {
    const response = await apiClient.post("/user/auth/logout-session", { sessionId });
    return response.data;
  },

  logoutAllOtherSessions: async () => {
    const response = await apiClient.post("/user/auth/logout-all-sessions", {});
    return response.data;
  },
};
