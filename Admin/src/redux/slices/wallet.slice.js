import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for Admin Wallet Management

// Get all wallets with pagination and filters
export const getAllWallets = createAsyncThunk(
  'wallet/getAllWallets',
  async ({ page = 1, limit = 20, ownerModel, isActive, isFrozen, minBalance, maxBalance, sortBy = "createdAt", sortOrder = "desc" } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (ownerModel) params.append('ownerModel', ownerModel);
      if (isActive !== undefined) params.append('isActive', isActive);
      if (isFrozen !== undefined) params.append('isFrozen', isFrozen);
      if (minBalance) params.append('minBalance', minBalance);
      if (maxBalance) params.append('maxBalance', maxBalance);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const response = await apiClient.get(`/wallet/admin/all?${params}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch wallets';
      return rejectWithValue(message);
    }
  }
);

// Get wallet by ID
export const getWalletById = createAsyncThunk(
  'wallet/getWalletById',
  async (walletId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/wallet/admin/${walletId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch wallet';
      return rejectWithValue(message);
    }
  }
);

// Get wallet transactions by wallet ID
export const getWalletTransactions = createAsyncThunk(
  'wallet/getWalletTransactions',
  async ({ walletId, page = 1, limit = 20, type, source, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (type) params.append('type', type);
      if (source) params.append('source', source);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/wallet/admin/${walletId}/transactions?${params}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch wallet transactions';
      return rejectWithValue(message);
    }
  }
);

// Admin credit wallet
export const adminCreditWallet = createAsyncThunk(
  'wallet/adminCreditWallet',
  async ({ walletId, amount, description, metadata }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/wallet/admin/${walletId}/credit`, {
        amount,
        description,
        metadata
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to credit wallet';
      return rejectWithValue(message);
    }
  }
);

// Admin debit wallet
export const adminDebitWallet = createAsyncThunk(
  'wallet/adminDebitWallet',
  async ({ walletId, amount, description, metadata }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/wallet/admin/${walletId}/debit`, {
        amount,
        description,
        metadata
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to debit wallet';
      return rejectWithValue(message);
    }
  }
);

// Freeze wallet
export const freezeWallet = createAsyncThunk(
  'wallet/freezeWallet',
  async ({ walletId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/wallet/admin/${walletId}/freeze`, { reason });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to freeze wallet';
      return rejectWithValue(message);
    }
  }
);

