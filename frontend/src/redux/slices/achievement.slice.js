import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchMyAchievementsApi } from '../../utils/achievement.api.js';

export const fetchMyAchievements = createAsyncThunk(
  'achievement/fetchMyAchievements',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().achievement;
      return await fetchMyAchievementsApi({
        tab: state.activeTab,
        status: state.status,
        page: state.page,
        limit: state.limit,
        courseId: state.courseId,
      });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch achievements');
    }
  }
);

const initialState = {
  activeTab: 'all',
  status: null,
  courseId: null,
  page: 1,
  limit: 20,
  items: [],
  total: 0,
  totalPages: 0,
  summary: {
    totalPoints: 0,
    weekPoints: 0,
    missedPoints: 0,
    achievedCount: 0,
    partialCount: 0,
    missedCount: 0,
  },
  loading: false,
  error: null,
};

const achievementSlice = createSlice({
  name: 'achievement',
  initialState,
  reducers: {
    setAchievementTab: (state, action) => {
      state.activeTab = action.payload;
      state.page = 1;
      state.error = null;
    },
    setAchievementCourseId: (state, action) => {
      state.courseId = action.payload || null;
      state.page = 1;
    },
    clearAchievementError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items || [];
        state.total = action.payload?.total || 0;
        state.totalPages = action.payload?.totalPages || 0;
        state.summary = {
          ...state.summary,
          ...(action.payload?.summary || {}),
        };
      })
      .addCase(fetchMyAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setAchievementTab,
  setAchievementCourseId,
  clearAchievementError,
} = achievementSlice.actions;

export default achievementSlice.reducer;
