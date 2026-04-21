import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { profileService } from "../../services/profile.service.js";
import { toPreferencesPayload } from "../../utils/accountPayload.utils.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export const fetchProfileDetails = createAsyncThunk(
  "profile/fetchProfileDetails",
  async (_, { rejectWithValue }) => {
    try {
      return await profileService.getProfile();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch profile."));
    }
  }
);

export const updateProfileDetails = createAsyncThunk(
  "profile/updateProfileDetails",
  async (payload, { rejectWithValue }) => {
    try {
      return await profileService.updateProfile(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update profile."));
    }
  }
);

export const updateProfileImage = createAsyncThunk(
  "profile/updateProfileImage",
  async (file, { rejectWithValue }) => {
    try {
      return await profileService.updateProfileImage(file);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update profile image."));
    }
  }
);

export const deleteProfileImage = createAsyncThunk(
  "profile/deleteProfileImage",
  async (_, { rejectWithValue }) => {
    try {
      await profileService.deleteProfileImage();
      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete profile image."));
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  "profile/updateUserPreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      return await profileService.updatePreferences(toPreferencesPayload(preferences));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update preferences."));
    }
  }
);

export const deactivateUserAccount = createAsyncThunk(
  "profile/deactivateUserAccount",
  async (reason, { rejectWithValue }) => {
    try {
      return await profileService.deactivateAccount(reason);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to deactivate account."));
    }
  }
);

const initialState = {
  profile: null,

  profileLoading: false,
  profileError: null,

  updateLoading: false,
  updateError: null,
  updateSuccess: false,

  imageLoading: false,
  imageError: null,

  preferencesLoading: false,
  preferencesError: null,

  deactivateLoading: false,
  deactivateError: null,
  deactivateSuccess: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileStatus: (state) => {
      state.profileError = null;
      state.updateError = null;
      state.imageError = null;
      state.preferencesError = null;
      state.deactivateError = null;
      state.updateSuccess = false;
      state.deactivateSuccess = false;
    },
    hydrateProfileFromAuth: (state, action) => {
      if (action.payload) {
        state.profile = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileDetails.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchProfileDetails.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfileDetails.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      })
      .addCase(updateProfileDetails.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateProfileDetails.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;
        state.profile = action.payload;
      })
      .addCase(updateProfileDetails.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      .addCase(updateProfileImage.pending, (state) => {
        state.imageLoading = true;
        state.imageError = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.imageLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.imageLoading = false;
        state.imageError = action.payload;
      })
      .addCase(deleteProfileImage.pending, (state) => {
        state.imageLoading = true;
        state.imageError = null;
      })
      .addCase(deleteProfileImage.fulfilled, (state) => {
        state.imageLoading = false;
        if (state.profile?.profilePicture) {
          state.profile.profilePicture = null;
        }
      })
      .addCase(deleteProfileImage.rejected, (state, action) => {
        state.imageLoading = false;
        state.imageError = action.payload;
      })
      .addCase(updateUserPreferences.pending, (state) => {
        state.preferencesLoading = true;
        state.preferencesError = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.preferencesLoading = false;
        if (state.profile) {
          state.profile.preferences = action.payload;
        }
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.preferencesLoading = false;
        state.preferencesError = action.payload;
      })
      .addCase(deactivateUserAccount.pending, (state) => {
        state.deactivateLoading = true;
        state.deactivateError = null;
        state.deactivateSuccess = false;
      })
      .addCase(deactivateUserAccount.fulfilled, (state) => {
        state.deactivateLoading = false;
        state.deactivateSuccess = true;
      })
      .addCase(deactivateUserAccount.rejected, (state, action) => {
        state.deactivateLoading = false;
        state.deactivateError = action.payload;
      });
  },
});

export const { clearProfileStatus, hydrateProfileFromAuth } = profileSlice.actions;

export const selectProfileState = (state) => state.profile;
export const selectProfile = (state) => state.profile.profile;
export const selectProfileLoading = (state) => state.profile.profileLoading;
export const selectProfileUpdateLoading = (state) => state.profile.updateLoading;
export const selectProfileUpdateSuccess = (state) => state.profile.updateSuccess;
export const selectProfileImageLoading = (state) => state.profile.imageLoading;
export const selectProfileDeactivateLoading = (state) => state.profile.deactivateLoading;

export default profileSlice.reducer;
