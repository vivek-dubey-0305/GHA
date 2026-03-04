import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for certificate management API calls

// Get all certificates with pagination
export const getAllCertificates = createAsyncThunk(
  'certificate/getAllCertificates',
  async ({ page = 1, limit = 20, userId, courseId, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (userId) params.userId = userId;
      if (courseId) params.courseId = courseId;
      if (status) params.status = status;

      const response = await apiClient.get(`/certificates`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch certificates';
      return rejectWithValue(message);
    }
  }
);

// Get certificate by ID
export const getCertificateById = createAsyncThunk(
  'certificate/getCertificateById',
  async (certificateId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/certificates/${certificateId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch certificate';
      return rejectWithValue(message);
    }
  }
);

// Create new certificate
export const createCertificate = createAsyncThunk(
  'certificate/createCertificate',
  async (certificateData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/certificates`, certificateData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create certificate';
      return rejectWithValue(message);
    }
  }
);

// Update certificate
export const updateCertificate = createAsyncThunk(
  'certificate/updateCertificate',
  async ({ certificateId, certificateData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/certificates/${certificateId}`, certificateData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update certificate';
      return rejectWithValue(message);
    }
  }
);

// Delete certificate
export const deleteCertificate = createAsyncThunk(
  'certificate/deleteCertificate',
  async (certificateId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/certificates/${certificateId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete certificate';
      return rejectWithValue(message);
    }
  }
);