// Unfreeze wallet
export const unfreezeWallet = createAsyncThunk(
  'wallet/unfreezeWallet',
  async (walletId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/wallet/admin/${walletId}/unfreeze`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to unfreeze wallet';
      return rejectWithValue(message);
    }
  }
);

// Get wallet statistics
export const getWalletStats = createAsyncThunk(
  'wallet/getWalletStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/wallet/admin/stats');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch wallet statistics';
      return rejectWithValue(message);
    }
  }
);

// Wallet slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    wallets: [],
    walletsPagination: null,
    currentWallet: null,
    walletTransactions: [],
    walletTransactionsPagination: null,
    stats: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    clearWalletData: (state) => {
      state.wallets = [];
      state.walletsPagination = null;
      state.currentWallet = null;
      state.walletTransactions = [];
      state.walletTransactionsPagination = null;
      state.stats = null;
      state.error = null;
    },
    // Update wallet in list after actions
    updateWalletInList: (state, action) => {
      const updatedWallet = action.payload;
      const index = state.wallets.findIndex(w => w._id === updatedWallet._id);
      if (index !== -1) {
        state.wallets[index] = updatedWallet;
      }
      if (state.currentWallet && state.currentWallet._id === updatedWallet._id) {
        state.currentWallet = updatedWallet;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Wallets
      .addCase(getAllWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWallets.fulfilled, (state, action) => {
        state.loading = false;
        state.wallets = action.payload.wallets;
        state.walletsPagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getAllWallets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Wallet By ID
      .addCase(getWalletById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWalletById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWallet = action.payload.wallet;
        state.error = null;
      })
      .addCase(getWalletById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Wallet Transactions
      .addCase(getWalletTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWalletTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.walletTransactions = action.payload.transactions;
        state.walletTransactionsPagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getWalletTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin Credit Wallet
      .addCase(adminCreditWallet.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(adminCreditWallet.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update the wallet balance in the list
        const walletIndex = state.wallets.findIndex(w => w._id === action.meta.arg.walletId);
        if (walletIndex !== -1) {
          state.wallets[walletIndex].balance += parseFloat(action.meta.arg.amount);
        }
        if (state.currentWallet && state.currentWallet._id === action.meta.arg.walletId) {
          state.currentWallet.balance += parseFloat(action.meta.arg.amount);
        }
        state.error = null;
      })
      .addCase(adminCreditWallet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Admin Debit Wallet
      .addCase(adminDebitWallet.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(adminDebitWallet.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update the wallet balance in the list
        const walletIndex = state.wallets.findIndex(w => w._id === action.meta.arg.walletId);
        if (walletIndex !== -1) {
          state.wallets[walletIndex].balance -= parseFloat(action.meta.arg.amount);
        }
        if (state.currentWallet && state.currentWallet._id === action.meta.arg.walletId) {
          state.currentWallet.balance -= parseFloat(action.meta.arg.amount);
        }
        state.error = null;
      })
      .addCase(adminDebitWallet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Freeze Wallet
      .addCase(freezeWallet.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(freezeWallet.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update wallet status in list
        const walletIndex = state.wallets.findIndex(w => w._id === action.meta.arg.walletId);
        if (walletIndex !== -1) {
          state.wallets[walletIndex].isFrozen = true;
          state.wallets[walletIndex].frozenReason = action.meta.arg.reason;
        }
        if (state.currentWallet && state.currentWallet._id === action.meta.arg.walletId) {
          state.currentWallet.isFrozen = true;
          state.currentWallet.frozenReason = action.meta.arg.reason;
        }
        state.error = null;
      })
      .addCase(freezeWallet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Unfreeze Wallet
      .addCase(unfreezeWallet.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(unfreezeWallet.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update wallet status in list
        const walletIndex = state.wallets.findIndex(w => w._id === action.meta.arg);
        if (walletIndex !== -1) {
          state.wallets[walletIndex].isFrozen = false;
          state.wallets[walletIndex].frozenReason = null;
        }
        if (state.currentWallet && state.currentWallet._id === action.meta.arg) {
          state.currentWallet.isFrozen = false;
          state.currentWallet.frozenReason = null;
        }
        state.error = null;
      })
      .addCase(unfreezeWallet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Get Wallet Stats
      .addCase(getWalletStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWalletStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.error = null;
      })
      .addCase(getWalletStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWalletError, clearWalletData, updateWalletInList } = walletSlice.actions;

// Selectors
export const selectWallets = (state) => state.wallet.wallets;
export const selectWalletsLoading = (state) => state.wallet.loading;
export const selectWalletsError = (state) => state.wallet.error;
export const selectWalletsPagination = (state) => state.wallet.walletsPagination;
export const selectCurrentWallet = (state) => state.wallet.currentWallet;
export const selectWalletTransactions = (state) => state.wallet.walletTransactions;
export const selectWalletTransactionsLoading = (state) => state.wallet.loading;
export const selectWalletStats = (state) => state.wallet.stats;
export const selectAdminCreditWalletLoading = (state) => state.wallet.actionLoading;
export const selectAdminDebitWalletLoading = (state) => state.wallet.actionLoading;
export const selectFreezeWalletLoading = (state) => state.wallet.actionLoading;
export const selectUnfreezeWalletLoading = (state) => state.wallet.actionLoading;
export const selectUpdateWalletSuccess = (state) => !state.wallet.error && !state.wallet.loading;

export default walletSlice.reducer;
