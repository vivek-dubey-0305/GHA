import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for payment management API calls

// Get all payments with pagination
export const getAllPayments = createAsyncThunk(
  'payment/getAllPayments',
  async ({ page = 1, limit = 20, status, userId, courseId, paymentMethod } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      if (userId) params.userId = userId;
      if (courseId) params.courseId = courseId;
      if (paymentMethod) params.paymentMethod = paymentMethod;

      const response = await apiClient.get(`/payments`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payments';
      return rejectWithValue(message);
    }
  }
);

// Get payment by ID
export const getPaymentById = createAsyncThunk(
  'payment/getPaymentById',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payment';
      return rejectWithValue(message);
    }
  }
);

// Update payment
export const updatePayment = createAsyncThunk(
  'payment/updatePayment',
  async ({ paymentId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/payments/${paymentId}`, paymentData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update payment';
      return rejectWithValue(message);
    }
  }
);

// Delete payment
export const deletePayment = createAsyncThunk(
  'payment/deletePayment',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete payment';
      return rejectWithValue(message);
    }
  }
);

// Process refund
export const adminProcessRefund = createAsyncThunk(
  'payment/adminProcessRefund',
  async ({ paymentId, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/refund`, { amount, reason });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to process refund';
      return rejectWithValue(message);
    }
  }
);

// Get payment stats
export const getPaymentStats = createAsyncThunk(
  'payment/getPaymentStats',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get(`/payments/stats`, { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payment stats';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Payments list
  payments: [],
  paymentsLoading: false,
  paymentsError: null,
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

  // Single payment
  currentPayment: null,
  paymentLoading: false,
  paymentError: null,

  // Update payment
  updatePaymentLoading: false,
  updatePaymentError: null,
  updatePaymentSuccess: false,

  // Delete payment
  deletePaymentLoading: false,
  deletePaymentError: null,
  deletePaymentSuccess: false,

  // Refund
  refundLoading: false,
  refundError: null,
  refundSuccess: false,

  // Stats
  stats: null,
  statsLoading: false,
  statsError: null,
};

// Payment slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Clear errors
    clearPaymentsError: (state) => {
      state.paymentsError = null;
    },
    clearPaymentError: (state) => {
      state.paymentError = null;
    },
    clearUpdatePaymentError: (state) => {
      state.updatePaymentError = null;
      state.updatePaymentSuccess = false;
    },
    clearDeletePaymentError: (state) => {
      state.deletePaymentError = null;
      state.deletePaymentSuccess = false;
    },
    clearRefundError: (state) => {
      state.refundError = null;
      state.refundSuccess = false;
    },
    clearStatsError: (state) => {
      state.statsError = null;
    },
    // Reset states
    resetPaymentStates: (state) => {
      state.currentPayment = null;
      state.paymentLoading = false;
      state.paymentError = null;
    },
    resetUpdatePaymentState: (state) => {
      state.updatePaymentLoading = false;
      state.updatePaymentError = null;
      state.updatePaymentSuccess = false;
    },
    resetDeletePaymentState: (state) => {
      state.deletePaymentLoading = false;
      state.deletePaymentError = null;
      state.deletePaymentSuccess = false;
    },
    resetRefundState: (state) => {
      state.refundLoading = false;
      state.refundError = null;
      state.refundSuccess = false;
    },
    resetStatsState: (state) => {
      state.stats = null;
      state.statsLoading = false;
      state.statsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPayments.pending, (state) => {
        state.paymentsLoading = true;
        state.paymentsError = null;
      })
      .addCase(getAllPayments.fulfilled, (state, action) => {
        state.paymentsLoading = false;
        state.payments = action.payload.payments;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllPayments.rejected, (state, action) => {
        state.paymentsLoading = false;
        state.paymentsError = action.payload;
      })
      .addCase(getPaymentById.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(getPaymentById.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.currentPayment = action.payload;
      })
      .addCase(getPaymentById.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      .addCase(updatePayment.pending, (state) => {
        state.updatePaymentLoading = true;
        state.updatePaymentError = null;
        state.updatePaymentSuccess = false;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.updatePaymentLoading = false;
        state.updatePaymentSuccess = true;
        const index = state.payments.findIndex(payment => payment._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
        if (state.currentPayment && state.currentPayment._id === action.payload._id) {
          state.currentPayment = action.payload;
        }
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.updatePaymentLoading = false;
        state.updatePaymentError = action.payload;
      })
      .addCase(deletePayment.pending, (state) => {
        state.deletePaymentLoading = true;
        state.deletePaymentError = null;
        state.deletePaymentSuccess = false;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.deletePaymentLoading = false;
        state.deletePaymentSuccess = true;
        state.payments = state.payments.filter(payment => payment._id !== action.meta.arg);
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.deletePaymentLoading = false;
        state.deletePaymentError = action.payload;
      })
      .addCase(adminProcessRefund.pending, (state) => {
        state.refundLoading = true;
        state.refundError = null;
        state.refundSuccess = false;
      })
      .addCase(adminProcessRefund.fulfilled, (state, action) => {
        state.refundLoading = false;
        state.refundSuccess = true;
        const index = state.payments.findIndex(payment => payment._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
        if (state.currentPayment && state.currentPayment._id === action.payload._id) {
          state.currentPayment = action.payload;
        }
      })
      .addCase(adminProcessRefund.rejected, (state, action) => {
        state.refundLoading = false;
        state.refundError = action.payload;
      })
      .addCase(getPaymentStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(getPaymentStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(getPaymentStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      });
  },
});

// Export actions
export const {
  clearPaymentsError,
  clearPaymentError,
  clearUpdatePaymentError,
  clearDeletePaymentError,
  clearRefundError,
  clearStatsError,
  resetPaymentStates,
  resetUpdatePaymentState,
  resetDeletePaymentState,
  resetRefundState,
  resetStatsState,
} = paymentSlice.actions;

// Export reducer
export default paymentSlice.reducer;

// Selectors
export const selectPayments = (state) => state.payment.payments;
export const selectPaymentsLoading = (state) => state.payment.paymentsLoading;
export const selectPaymentsError = (state) => state.payment.paymentsError;
export const selectPaymentPagination = (state) => state.payment.pagination;
export const selectCurrentPayment = (state) => state.payment.currentPayment;
export const selectPaymentLoading = (state) => state.payment.paymentLoading;
export const selectPaymentError = (state) => state.payment.paymentError;
export const selectUpdatePaymentLoading = (state) => state.payment.updatePaymentLoading;
export const selectUpdatePaymentError = (state) => state.payment.updatePaymentError;
export const selectUpdatePaymentSuccess = (state) => state.payment.updatePaymentSuccess;
export const selectDeletePaymentLoading = (state) => state.payment.deletePaymentLoading;
export const selectDeletePaymentError = (state) => state.payment.deletePaymentError;
export const selectDeletePaymentSuccess = (state) => state.payment.deletePaymentSuccess;
export const selectRefundLoading = (state) => state.payment.refundLoading;
export const selectRefundError = (state) => state.payment.refundError;
export const selectRefundSuccess = (state) => state.payment.refundSuccess;
export const selectPaymentStats = (state) => state.payment.stats;
export const selectPaymentStatsLoading = (state) => state.payment.statsLoading;
export const selectPaymentStatsError = (state) => state.payment.statsError;