// Revoke certificate
export const revokeCertificate = createAsyncThunk(
  'certificate/revokeCertificate',
  async ({ certificateId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/certificates/${certificateId}/revoke`, { reason });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to revoke certificate';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Certificates list
  certificates: [],
  certificatesLoading: false,
  certificatesError: null,
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

  // Single certificate
  currentCertificate: null,
  certificateLoading: false,
  certificateError: null,

  // Create certificate
  createCertificateLoading: false,
  createCertificateError: null,
  createCertificateSuccess: false,

  // Update certificate
  updateCertificateLoading: false,
  updateCertificateError: null,
  updateCertificateSuccess: false,

  // Delete certificate
  deleteCertificateLoading: false,
  deleteCertificateError: null,
  deleteCertificateSuccess: false,

  // Revoke certificate
  revokeCertificateLoading: false,
  revokeCertificateError: null,
  revokeCertificateSuccess: false,
};

// Certificate slice
const certificateSlice = createSlice({
  name: 'certificate',
  initialState,
  reducers: {
    // Clear errors
    clearCertificatesError: (state) => {
      state.certificatesError = null;
    },
    clearCertificateError: (state) => {
      state.certificateError = null;
    },
    clearCreateCertificateError: (state) => {
      state.createCertificateError = null;
      state.createCertificateSuccess = false;
    },
    clearUpdateCertificateError: (state) => {
      state.updateCertificateError = null;
      state.updateCertificateSuccess = false;
    },
    clearDeleteCertificateError: (state) => {
      state.deleteCertificateError = null;
      state.deleteCertificateSuccess = false;
    },
    clearRevokeCertificateError: (state) => {
      state.revokeCertificateError = null;
      state.revokeCertificateSuccess = false;
    },
    // Reset states
    resetCertificateStates: (state) => {
      state.currentCertificate = null;
      state.certificateLoading = false;
      state.certificateError = null;
    },
    resetCreateCertificateState: (state) => {
      state.createCertificateLoading = false;
      state.createCertificateError = null;
      state.createCertificateSuccess = false;
    },
    resetUpdateCertificateState: (state) => {
      state.updateCertificateLoading = false;
      state.updateCertificateError = null;
      state.updateCertificateSuccess = false;
    },
    resetDeleteCertificateState: (state) => {
      state.deleteCertificateLoading = false;
      state.deleteCertificateError = null;
      state.deleteCertificateSuccess = false;
    },
    resetRevokeCertificateState: (state) => {
      state.revokeCertificateLoading = false;
      state.revokeCertificateError = null;
      state.revokeCertificateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCertificates.pending, (state) => {
        state.certificatesLoading = true;
        state.certificatesError = null;
      })
      .addCase(getAllCertificates.fulfilled, (state, action) => {
        state.certificatesLoading = false;
        state.certificates = action.payload.certificates;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllCertificates.rejected, (state, action) => {
        state.certificatesLoading = false;
        state.certificatesError = action.payload;
      })
      .addCase(getCertificateById.pending, (state) => {
        state.certificateLoading = true;
        state.certificateError = null;
      })
      .addCase(getCertificateById.fulfilled, (state, action) => {
        state.certificateLoading = false;
        state.currentCertificate = action.payload;
      })
      .addCase(getCertificateById.rejected, (state, action) => {
        state.certificateLoading = false;
        state.certificateError = action.payload;
      })
      .addCase(createCertificate.pending, (state) => {
        state.createCertificateLoading = true;
        state.createCertificateError = null;
        state.createCertificateSuccess = false;
      })
      .addCase(createCertificate.fulfilled, (state, action) => {
        state.createCertificateLoading = false;
        state.createCertificateSuccess = true;
        state.certificates.push(action.payload);
      })
      .addCase(createCertificate.rejected, (state, action) => {
        state.createCertificateLoading = false;
        state.createCertificateError = action.payload;
      })
      .addCase(updateCertificate.pending, (state) => {
        state.updateCertificateLoading = true;
        state.updateCertificateError = null;
        state.updateCertificateSuccess = false;
      })
      .addCase(updateCertificate.fulfilled, (state, action) => {
        state.updateCertificateLoading = false;
        state.updateCertificateSuccess = true;
        const index = state.certificates.findIndex(certificate => certificate._id === action.payload._id);
        if (index !== -1) {
          state.certificates[index] = action.payload;
        }
        if (state.currentCertificate && state.currentCertificate._id === action.payload._id) {
          state.currentCertificate = action.payload;
        }
      })
      .addCase(updateCertificate.rejected, (state, action) => {
        state.updateCertificateLoading = false;
        state.updateCertificateError = action.payload;
      })
      .addCase(deleteCertificate.pending, (state) => {
        state.deleteCertificateLoading = true;
        state.deleteCertificateError = null;
        state.deleteCertificateSuccess = false;
      })
      .addCase(deleteCertificate.fulfilled, (state, action) => {
        state.deleteCertificateLoading = false;
        state.deleteCertificateSuccess = true;
        state.certificates = state.certificates.filter(certificate => certificate._id !== action.meta.arg);
      })
      .addCase(deleteCertificate.rejected, (state, action) => {
        state.deleteCertificateLoading = false;
        state.deleteCertificateError = action.payload;
      })
      .addCase(revokeCertificate.pending, (state) => {
        state.revokeCertificateLoading = true;
        state.revokeCertificateError = null;
        state.revokeCertificateSuccess = false;
      })
      .addCase(revokeCertificate.fulfilled, (state, action) => {
        state.revokeCertificateLoading = false;
        state.revokeCertificateSuccess = true;
        const index = state.certificates.findIndex(certificate => certificate._id === action.payload._id);
        if (index !== -1) {
          state.certificates[index] = action.payload;
        }
        if (state.currentCertificate && state.currentCertificate._id === action.payload._id) {
          state.currentCertificate = action.payload;
        }
      })
      .addCase(revokeCertificate.rejected, (state, action) => {
        state.revokeCertificateLoading = false;
        state.revokeCertificateError = action.payload;
      });
  },
});

// Export actions
export const {
  clearCertificatesError,
  clearCertificateError,
  clearCreateCertificateError,
  clearUpdateCertificateError,
  clearDeleteCertificateError,
  clearRevokeCertificateError,
  resetCertificateStates,
  resetCreateCertificateState,
  resetUpdateCertificateState,
  resetDeleteCertificateState,
  resetRevokeCertificateState,
} = certificateSlice.actions;

// Export reducer
export default certificateSlice.reducer;

// Selectors
export const selectCertificates = (state) => state.certificate.certificates;
export const selectCertificatesLoading = (state) => state.certificate.certificatesLoading;
export const selectCertificatesError = (state) => state.certificate.certificatesError;
export const selectCertificatePagination = (state) => state.certificate.pagination;
export const selectCurrentCertificate = (state) => state.certificate.currentCertificate;
export const selectCertificateLoading = (state) => state.certificate.certificateLoading;
export const selectCertificateError = (state) => state.certificate.certificateError;
export const selectCreateCertificateLoading = (state) => state.certificate.createCertificateLoading;
export const selectCreateCertificateError = (state) => state.certificate.createCertificateError;
export const selectCreateCertificateSuccess = (state) => state.certificate.createCertificateSuccess;
export const selectUpdateCertificateLoading = (state) => state.certificate.updateCertificateLoading;
export const selectUpdateCertificateError = (state) => state.certificate.updateCertificateError;
export const selectUpdateCertificateSuccess = (state) => state.certificate.updateCertificateSuccess;
export const selectDeleteCertificateLoading = (state) => state.certificate.deleteCertificateLoading;
export const selectDeleteCertificateError = (state) => state.certificate.deleteCertificateError;
export const selectDeleteCertificateSuccess = (state) => state.certificate.deleteCertificateSuccess;
export const selectRevokeCertificateLoading = (state) => state.certificate.revokeCertificateLoading;
export const selectRevokeCertificateError = (state) => state.certificate.revokeCertificateError;
export const selectRevokeCertificateSuccess = (state) => state.certificate.revokeCertificateSuccess;