import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for module management API calls

// Get all modules with pagination
export const getAllModules = createAsyncThunk(
  'module/getAllModules',
  async ({ page = 1, limit = 20, courseId } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;

      const response = await apiClient.get(`/modules`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch modules';
      return rejectWithValue(message);
    }
  }
);

// Get module by ID
export const getModuleById = createAsyncThunk(
  'module/getModuleById',
  async (moduleId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/modules/${moduleId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch module';
      return rejectWithValue(message);
    }
  }
);

// Create new module
export const createModule = createAsyncThunk(
  'module/createModule',
  async (moduleData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/modules`, moduleData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create module';
      return rejectWithValue(message);
    }
  }
);

// Update module
export const updateModule = createAsyncThunk(
  'module/updateModule',
  async ({ moduleId, moduleData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/modules/${moduleId}`, moduleData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update module';
      return rejectWithValue(message);
    }
  }
);

// Delete module
export const deleteModule = createAsyncThunk(
  'module/deleteModule',
  async (moduleId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/modules/${moduleId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete module';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Modules list
  modules: [],
  modulesLoading: false,
  modulesError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  },

  // Single module
  currentModule: null,
  moduleLoading: false,
  moduleError: null,

  // Create module
  createModuleLoading: false,
  createModuleError: null,
  createModuleSuccess: false,

  // Update module
  updateModuleLoading: false,
  updateModuleError: null,
  updateModuleSuccess: false,

  // Delete module
  deleteModuleLoading: false,
  deleteModuleError: null,
  deleteModuleSuccess: false,
};

// Module slice
const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {
    // Clear errors
    clearModulesError: (state) => {
      state.modulesError = null;
    },
    clearModuleError: (state) => {
      state.moduleError = null;
    },
    clearCreateModuleError: (state) => {
      state.createModuleError = null;
      state.createModuleSuccess = false;
    },
    clearUpdateModuleError: (state) => {
      state.updateModuleError = null;
      state.updateModuleSuccess = false;
    },
    clearDeleteModuleError: (state) => {
      state.deleteModuleError = null;
      state.deleteModuleSuccess = false;
    },
    // Reset states
    resetModuleStates: (state) => {
      state.currentModule = null;
      state.moduleLoading = false;
      state.moduleError = null;
    },
    resetCreateModuleState: (state) => {
      state.createModuleLoading = false;
      state.createModuleError = null;
      state.createModuleSuccess = false;
    },
    resetUpdateModuleState: (state) => {
      state.updateModuleLoading = false;
      state.updateModuleError = null;
      state.updateModuleSuccess = false;
    },
    resetDeleteModuleState: (state) => {
      state.deleteModuleLoading = false;
      state.deleteModuleError = null;
      state.deleteModuleSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllModules.pending, (state) => {
        state.modulesLoading = true;
        state.modulesError = null;
      })
      .addCase(getAllModules.fulfilled, (state, action) => {
        state.modulesLoading = false;
        state.modules = action.payload.modules;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllModules.rejected, (state, action) => {
        state.modulesLoading = false;
        state.modulesError = action.payload;
      })
      .addCase(getModuleById.pending, (state) => {
        state.moduleLoading = true;
        state.moduleError = null;
      })
      .addCase(getModuleById.fulfilled, (state, action) => {
        state.moduleLoading = false;
        state.currentModule = action.payload;
      })
      .addCase(getModuleById.rejected, (state, action) => {
        state.moduleLoading = false;
        state.moduleError = action.payload;
      })
      .addCase(createModule.pending, (state) => {
        state.createModuleLoading = true;
        state.createModuleError = null;
        state.createModuleSuccess = false;
      })
      .addCase(createModule.fulfilled, (state, action) => {
        state.createModuleLoading = false;
        state.createModuleSuccess = true;
        state.modules.push(action.payload);
      })
      .addCase(createModule.rejected, (state, action) => {
        state.createModuleLoading = false;
        state.createModuleError = action.payload;
      })
      .addCase(updateModule.pending, (state) => {
        state.updateModuleLoading = true;
        state.updateModuleError = null;
        state.updateModuleSuccess = false;
      })
      .addCase(updateModule.fulfilled, (state, action) => {
        state.updateModuleLoading = false;
        state.updateModuleSuccess = true;
        const index = state.modules.findIndex(module => module._id === action.payload._id);
        if (index !== -1) {
          state.modules[index] = action.payload;
        }
        if (state.currentModule && state.currentModule._id === action.payload._id) {
          state.currentModule = action.payload;
        }
      })
      .addCase(updateModule.rejected, (state, action) => {
        state.updateModuleLoading = false;
        state.updateModuleError = action.payload;
      })
      .addCase(deleteModule.pending, (state) => {
        state.deleteModuleLoading = true;
        state.deleteModuleError = null;
        state.deleteModuleSuccess = false;
      })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.deleteModuleLoading = false;
        state.deleteModuleSuccess = true;
        state.modules = state.modules.filter(module => module._id !== action.meta.arg);
      })
      .addCase(deleteModule.rejected, (state, action) => {
        state.deleteModuleLoading = false;
        state.deleteModuleError = action.payload;
      });
  },
});

// Export actions
export const {
  clearModulesError,
  clearModuleError,
  clearCreateModuleError,
  clearUpdateModuleError,
  clearDeleteModuleError,
  resetModuleStates,
  resetCreateModuleState,
  resetUpdateModuleState,
  resetDeleteModuleState,
} = moduleSlice.actions;

// Export reducer
export default moduleSlice.reducer;

// Selectors
export const selectModules = (state) => state.module.modules;
export const selectModulesLoading = (state) => state.module.modulesLoading;
export const selectModulesError = (state) => state.module.modulesError;
export const selectModulePagination = (state) => state.module.pagination;
export const selectCurrentModule = (state) => state.module.currentModule;
export const selectModuleLoading = (state) => state.module.moduleLoading;
export const selectModuleError = (state) => state.module.moduleError;
export const selectCreateModuleLoading = (state) => state.module.createModuleLoading;
export const selectCreateModuleError = (state) => state.module.createModuleError;
export const selectCreateModuleSuccess = (state) => state.module.createModuleSuccess;
export const selectUpdateModuleLoading = (state) => state.module.updateModuleLoading;
export const selectUpdateModuleError = (state) => state.module.updateModuleError;
export const selectUpdateModuleSuccess = (state) => state.module.updateModuleSuccess;
export const selectDeleteModuleLoading = (state) => state.module.deleteModuleLoading;
export const selectDeleteModuleError = (state) => state.module.deleteModuleError;
export const selectDeleteModuleSuccess = (state) => state.module.deleteModuleSuccess;