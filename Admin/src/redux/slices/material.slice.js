import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for material management API calls

// Get all materials with pagination
export const getAllMaterials = createAsyncThunk(
  'material/getAllMaterials',
  async ({ page = 1, limit = 20, courseId, instructorId, type } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;
      if (instructorId) params.instructorId = instructorId;
      if (type) params.type = type;

      const response = await apiClient.get(`/materials`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch materials';
      return rejectWithValue(message);
    }
  }
);

// Get material by ID
export const getMaterialById = createAsyncThunk(
  'material/getMaterialById',
  async (materialId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/materials/${materialId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch material';
      return rejectWithValue(message);
    }
  }
);

// Update material
export const updateMaterial = createAsyncThunk(
  'material/updateMaterial',
  async ({ materialId, materialData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/materials/${materialId}`, materialData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update material';
      return rejectWithValue(message);
    }
  }
);

// Delete material
export const deleteMaterial = createAsyncThunk(
  'material/deleteMaterial',
  async (materialId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/materials/${materialId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete material';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Materials list
  materials: [],
  materialsLoading: false,
  materialsError: null,
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

  // Single material
  currentMaterial: null,
  materialLoading: false,
  materialError: null,

  // Update material
  updateMaterialLoading: false,
  updateMaterialError: null,
  updateMaterialSuccess: false,

  // Delete material
  deleteMaterialLoading: false,
  deleteMaterialError: null,
  deleteMaterialSuccess: false,
};

// Material slice
const materialSlice = createSlice({
  name: 'material',
  initialState,
  reducers: {
    // Clear errors
    clearMaterialsError: (state) => {
      state.materialsError = null;
    },
    clearMaterialError: (state) => {
      state.materialError = null;
    },
    clearUpdateMaterialError: (state) => {
      state.updateMaterialError = null;
      state.updateMaterialSuccess = false;
    },
    clearDeleteMaterialError: (state) => {
      state.deleteMaterialError = null;
      state.deleteMaterialSuccess = false;
    },
    // Reset states
    resetMaterialStates: (state) => {
      state.currentMaterial = null;
      state.materialLoading = false;
      state.materialError = null;
    },
    resetUpdateMaterialState: (state) => {
      state.updateMaterialLoading = false;
      state.updateMaterialError = null;
      state.updateMaterialSuccess = false;
    },
    resetDeleteMaterialState: (state) => {
      state.deleteMaterialLoading = false;
      state.deleteMaterialError = null;
      state.deleteMaterialSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllMaterials.pending, (state) => {
        state.materialsLoading = true;
        state.materialsError = null;
      })
      .addCase(getAllMaterials.fulfilled, (state, action) => {
        state.materialsLoading = false;
        state.materials = action.payload.materials;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllMaterials.rejected, (state, action) => {
        state.materialsLoading = false;
        state.materialsError = action.payload;
      })
      .addCase(getMaterialById.pending, (state) => {
        state.materialLoading = true;
        state.materialError = null;
      })
      .addCase(getMaterialById.fulfilled, (state, action) => {
        state.materialLoading = false;
        state.currentMaterial = action.payload;
      })
      .addCase(getMaterialById.rejected, (state, action) => {
        state.materialLoading = false;
        state.materialError = action.payload;
      })
      .addCase(updateMaterial.pending, (state) => {
        state.updateMaterialLoading = true;
        state.updateMaterialError = null;
        state.updateMaterialSuccess = false;
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        state.updateMaterialLoading = false;
        state.updateMaterialSuccess = true;
        const index = state.materials.findIndex(material => material._id === action.payload._id);
        if (index !== -1) {
          state.materials[index] = action.payload;
        }
        if (state.currentMaterial && state.currentMaterial._id === action.payload._id) {
          state.currentMaterial = action.payload;
        }
      })
      .addCase(updateMaterial.rejected, (state, action) => {
        state.updateMaterialLoading = false;
        state.updateMaterialError = action.payload;
      })
      .addCase(deleteMaterial.pending, (state) => {
        state.deleteMaterialLoading = true;
        state.deleteMaterialError = null;
        state.deleteMaterialSuccess = false;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.deleteMaterialLoading = false;
        state.deleteMaterialSuccess = true;
        state.materials = state.materials.filter(material => material._id !== action.meta.arg);
      })
      .addCase(deleteMaterial.rejected, (state, action) => {
        state.deleteMaterialLoading = false;
        state.deleteMaterialError = action.payload;
      });
  },
});

// Export actions
export const {
  clearMaterialsError,
  clearMaterialError,
  clearUpdateMaterialError,
  clearDeleteMaterialError,
  resetMaterialStates,
  resetUpdateMaterialState,
  resetDeleteMaterialState,
} = materialSlice.actions;

// Export reducer
export default materialSlice.reducer;

// Selectors
export const selectMaterials = (state) => state.material.materials;
export const selectMaterialsLoading = (state) => state.material.materialsLoading;
export const selectMaterialsError = (state) => state.material.materialsError;
export const selectMaterialPagination = (state) => state.material.pagination;
export const selectCurrentMaterial = (state) => state.material.currentMaterial;
export const selectMaterialLoading = (state) => state.material.materialLoading;
export const selectMaterialError = (state) => state.material.materialError;
export const selectUpdateMaterialLoading = (state) => state.material.updateMaterialLoading;
export const selectUpdateMaterialError = (state) => state.material.updateMaterialError;
export const selectUpdateMaterialSuccess = (state) => state.material.updateMaterialSuccess;
export const selectDeleteMaterialLoading = (state) => state.material.deleteMaterialLoading;
export const selectDeleteMaterialError = (state) => state.material.deleteMaterialError;
export const selectDeleteMaterialSuccess = (state) => state.material.deleteMaterialSuccess;