import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for user management API calls

// Get all users with pagination
export const getAllUsers = createAsyncThunk(
  'admin/getAllUsers',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users`, {
        params: { page, limit }
      });
      console.log("REsponmseUsers:/n", response.data)
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch users';
      return rejectWithValue(message);
    }
  }
);

// Get user by ID
export const getUserById = createAsyncThunk(
  'admin/getUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch user';
      return rejectWithValue(message);
    }
  }
);

// Create new user
export const createUser = createAsyncThunk(
  'admin/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/users`, userData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create user';
      return rejectWithValue(message);
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update user';
      return rejectWithValue(message);
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete user';
      return rejectWithValue(message);
    }
  }
);

// Upload user profile picture
export const uploadUserProfilePicture = createAsyncThunk(
  'admin/uploadUserProfilePicture',
  async ({ userId, profilePicture }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      const response = await apiClient.post(`/users/${userId}/upload-profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to upload profile picture';
      return rejectWithValue(message);
    }
  }
);

// Delete user profile picture
export const deleteUserProfilePicture = createAsyncThunk(
  'admin/deleteUserProfilePicture',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/users/${userId}/profile-picture`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete profile picture';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Users list
  users: [],
  usersLoading: false,
  usersError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  },

  // Single user
  currentUser: null,
  userLoading: false,
  userError: null,

  // Create user
  createUserLoading: false,
  createUserError: null,
  createUserSuccess: false,

  // Update user
  updateUserLoading: false,
  updateUserError: null,
  updateUserSuccess: false,

  // Delete user
  deleteUserLoading: false,
  deleteUserError: null,
  deleteUserSuccess: false,

  // Profile picture operations
  uploadProfilePictureLoading: false,
  uploadProfilePictureError: null,
  uploadProfilePictureSuccess: false,

  deleteProfilePictureLoading: false,
  deleteProfilePictureError: null,
  deleteProfilePictureSuccess: false,
};

// Admin slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Clear errors
    clearUsersError: (state) => {
      state.usersError = null;
    },
    clearUserError: (state) => {
      state.userError = null;
    },
    clearCreateUserError: (state) => {
      state.createUserError = null;
      state.createUserSuccess = false;
    },
    clearUpdateUserError: (state) => {
      state.updateUserError = null;
      state.updateUserSuccess = false;
    },
    clearDeleteUserError: (state) => {
      state.deleteUserError = null;
      state.deleteUserSuccess = false;
    },
    clearUploadProfilePictureError: (state) => {
      state.uploadProfilePictureError = null;
      state.uploadProfilePictureSuccess = false;
    },
    clearDeleteProfilePictureError: (state) => {
      state.deleteProfilePictureError = null;
      state.deleteProfilePictureSuccess = false;
    },
    // Reset states
    resetUserStates: (state) => {
      state.currentUser = null;
      state.userLoading = false;
      state.userError = null;
    },
    resetCreateUserState: (state) => {
      state.createUserLoading = false;
      state.createUserError = null;
      state.createUserSuccess = false;
    },
    resetUpdateUserState: (state) => {
      state.updateUserLoading = false;
      state.updateUserError = null;
      state.updateUserSuccess = false;
    },
    resetDeleteUserState: (state) => {
      state.deleteUserLoading = false;
      state.deleteUserError = null;
      state.deleteUserSuccess = false;
    },
    resetProfilePictureStates: (state) => {
      state.uploadProfilePictureLoading = false;
      state.uploadProfilePictureError = null;
      state.uploadProfilePictureSuccess = false;
      state.deleteProfilePictureLoading = false;
      state.deleteProfilePictureError = null;
      state.deleteProfilePictureSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.data.users || [];
        state.pagination = action.payload.data.pagination || state.pagination;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload;
      })

      // Get user by ID
      .addCase(getUserById.pending, (state) => {
        state.userLoading = true;
        state.userError = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.userLoading = false;
        state.currentUser = action.payload.data;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.userLoading = false;
        state.userError = action.payload;
      })

      // Create user
      .addCase(createUser.pending, (state) => {
        state.createUserLoading = true;
        state.createUserError = null;
        state.createUserSuccess = false;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.createUserLoading = false;
        state.createUserSuccess = true;
        // Optionally add to users list
        if (state.users.length > 0) {
          state.users.unshift(action.payload.data);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.createUserLoading = false;
        state.createUserError = action.payload;
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.updateUserLoading = true;
        state.updateUserError = null;
        state.updateUserSuccess = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateUserLoading = false;
        state.updateUserSuccess = true;
        // Update in users list if exists
        const index = state.users.findIndex(user => user._id === action.payload.data._id);
        if (index !== -1) {
          state.users[index] = action.payload.data;
        }
        // Update current user if it's the same
        if (state.currentUser && state.currentUser._id === action.payload.data._id) {
          state.currentUser = action.payload.data;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateUserLoading = false;
        state.updateUserError = action.payload;
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.deleteUserLoading = true;
        state.deleteUserError = null;
        state.deleteUserSuccess = false;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteUserLoading = false;
        state.deleteUserSuccess = true;
        // Remove from users list
        state.users = state.users.filter(user => user._id !== action.meta.arg);
        // Clear current user if deleted
        if (state.currentUser && state.currentUser._id === action.meta.arg) {
          state.currentUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteUserLoading = false;
        state.deleteUserError = action.payload;
      })

      // Upload profile picture
      .addCase(uploadUserProfilePicture.pending, (state) => {
        state.uploadProfilePictureLoading = true;
        state.uploadProfilePictureError = null;
        state.uploadProfilePictureSuccess = false;
      })
      .addCase(uploadUserProfilePicture.fulfilled, (state, action) => {
        state.uploadProfilePictureLoading = false;
        state.uploadProfilePictureSuccess = true;
        // Update profile picture in users list
        const index = state.users.findIndex(user => user._id === action.meta.arg.userId);
        if (index !== -1) {
          state.users[index].profilePicture = action.payload.data.profilePicture;
        }
        // Update current user if it's the same
        if (state.currentUser && state.currentUser._id === action.meta.arg.userId) {
          state.currentUser.profilePicture = action.payload.data.profilePicture;
        }
      })
      .addCase(uploadUserProfilePicture.rejected, (state, action) => {
        state.uploadProfilePictureLoading = false;
        state.uploadProfilePictureError = action.payload;
      })

      // Delete profile picture
      .addCase(deleteUserProfilePicture.pending, (state) => {
        state.deleteProfilePictureLoading = true;
        state.deleteProfilePictureError = null;
        state.deleteProfilePictureSuccess = false;
      })
      .addCase(deleteUserProfilePicture.fulfilled, (state, action) => {
        state.deleteProfilePictureLoading = false;
        state.deleteProfilePictureSuccess = true;
        // Update profile picture in users list
        const index = state.users.findIndex(user => user._id === action.meta.arg);
        if (index !== -1) {
          state.users[index].profilePicture = null;
        }
        // Update current user if it's the same
        if (state.currentUser && state.currentUser._id === action.meta.arg) {
          state.currentUser.profilePicture = null;
        }
      })
      .addCase(deleteUserProfilePicture.rejected, (state, action) => {
        state.deleteProfilePictureLoading = false;
        state.deleteProfilePictureError = action.payload;
      });
  },
});

