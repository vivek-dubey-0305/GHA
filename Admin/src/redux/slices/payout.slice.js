import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for Admin Payout Management

// Get all payouts with pagination and filters
export const getAllPayouts = createAsyncThunk(
  'payout/getAllPayouts',
  async ({ page = 1, limit = 20, status, method, ownerModel, isFlagged, startDate, endDate, sortBy = "createdAt", sortOrder = "desc" } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (status) params.append('status', status);
      if (method) params.append('method', method);
      if (ownerModel) params.append('ownerModel', ownerModel);
      if (isFlagged !== undefined) params.append('isFlagged', isFlagged);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const response = await apiClient.get(`/payouts/admin/all?${params}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payouts';
      return rejectWithValue(message);
    }
  }
);

// Get payout by ID
export const getPayoutById = createAsyncThunk(
  'payout/getPayoutById',
  async (payoutId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/payouts/admin/${payoutId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payout';
      return rejectWithValue(message);
    }
  }
);

// Process payout (start processing)
export const processPayout = createAsyncThunk(
  'payout/processPayout',
  async (payoutId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payouts/admin/${payoutId}/process`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to process payout';
      return rejectWithValue(message);
    }
  }
);

// Complete payout (mark as transferred)
export const completePayout = createAsyncThunk(
  'payout/completePayout',
  async ({ payoutId, utr, gatewayPayoutId, notes }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payouts/admin/${payoutId}/complete`, {
        utr,
        gatewayPayoutId,
        notes
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to complete payout';
      return rejectWithValue(message);
    }
  }
);

// Fail payout
export const failPayout = createAsyncThunk(
  'payout/failPayout',
  async ({ payoutId, reason, failureCode }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payouts/admin/${payoutId}/fail`, {
        reason,
        failureCode
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fail payout';
      return rejectWithValue(message);
    }
  }
);

// Admin cancel payout
export const adminCancelPayout = createAsyncThunk(
  'payout/adminCancelPayout',
  async ({ payoutId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payouts/admin/${payoutId}/cancel`, { reason });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to cancel payout';
      return rejectWithValue(message);
    }
  }
);

// Flag payout for review
export const flagPayout = createAsyncThunk(
  'payout/flagPayout',
  async ({ payoutId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payouts/admin/${payoutId}/flag`, { reason });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to flag payout';
      return rejectWithValue(message);
    }
  }
);

