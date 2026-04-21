import { apiClient } from "../utils/api.utils.js";

export const profileService = {
  getProfile: async () => {
    const response = await apiClient.get("/user/profile");
    return response.data?.data;
  },

  updateProfile: async (payload) => {
    const response = await apiClient.put("/user/profile", payload);
    return response.data?.data;
  },

  updateProfileImage: async (file) => {
    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await apiClient.put("/user/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data?.data;
  },

  deleteProfileImage: async () => {
    const response = await apiClient.delete("/user/profile/picture");
    return response.data;
  },

  updatePreferences: async (payload) => {
    const response = await apiClient.put("/user/preferences", payload);
    return response.data?.data;
  },

  deactivateAccount: async (reason) => {
    const response = await apiClient.patch("/user/deactivate", {
      reason,
    });

    return response.data;
  },
};