// Export actions
export const {
  clearUsersError,
  clearUserError,
  clearCreateUserError,
  clearUpdateUserError,
  clearDeleteUserError,
  clearUploadProfilePictureError,
  clearDeleteProfilePictureError,
  resetUserStates,
  resetCreateUserState,
  resetUpdateUserState,
  resetDeleteUserState,
  resetProfilePictureStates,
} = adminSlice.actions;

// Export reducer
export default adminSlice.reducer;

// Selectors
export const selectUsers = (state) => state.admin.users;
export const selectUsersLoading = (state) => state.admin.usersLoading;
export const selectUsersError = (state) => state.admin.usersError;
export const selectPagination = (state) => state.admin.pagination;
export const selectCurrentUser = (state) => state.admin.currentUser;
export const selectUserLoading = (state) => state.admin.userLoading;
export const selectUserError = (state) => state.admin.userError;
export const selectCreateUserLoading = (state) => state.admin.createUserLoading;
export const selectCreateUserError = (state) => state.admin.createUserError;
export const selectCreateUserSuccess = (state) => state.admin.createUserSuccess;
export const selectUpdateUserLoading = (state) => state.admin.updateUserLoading;
export const selectUpdateUserError = (state) => state.admin.updateUserError;
export const selectUpdateUserSuccess = (state) => state.admin.updateUserSuccess;
export const selectDeleteUserLoading = (state) => state.admin.deleteUserLoading;
export const selectDeleteUserError = (state) => state.admin.deleteUserError;
export const selectDeleteUserSuccess = (state) => state.admin.deleteUserSuccess;
export const selectUploadProfilePictureLoading = (state) => state.admin.uploadProfilePictureLoading;
export const selectUploadProfilePictureError = (state) => state.admin.uploadProfilePictureError;
export const selectUploadProfilePictureSuccess = (state) => state.admin.uploadProfilePictureSuccess;
export const selectDeleteProfilePictureLoading = (state) => state.admin.deleteProfilePictureLoading;
export const selectDeleteProfilePictureError = (state) => state.admin.deleteProfilePictureError;
export const selectDeleteProfilePictureSuccess = (state) => state.admin.deleteProfilePictureSuccess;
