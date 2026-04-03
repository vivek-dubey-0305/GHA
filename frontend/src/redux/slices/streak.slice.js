import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchMyStreakApi, markStreakActivityApi } from '../../utils/streak.api.js';

export const fetchMyStreak = createAsyncThunk(
  'streak/fetchMyStreak',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchMyStreakApi();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch streak');
    }
  }
);

export const markStreakActivity = createAsyncThunk(
  'streak/markStreakActivity',
  async (_, { rejectWithValue }) => {
    try {
      return await markStreakActivityApi();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark streak activity');
    }
  }
);

const initialState = {
  summary: {
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActivityDateKey: null,
    todayActive: false,
    weeklyActivity: [],
  },
  loading: false,
  marking: false,
  error: null,
};

const streakSlice = createSlice({
  name: 'streak',
  initialState,
  reducers: {
    setStreakSummary: (state, action) => {
      state.summary = {
        ...state.summary,
        ...(action.payload || {}),
      };
    },
    clearStreakError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStreak.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyStreak.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = {
          ...state.summary,
          ...(action.payload || {}),
        };
      })
      .addCase(fetchMyStreak.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markStreakActivity.pending, (state) => {
        state.marking = true;
        state.error = null;
      })
      .addCase(markStreakActivity.fulfilled, (state, action) => {
        state.marking = false;
        state.summary = {
          ...state.summary,
          ...(action.payload || {}),
        };
      })
      .addCase(markStreakActivity.rejected, (state, action) => {
        state.marking = false;
        state.error = action.payload;
      });
  },
});

export const { setStreakSummary, clearStreakError } = streakSlice.actions;

export default streakSlice.reducer;
