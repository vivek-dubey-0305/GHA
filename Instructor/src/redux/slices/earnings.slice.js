import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

export const getMyWallet = createAsyncThunk(
  'earnings/getMyWallet',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/wallet/instructor/me');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch wallet');
    }
  }
);

export const getMyTransactions = createAsyncThunk(
  'earnings/getMyTransactions',
  async ({ page = 1, limit = 15 } = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/wallet/instructor/transactions', { params: { page, limit } });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const getMyBalance = createAsyncThunk(
  'earnings/getMyBalance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/wallet/instructor/balance');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch balance');
    }
  }
);

export const getMyPayouts = createAsyncThunk(
  'earnings/getMyPayouts',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/payouts/instructor/my', { params: { page, limit } });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch payouts');
    }
  }
);

export const getMyPayoutStats = createAsyncThunk(
  'earnings/getMyPayoutStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/payouts/instructor/my/stats');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch payout stats');
    }
  }
);

export const requestPayout = createAsyncThunk(
  'earnings/requestPayout',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/payouts/instructor/request', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to request payout');
    }
  }
);

const earningsSlice = createSlice({
  name: 'earnings',
  initialState: {
    wallet: null,
    walletLoading: false,
    walletError: null,
    balance: null,
    transactions: [],
    transactionsPagination: null,
    transactionsLoading: false,
    transactionsError: null,
    payouts: [],
    payoutsPagination: null,
    payoutsLoading: false,
    payoutsError: null,
    payoutStats: null,
    payoutStatsLoading: false,
    requestPayoutLoading: false,
    requestPayoutError: null,
  },
  reducers: {
    clearRequestPayoutError: (state) => { state.requestPayoutError = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyWallet.pending, (s) => { s.walletLoading = true; s.walletError = null; })
      .addCase(getMyWallet.fulfilled, (s, a) => { s.walletLoading = false; s.wallet = a.payload; })
      .addCase(getMyWallet.rejected, (s, a) => { s.walletLoading = false; s.walletError = a.payload; })
      .addCase(getMyBalance.fulfilled, (s, a) => { s.balance = a.payload; })
      .addCase(getMyTransactions.pending, (s) => { s.transactionsLoading = true; s.transactionsError = null; })
      .addCase(getMyTransactions.fulfilled, (s, a) => {
        s.transactionsLoading = false;
        s.transactions = a.payload.data || [];
        s.transactionsPagination = a.payload.pagination || null;
      })
      .addCase(getMyTransactions.rejected, (s, a) => { s.transactionsLoading = false; s.transactionsError = a.payload; })
      .addCase(getMyPayouts.pending, (s) => { s.payoutsLoading = true; s.payoutsError = null; })
      .addCase(getMyPayouts.fulfilled, (s, a) => {
        s.payoutsLoading = false;
        s.payouts = a.payload.data || [];
        s.payoutsPagination = a.payload.pagination || null;
      })
      .addCase(getMyPayouts.rejected, (s, a) => { s.payoutsLoading = false; s.payoutsError = a.payload; })
      .addCase(getMyPayoutStats.pending, (s) => { s.payoutStatsLoading = true; })
      .addCase(getMyPayoutStats.fulfilled, (s, a) => { s.payoutStatsLoading = false; s.payoutStats = a.payload; })
      .addCase(getMyPayoutStats.rejected, (s) => { s.payoutStatsLoading = false; })
      .addCase(requestPayout.pending, (s) => { s.requestPayoutLoading = true; s.requestPayoutError = null; })
      .addCase(requestPayout.fulfilled, (s) => { s.requestPayoutLoading = false; })
      .addCase(requestPayout.rejected, (s, a) => { s.requestPayoutLoading = false; s.requestPayoutError = a.payload; });
  },
});

export const { clearRequestPayoutError } = earningsSlice.actions;
export default earningsSlice.reducer;

export const selectWallet = (s) => s.earnings.wallet;
export const selectWalletLoading = (s) => s.earnings.walletLoading;
export const selectWalletError = (s) => s.earnings.walletError;
export const selectBalance = (s) => s.earnings.balance;
export const selectTransactions = (s) => s.earnings.transactions;
export const selectTransactionsPagination = (s) => s.earnings.transactionsPagination;
export const selectTransactionsLoading = (s) => s.earnings.transactionsLoading;
export const selectPayouts = (s) => s.earnings.payouts;
export const selectPayoutsPagination = (s) => s.earnings.payoutsPagination;
export const selectPayoutsLoading = (s) => s.earnings.payoutsLoading;
export const selectPayoutStats = (s) => s.earnings.payoutStats;
export const selectRequestPayoutLoading = (s) => s.earnings.requestPayoutLoading;
export const selectRequestPayoutError = (s) => s.earnings.requestPayoutError;
