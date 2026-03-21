import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils.js';

/**
 * Instructor Profile Slice
 * Handles all instructor profile management including:
 * - Basic profile updates (name, bio, contact)
 * - Professional information (specializations, skills, achievements)
 * - Work experience and qualifications
 * - Preferences and media assets
 */

// ===== THUNKS =====

// Get instructor profile
export const getMyProfile = createAsyncThunk(
  'instructor/getMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/instructor/profile');
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get profile';
      return rejectWithValue(message);
    }
  }
);

// Update full profile
export const updateMyProfile = createAsyncThunk(
  'instructor/updateMyProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiClient.put('/instructor/profile', formData, {
        headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

// Update professional info
export const updateProfessionalInfo = createAsyncThunk(
  'instructor/updateProfessionalInfo',
  async (professionalData, { rejectWithValue }) => {
    try {
      const response = await apiClient.put('/instructor/professional-info', professionalData);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update professional info';
      return rejectWithValue(message);
    }
  }
);

// Add specialization
export const addSpecialization = createAsyncThunk(
  'instructor/addSpecialization',
  async (specialization, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/instructor/specializations', specialization);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add specialization';
      return rejectWithValue(message);
    }
  }
);

// Update specialization
export const updateSpecialization = createAsyncThunk(
  'instructor/updateSpecialization',
  async ({ id, specialization }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/instructor/specializations/${id}`, specialization);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update specialization';
      return rejectWithValue(message);
    }
  }
);

// Remove specialization
export const removeSpecialization = createAsyncThunk(
  'instructor/removeSpecialization',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/instructor/specializations/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to remove specialization';
      return rejectWithValue(message);
    }
  }
);

// Add skill
export const addSkill = createAsyncThunk(
  'instructor/addSkill',
  async (skill, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/instructor/skills', skill);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add skill';
      return rejectWithValue(message);
    }
  }
);

// Remove skill
export const removeSkill = createAsyncThunk(
  'instructor/removeSkill',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/instructor/skills/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to remove skill';
      return rejectWithValue(message);
    }
  }
);

// Add work experience
export const addWorkExperience = createAsyncThunk(
  'instructor/addWorkExperience',
  async (workExp, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/instructor/work-experience', workExp);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add work experience';
      return rejectWithValue(message);
    }
  }
);

// Remove work experience
export const removeWorkExperience = createAsyncThunk(
  'instructor/removeWorkExperience',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/instructor/work-experience/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to remove work experience';
      return rejectWithValue(message);
    }
  }
);

// Add qualification
export const addQualification = createAsyncThunk(
  'instructor/addQualification',
  async (qualification, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/instructor/qualifications', qualification);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add qualification';
      return rejectWithValue(message);
    }
  }
);

// Remove qualification
export const removeQualification = createAsyncThunk(
  'instructor/removeQualification',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/instructor/qualifications/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to remove qualification';
      return rejectWithValue(message);
    }
  }
);

// Add achievement
export const addAchievement = createAsyncThunk(
  'instructor/addAchievement',
  async (achievement, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/instructor/achievements', achievement);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add achievement';
      return rejectWithValue(message);
    }
  }
);

// Remove achievement
export const removeAchievement = createAsyncThunk(
  'instructor/removeAchievement',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/instructor/achievements/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to remove achievement';
      return rejectWithValue(message);
    }
  }
);

// Update preferences
export const updatePreferences = createAsyncThunk(
  'instructor/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await apiClient.put('/instructor/preferences', preferences);
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update preferences';
      return rejectWithValue(message);
    }
  }
);

// Delete profile picture
export const deleteMyProfilePicture = createAsyncThunk(
  'instructor/deleteMyProfilePicture',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete('/instructor/profile-picture');
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete profile picture';
      return rejectWithValue(message);
    }
  }
);

// Delete banner image
export const deleteMyBannerImage = createAsyncThunk(
  'instructor/deleteMyBannerImage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete('/instructor/banner-image');
      return response.data?.data || response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete banner image';
      return rejectWithValue(message);
    }
  }
);

// ===== INITIAL STATE =====

const initialState = {
  // Profile data
  profile: null,
  
  // Get profile states
  getProfileLoading: false,
  getProfileError: null,

  // Update profile states
  updateProfileLoading: false,
  updateProfileError: null,
  updateProfileSuccess: false,

  // Professional info states
  updateProfessionalInfoLoading: false,
  updateProfessionalInfoError: null,

  // Specializations states
  addSpecializationLoading: false,
  addSpecializationError: null,
  updateSpecializationLoading: false,
  updateSpecializationError: null,
  removeSpecializationLoading: false,
  removeSpecializationError: null,

  // Skills states
  addSkillLoading: false,
  addSkillError: null,
  removeSkillLoading: false,
  removeSkillError: null,

  // Work experience states
  addWorkExperienceLoading: false,
  addWorkExperienceError: null,
  removeWorkExperienceLoading: false,
  removeWorkExperienceError: null,

  // Qualifications states
  addQualificationLoading: false,
  addQualificationError: null,
  removeQualificationLoading: false,
  removeQualificationError: null,

  // Achievements states
  addAchievementLoading: false,
  addAchievementError: null,
  removeAchievementLoading: false,
  removeAchievementError: null,

  // Preferences states
  updatePreferencesLoading: false,
  updatePreferencesError: null,

  // Media deletion states
  deleteProfilePictureLoading: false,
  deleteProfilePictureError: null,
  deleteProfilePictureSuccess: false,
  deleteBannerImageLoading: false,
  deleteBannerImageError: null,
  deleteBannerImageSuccess: false
};

// ===== SLICE =====

const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    // Clear error actions
    clearGetProfileError: (state) => {
      state.getProfileError = null;
    },
    clearUpdateProfileError: (state) => {
      state.updateProfileError = null;
    },
    clearUpdateProfessionalInfoError: (state) => {
      state.updateProfessionalInfoError = null;
    },
    clearAddSpecializationError: (state) => {
      state.addSpecializationError = null;
    },
    clearRemoveSpecializationError: (state) => {
      state.removeSpecializationError = null;
    },
    clearAddSkillError: (state) => {
      state.addSkillError = null;
    },
    clearRemoveSkillError: (state) => {
      state.removeSkillError = null;
    },
    clearAddWorkExperienceError: (state) => {
      state.addWorkExperienceError = null;
    },
    clearRemoveWorkExperienceError: (state) => {
      state.removeWorkExperienceError = null;
    },
    clearAddQualificationError: (state) => {
      state.addQualificationError = null;
    },
    clearRemoveQualificationError: (state) => {
      state.removeQualificationError = null;
    },
    clearAddAchievementError: (state) => {
      state.addAchievementError = null;
    },
    clearRemoveAchievementError: (state) => {
      state.removeAchievementError = null;
    },
    clearUpdatePreferencesError: (state) => {
      state.updatePreferencesError = null;
    },
    clearDeleteProfilePictureError: (state) => {
      state.deleteProfilePictureError = null;
    },
    clearDeleteBannerImageError: (state) => {
      state.deleteBannerImageError = null;
    },

    // Reset success states
    resetUpdateProfileSuccess: (state) => {
      state.updateProfileSuccess = false;
    },
    resetDeleteProfilePictureSuccess: (state) => {
      state.deleteProfilePictureSuccess = false;
    },
    resetDeleteBannerImageSuccess: (state) => {
      state.deleteBannerImageSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Profile
      .addCase(getMyProfile.pending, (state) => {
        state.getProfileLoading = true;
        state.getProfileError = null;
      })
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.getProfileLoading = false;
        state.profile = action.payload;
        state.getProfileError = null;
      })
      .addCase(getMyProfile.rejected, (state, action) => {
        state.getProfileLoading = false;
        state.getProfileError = action.payload;
      })

      // Update Profile
      .addCase(updateMyProfile.pending, (state) => {
        state.updateProfileLoading = true;
        state.updateProfileError = null;
        state.updateProfileSuccess = false;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.updateProfileLoading = false;
        state.profile = action.payload;
        state.updateProfileSuccess = true;
        state.updateProfileError = null;
      })
      .addCase(updateMyProfile.rejected, (state, action) => {
        state.updateProfileLoading = false;
        state.updateProfileError = action.payload;
        state.updateProfileSuccess = false;
      })

      // Update Professional Info
      .addCase(updateProfessionalInfo.pending, (state) => {
        state.updateProfessionalInfoLoading = true;
        state.updateProfessionalInfoError = null;
      })
      .addCase(updateProfessionalInfo.fulfilled, (state, action) => {
        state.updateProfessionalInfoLoading = false;
        state.profile = action.payload;
        state.updateProfessionalInfoError = null;
      })
      .addCase(updateProfessionalInfo.rejected, (state, action) => {
        state.updateProfessionalInfoLoading = false;
        state.updateProfessionalInfoError = action.payload;
      })

      // Add Specialization
      .addCase(addSpecialization.pending, (state) => {
        state.addSpecializationLoading = true;
        state.addSpecializationError = null;
      })
      .addCase(addSpecialization.fulfilled, (state, action) => {
        state.addSpecializationLoading = false;
        state.profile = action.payload;
        state.addSpecializationError = null;
      })
      .addCase(addSpecialization.rejected, (state, action) => {
        state.addSpecializationLoading = false;
        state.addSpecializationError = action.payload;
      })

      // Update Specialization
      .addCase(updateSpecialization.pending, (state) => {
        state.updateSpecializationLoading = true;
        state.updateSpecializationError = null;
      })
      .addCase(updateSpecialization.fulfilled, (state, action) => {
        state.updateSpecializationLoading = false;
        state.profile = action.payload;
        state.updateSpecializationError = null;
      })
      .addCase(updateSpecialization.rejected, (state, action) => {
        state.updateSpecializationLoading = false;
        state.updateSpecializationError = action.payload;
      })

      // Remove Specialization
      .addCase(removeSpecialization.pending, (state) => {
        state.removeSpecializationLoading = true;
        state.removeSpecializationError = null;
      })
      .addCase(removeSpecialization.fulfilled, (state, action) => {
        state.removeSpecializationLoading = false;
        state.profile = action.payload;
        state.removeSpecializationError = null;
      })
      .addCase(removeSpecialization.rejected, (state, action) => {
        state.removeSpecializationLoading = false;
        state.removeSpecializationError = action.payload;
      })

      // Add Skill
      .addCase(addSkill.pending, (state) => {
        state.addSkillLoading = true;
        state.addSkillError = null;
      })
      .addCase(addSkill.fulfilled, (state, action) => {
        state.addSkillLoading = false;
        state.profile = action.payload;
        state.addSkillError = null;
      })
      .addCase(addSkill.rejected, (state, action) => {
        state.addSkillLoading = false;
        state.addSkillError = action.payload;
      })

      // Remove Skill
      .addCase(removeSkill.pending, (state) => {
        state.removeSkillLoading = true;
        state.removeSkillError = null;
      })
      .addCase(removeSkill.fulfilled, (state, action) => {
        state.removeSkillLoading = false;
        state.profile = action.payload;
        state.removeSkillError = null;
      })
      .addCase(removeSkill.rejected, (state, action) => {
        state.removeSkillLoading = false;
        state.removeSkillError = action.payload;
      })

      // Add Work Experience
      .addCase(addWorkExperience.pending, (state) => {
        state.addWorkExperienceLoading = true;
        state.addWorkExperienceError = null;
      })
      .addCase(addWorkExperience.fulfilled, (state, action) => {
        state.addWorkExperienceLoading = false;
        state.profile = action.payload;
        state.addWorkExperienceError = null;
      })
      .addCase(addWorkExperience.rejected, (state, action) => {
        state.addWorkExperienceLoading = false;
        state.addWorkExperienceError = action.payload;
      })

      // Remove Work Experience
      .addCase(removeWorkExperience.pending, (state) => {
        state.removeWorkExperienceLoading = true;
        state.removeWorkExperienceError = null;
      })
      .addCase(removeWorkExperience.fulfilled, (state, action) => {
        state.removeWorkExperienceLoading = false;
        state.profile = action.payload;
        state.removeWorkExperienceError = null;
      })
      .addCase(removeWorkExperience.rejected, (state, action) => {
        state.removeWorkExperienceLoading = false;
        state.removeWorkExperienceError = action.payload;
      })

      // Add Qualification
      .addCase(addQualification.pending, (state) => {
        state.addQualificationLoading = true;
        state.addQualificationError = null;
      })
      .addCase(addQualification.fulfilled, (state, action) => {
        state.addQualificationLoading = false;
        state.profile = action.payload;
        state.addQualificationError = null;
      })
      .addCase(addQualification.rejected, (state, action) => {
        state.addQualificationLoading = false;
        state.addQualificationError = action.payload;
      })

      // Remove Qualification
      .addCase(removeQualification.pending, (state) => {
        state.removeQualificationLoading = true;
        state.removeQualificationError = null;
      })
      .addCase(removeQualification.fulfilled, (state, action) => {
        state.removeQualificationLoading = false;
        state.profile = action.payload;
        state.removeQualificationError = null;
      })
      .addCase(removeQualification.rejected, (state, action) => {
        state.removeQualificationLoading = false;
        state.removeQualificationError = action.payload;
      })

      // Add Achievement
      .addCase(addAchievement.pending, (state) => {
        state.addAchievementLoading = true;
        state.addAchievementError = null;
      })
      .addCase(addAchievement.fulfilled, (state, action) => {
        state.addAchievementLoading = false;
        state.profile = action.payload;
        state.addAchievementError = null;
      })
      .addCase(addAchievement.rejected, (state, action) => {
        state.addAchievementLoading = false;
        state.addAchievementError = action.payload;
      })

      // Remove Achievement
      .addCase(removeAchievement.pending, (state) => {
        state.removeAchievementLoading = true;
        state.removeAchievementError = null;
      })
      .addCase(removeAchievement.fulfilled, (state, action) => {
        state.removeAchievementLoading = false;
        state.profile = action.payload;
        state.removeAchievementError = null;
      })
      .addCase(removeAchievement.rejected, (state, action) => {
        state.removeAchievementLoading = false;
        state.removeAchievementError = action.payload;
      })

      // Update Preferences
      .addCase(updatePreferences.pending, (state) => {
        state.updatePreferencesLoading = true;
        state.updatePreferencesError = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.updatePreferencesLoading = false;
        state.profile = action.payload;
        state.updatePreferencesError = null;
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.updatePreferencesLoading = false;
        state.updatePreferencesError = action.payload;
      })

      // Delete Profile Picture
      .addCase(deleteMyProfilePicture.pending, (state) => {
        state.deleteProfilePictureLoading = true;
        state.deleteProfilePictureError = null;
        state.deleteProfilePictureSuccess = false;
      })
      .addCase(deleteMyProfilePicture.fulfilled, (state, action) => {
        state.deleteProfilePictureLoading = false;
        state.profile = action.payload;
        state.deleteProfilePictureSuccess = true;
        state.deleteProfilePictureError = null;
      })
      .addCase(deleteMyProfilePicture.rejected, (state, action) => {
        state.deleteProfilePictureLoading = false;
        state.deleteProfilePictureError = action.payload;
        state.deleteProfilePictureSuccess = false;
      })

      // Delete Banner Image
      .addCase(deleteMyBannerImage.pending, (state) => {
        state.deleteBannerImageLoading = true;
        state.deleteBannerImageError = null;
        state.deleteBannerImageSuccess = false;
      })
      .addCase(deleteMyBannerImage.fulfilled, (state, action) => {
        state.deleteBannerImageLoading = false;
        state.profile = action.payload;
        state.deleteBannerImageSuccess = true;
        state.deleteBannerImageError = null;
      })
      .addCase(deleteMyBannerImage.rejected, (state, action) => {
        state.deleteBannerImageLoading = false;
        state.deleteBannerImageError = action.payload;
        state.deleteBannerImageSuccess = false;
      });
  }
});

// ===== EXPORTS =====

export const {
  clearGetProfileError,
  clearUpdateProfileError,
  clearUpdateProfessionalInfoError,
  clearAddSpecializationError,
  clearRemoveSpecializationError,
  clearAddSkillError,
  clearRemoveSkillError,
  clearAddWorkExperienceError,
  clearRemoveWorkExperienceError,
  clearAddQualificationError,
  clearRemoveQualificationError,
  clearAddAchievementError,
  clearRemoveAchievementError,
  clearUpdatePreferencesError,
  clearDeleteProfilePictureError,
  clearDeleteBannerImageError,
  resetUpdateProfileSuccess,
  resetDeleteProfilePictureSuccess,
  resetDeleteBannerImageSuccess
} = instructorSlice.actions;

export default instructorSlice.reducer;

// ===== SELECTORS =====

export const selectInstructorProfile = (state) => state.instructor.profile;
export const selectGetProfileLoading = (state) => state.instructor.getProfileLoading;
export const selectGetProfileError = (state) => state.instructor.getProfileError;
export const selectUpdateProfileLoading = (state) => state.instructor.updateProfileLoading;
export const selectUpdateProfileError = (state) => state.instructor.updateProfileError;
export const selectUpdateProfileSuccess = (state) => state.instructor.updateProfileSuccess;
export const selectUpdateProfessionalInfoLoading = (state) => state.instructor.updateProfessionalInfoLoading;
export const selectUpdateProfessionalInfoError = (state) => state.instructor.updateProfessionalInfoError;
export const selectAddSpecializationLoading = (state) => state.instructor.addSpecializationLoading;
export const selectAddSpecializationError = (state) => state.instructor.addSpecializationError;
export const selectRemoveSpecializationLoading = (state) => state.instructor.removeSpecializationLoading;
export const selectRemoveSpecializationError = (state) => state.instructor.removeSpecializationError;
export const selectAddSkillLoading = (state) => state.instructor.addSkillLoading;
export const selectAddSkillError = (state) => state.instructor.addSkillError;
export const selectRemoveSkillLoading = (state) => state.instructor.removeSkillLoading;
export const selectRemoveSkillError = (state) => state.instructor.removeSkillError;
export const selectAddWorkExperienceLoading = (state) => state.instructor.addWorkExperienceLoading;
export const selectAddWorkExperienceError = (state) => state.instructor.addWorkExperienceError;
export const selectRemoveWorkExperienceLoading = (state) => state.instructor.removeWorkExperienceLoading;
export const selectRemoveWorkExperienceError = (state) => state.instructor.removeWorkExperienceError;
export const selectAddQualificationLoading = (state) => state.instructor.addQualificationLoading;
export const selectAddQualificationError = (state) => state.instructor.addQualificationError;
export const selectRemoveQualificationLoading = (state) => state.instructor.removeQualificationLoading;
export const selectRemoveQualificationError = (state) => state.instructor.removeQualificationError;
export const selectAddAchievementLoading = (state) => state.instructor.addAchievementLoading;
export const selectAddAchievementError = (state) => state.instructor.addAchievementError;
export const selectRemoveAchievementLoading = (state) => state.instructor.removeAchievementLoading;
export const selectRemoveAchievementError = (state) => state.instructor.removeAchievementError;
export const selectUpdatePreferencesLoading = (state) => state.instructor.updatePreferencesLoading;
export const selectUpdatePreferencesError = (state) => state.instructor.updatePreferencesError;
export const selectDeleteProfilePictureLoading = (state) => state.instructor.deleteProfilePictureLoading;
export const selectDeleteProfilePictureError = (state) => state.instructor.deleteProfilePictureError;
export const selectDeleteProfilePictureSuccess = (state) => state.instructor.deleteProfilePictureSuccess;
export const selectDeleteBannerImageLoading = (state) => state.instructor.deleteBannerImageLoading;
export const selectDeleteBannerImageError = (state) => state.instructor.deleteBannerImageError;
export const selectDeleteBannerImageSuccess = (state) => state.instructor.deleteBannerImageSuccess;
export const selectProfileSpecializations = (state) => state.instructor.profile?.specializations || [];
export const selectProfileSkills = (state) => state.instructor.profile?.skills || [];
export const selectProfileWorkExperience = (state) => state.instructor.profile?.workExperience || [];
export const selectProfileQualifications = (state) => state.instructor.profile?.qualifications || [];
export const selectProfileAchievements = (state) => state.instructor.profile?.achievements || [];
export const selectProfilePreferences = (state) => state.instructor.profile?.preferences || {};