// Review flagged payout
export const reviewPayout = createAsyncThunk(
  'payout/reviewPayout',
  async ({ payoutId, approve, notes }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payouts/admin/${payoutId}/review`, {
        approve,
        notes
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to review payout';
      return rejectWithValue(message);
    }
  }
);

// Get payout statistics
export const getPayoutStats = createAsyncThunk(
  'payout/getPayoutStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/payouts/admin/stats');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payout statistics';
      return rejectWithValue(message);
    }
  }
);

// Payout slice
const payoutSlice = createSlice({
  name: 'payout',
  initialState: {
    payouts: [],
    payoutsPagination: null,
    currentPayout: null,
    stats: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearPayoutError: (state) => {
      state.error = null;
    },
    clearPayoutData: (state) => {
      state.payouts = [];
      state.payoutsPagination = null;
      state.currentPayout = null;
      state.stats = null;
      state.error = null;
    },
    // Update payout in list after actions
    updatePayoutInList: (state, action) => {
      const updatedPayout = action.payload;
      const index = state.payouts.findIndex(p => p._id === updatedPayout._id);
      if (index !== -1) {
        state.payouts[index] = updatedPayout;
      }
      if (state.currentPayout && state.currentPayout._id === updatedPayout._id) {
        state.currentPayout = updatedPayout;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Payouts
      .addCase(getAllPayouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.payouts = action.payload.payouts;
        state.payoutsPagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getAllPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Payout By ID
      .addCase(getPayoutById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPayoutById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayout = action.payload.payout;
        state.error = null;
      })
      .addCase(getPayoutById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Process Payout
      .addCase(processPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(processPayout.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update payout status in list
        const payoutIndex = state.payouts.findIndex(p => p._id === action.meta.arg);
        if (payoutIndex !== -1) {
          state.payouts[payoutIndex].status = 'processing';
        }
        if (state.currentPayout && state.currentPayout._id === action.meta.arg) {
          state.currentPayout.status = 'processing';
        }
        state.error = null;
      })
      .addCase(processPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Complete Payout
      .addCase(completePayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(completePayout.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update payout status in list
        const payoutIndex = state.payouts.findIndex(p => p._id === action.meta.arg.payoutId);
        if (payoutIndex !== -1) {
          state.payouts[payoutIndex].status = 'completed';
          state.payouts[payoutIndex].utr = action.meta.arg.utr;
        }
        if (state.currentPayout && state.currentPayout._id === action.meta.arg.payoutId) {
          state.currentPayout.status = 'completed';
          state.currentPayout.utr = action.meta.arg.utr;
        }
        state.error = null;
      })
      .addCase(completePayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Fail Payout
      .addCase(failPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(failPayout.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update payout status in list
        const payoutIndex = state.payouts.findIndex(p => p._id === action.meta.arg.payoutId);
        if (payoutIndex !== -1) {
          state.payouts[payoutIndex].status = 'failed';
          state.payouts[payoutIndex].failureReason = action.meta.arg.reason;
        }
        if (state.currentPayout && state.currentPayout._id === action.meta.arg.payoutId) {
          state.currentPayout.status = 'failed';
          state.currentPayout.failureReason = action.meta.arg.reason;
        }
        state.error = null;
      })
      .addCase(failPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Admin Cancel Payout
      .addCase(adminCancelPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(adminCancelPayout.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update payout status in list
        const payoutIndex = state.payouts.findIndex(p => p._id === action.meta.arg.payoutId);
        if (payoutIndex !== -1) {
          state.payouts[payoutIndex].status = 'cancelled';
        }
        if (state.currentPayout && state.currentPayout._id === action.meta.arg.payoutId) {
          state.currentPayout.status = 'cancelled';
        }
        state.error = null;
      })
      .addCase(adminCancelPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Flag Payout
      .addCase(flagPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(flagPayout.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update payout status in list
        const payoutIndex = state.payouts.findIndex(p => p._id === action.meta.arg.payoutId);
        if (payoutIndex !== -1) {
          state.payouts[payoutIndex].risk.isFlagged = true;
          state.payouts[payoutIndex].risk.flagReason = action.meta.arg.reason;
        }
        if (state.currentPayout && state.currentPayout._id === action.meta.arg.payoutId) {
          state.currentPayout.risk.isFlagged = true;
          state.currentPayout.risk.flagReason = action.meta.arg.reason;
        }
        state.error = null;
      })
      .addCase(flagPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Review Payout
      .addCase(reviewPayout.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(reviewPayout.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update payout status in list
        const payoutIndex = state.payouts.findIndex(p => p._id === action.meta.arg.payoutId);
        if (payoutIndex !== -1) {
          state.payouts[payoutIndex].risk.isFlagged = false;
          state.payouts[payoutIndex].risk.reviewedAt = new Date().toISOString();
          if (!action.meta.arg.approve) {
            state.payouts[payoutIndex].status = 'cancelled';
          }
        }
        if (state.currentPayout && state.currentPayout._id === action.meta.arg.payoutId) {
          state.currentPayout.risk.isFlagged = false;
          state.currentPayout.risk.reviewedAt = new Date().toISOString();
          if (!action.meta.arg.approve) {
            state.currentPayout.status = 'cancelled';
          }
        }
        state.error = null;
      })
      .addCase(reviewPayout.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Get Payout Stats
      .addCase(getPayoutStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPayoutStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.error = null;
      })
      .addCase(getPayoutStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPayoutError, clearPayoutData, updatePayoutInList } = payoutSlice.actions;

// Selectors
export const selectPayouts = (state) => state.payout.payouts;
export const selectPayoutsLoading = (state) => state.payout.loading;
export const selectPayoutsError = (state) => state.payout.error;
export const selectPayoutsPagination = (state) => state.payout.payoutsPagination;
export const selectCurrentPayout = (state) => state.payout.currentPayout;
export const selectPayoutStats = (state) => state.payout.stats;
export const selectProcessPayoutLoading = (state) => state.payout.actionLoading;
export const selectCompletePayoutLoading = (state) => state.payout.actionLoading;
export const selectFailPayoutLoading = (state) => state.payout.actionLoading;
export const selectAdminCancelPayoutLoading = (state) => state.payout.actionLoading;
export const selectFlagPayoutLoading = (state) => state.payout.actionLoading;
export const selectReviewPayoutLoading = (state) => state.payout.actionLoading;
export const selectUpdatePayoutSuccess = (state) => !state.payout.error && !state.payout.loading;

export default payoutSlice.reducer;
