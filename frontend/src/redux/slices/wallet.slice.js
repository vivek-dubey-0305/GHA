import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for Wallet API calls

// Get my wallet details
export const getMyWallet = createAsyncThunk(
  'wallet/getMyWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/wallet/me');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch wallet';
      return rejectWithValue(message);
    }
  }
);

// Get wallet balance (quick check)
export const getWalletBalance = createAsyncThunk(
  'wallet/getBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/wallet/balance');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch balance';
      return rejectWithValue(message);
    }
  }
);

// Get wallet transaction history
export const getWalletTransactions = createAsyncThunk(
  'wallet/getTransactions',
  async ({ page = 1, limit = 20, type, source, startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (type) params.append('type', type);
      if (source) params.append('source', source);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/wallet/transactions?${params}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch transactions';
      return rejectWithValue(message);
    }
  }
);

// Wallet slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    wallet: null,
    balance: null,
    transactions: [],
    transactionsPagination: null,
    loading: false,
    error: null,
    balanceLoading: false,
    transactionsLoading: false,
  },
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    clearWalletData: (state) => {
      state.wallet = null;
      state.balance = null;
      state.transactions = [];
      state.transactionsPagination = null;
      state.error = null;
    },
    // Update balance optimistically (for real-time updates)
    updateBalance: (state, action) => {
      const { amount, type } = action.payload; // type: 'credit' or 'debit'
      if (state.balance) {
        if (type === 'credit') {
          state.balance.balance += amount;
        } else if (type === 'debit') {
          state.balance.balance -= amount;
        }
        state.balance.availableBalance = Math.max(0, state.balance.balance - (state.balance.holdAmount || 0));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get My Wallet
      .addCase(getMyWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload.data.wallet;
        state.error = null;
      })
      .addCase(getMyWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Balance
      .addCase(getWalletBalance.pending, (state) => {
        state.balanceLoading = true;
        state.error = null;
      })
      .addCase(getWalletBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balance = action.payload.data;
        state.error = null;
      })
      .addCase(getWalletBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.error = action.payload;
      })

      // Get Transactions
      .addCase(getWalletTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.error = null;
      })
      .addCase(getWalletTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.data.transactions;
        state.transactionsPagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(getWalletTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWalletError, clearWalletData, updateBalance } = walletSlice.actions;

export default walletSlice.reducer;
