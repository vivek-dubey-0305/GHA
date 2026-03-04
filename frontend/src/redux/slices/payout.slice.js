import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for Payout API calls

// Request a payout
export const requestPayout = createAsyncThunk(
  'payout/requestPayout',
  async ({ amount, method, bankDetails, upiId }, { rejectWithValue }) => {
    try {
      const payload = { amount, method };

      if (method === 'bank_transfer') {
        payload.bankDetails = bankDetails;
      } else if (method === 'upi') {
        payload.upiId = upiId;
      }

      const response = await apiClient.post('/payouts/request', payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to request payout';
      return rejectWithValue(message);
    }
  }
);

// Get my payouts
export const getMyPayouts = createAsyncThunk(
  'payout/getMyPayouts',
  async ({ page = 1, limit = 20, status, method, startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (status) params.append('status', status);
      if (method) params.append('method', method);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/payouts/my?${params}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payouts';
      return rejectWithValue(message);
    }
  }
);

// Get specific payout details
export const getMyPayout = createAsyncThunk(
  'payout/getMyPayout',
  async (payoutId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/payouts/my/${payoutId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payout details';
      return rejectWithValue(message);
    }
  }
);

// Cancel a payout
export const cancelMyPayout = createAsyncThunk(
  'payout/cancelMyPayout',
  async (payoutId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payouts/my/${payoutId}/cancel`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to cancel payout';
      return rejectWithValue(message);
    }
  }
);

// Get payout statistics
export const getMyPayoutStats = createAsyncThunk(
  'payout/getMyPayoutStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/payouts/my/stats');
      return response.data;
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
    error: null,
    requestLoading: false,
    cancelLoading: false,
    statsLoading: false,
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
    // Update payout status in list (for real-time updates)
    updatePayoutStatus: (state, action) => {
      const { payoutId, status, statusHistory } = action.payload;
      const payout = state.payouts.find(p => p._id === payoutId);
      if (payout) {
        payout.status = status;
        if (statusHistory) {
          payout.statusHistory = statusHistory;
        }
      }
      if (state.currentPayout && state.currentPayout._id === payoutId) {
        state.currentPayout.status = status;
        if (statusHistory) {
          state.currentPayout.statusHistory = statusHistory;
        }
      }
    },
    // Add new payout to list
    addNewPayout: (state, action) => {
      state.payouts.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Request Payout
      .addCase(requestPayout.pending, (state) => {
        state.requestLoading = true;
        state.error = null;
      })
      .addCase(requestPayout.fulfilled, (state, action) => {
        state.requestLoading = false;
        // Add to payouts list if we have it
        if (state.payouts.length > 0) {
          state.payouts.unshift(action.payload.data.payout);
        }
        state.error = null;
      })
      .addCase(requestPayout.rejected, (state, action) => {
        state.requestLoading = false;
        state.error = action.payload;
      })

      // Get My Payouts
      .addCase(getMyPayouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.payouts = action.payload.data.payouts;
        state.payoutsPagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(getMyPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get My Payout
      .addCase(getMyPayout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPayout.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayout = action.payload.data.payout;
        state.error = null;
      })
      .addCase(getMyPayout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cancel My Payout
      .addCase(cancelMyPayout.pending, (state) => {
        state.cancelLoading = true;
        state.error = null;
      })
      .addCase(cancelMyPayout.fulfilled, (state, action) => {
        state.cancelLoading = false;
        // Update the payout status in the list
        const payout = state.payouts.find(p => p._id === action.meta.arg);
        if (payout) {
          payout.status = 'cancelled';
        }
        if (state.currentPayout && state.currentPayout._id === action.meta.arg) {
          state.currentPayout.status = 'cancelled';
        }
        state.error = null;
      })
      .addCase(cancelMyPayout.rejected, (state, action) => {
        state.cancelLoading = false;
        state.error = action.payload;
      })

      // Get My Payout Stats
      .addCase(getMyPayoutStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(getMyPayoutStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.data.stats;
        state.error = null;
      })
      .addCase(getMyPayoutStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPayoutError, clearPayoutData, updatePayoutStatus, addNewPayout } = payoutSlice.actions;

export default payoutSlice.reducer;
