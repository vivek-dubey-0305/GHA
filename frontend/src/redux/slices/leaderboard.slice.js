import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_TYPES,
} from '../../constants/leaderboard.constants.js';
import {
  fetchLeaderboardApi,
  fetchLeaderboardCoursesApi,
  fetchLeaderboardSummaryApi,
} from '../../utils/leaderboard.api.js';

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().leaderboard;
      const effectiveCourseId =
        state.activeType === LEADERBOARD_TYPES.COURSE
          ? state.courseId
          : state.activeType === LEADERBOARD_TYPES.ASSIGNMENT
            ? state.assignmentCourseId
            : null;

      return await fetchLeaderboardApi({
        type: state.activeType,
        period: state.activeType === LEADERBOARD_TYPES.STREAK ? LEADERBOARD_PERIODS.ALL_TIME : state.period,
        courseId: effectiveCourseId,
        page: state.page,
        limit: state.limit,
      });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch leaderboard');
    }
  }
);

export const fetchLeaderboardSummary = createAsyncThunk(
  'leaderboard/fetchLeaderboardSummary',
  async ({ type = LEADERBOARD_TYPES.GLOBAL, period = LEADERBOARD_PERIODS.ALL_TIME, courseId = null } = {}, { rejectWithValue }) => {
    try {
      return await fetchLeaderboardSummaryApi({ type, period, courseId });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch summary');
    }
  }
);

export const fetchLeaderboardCourses = createAsyncThunk(
  'leaderboard/fetchLeaderboardCourses',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchLeaderboardCoursesApi();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch courses');
    }
  }
);

const initialState = {
  activeType: LEADERBOARD_TYPES.GLOBAL,
  period: LEADERBOARD_PERIODS.ALL_TIME,
  page: 1,
  limit: 25,
  courseId: null,
  assignmentCourseId: null,
  entries: [],
  total: 0,
  totalPages: 0,
  loading: false,
  error: null,
  courses: [],
  coursesLoading: false,
  mySummary: {
    rank: null,
    totalPoints: 0,
    tier: 'Beginner',
    level: 1,
    xp: 0,
    xpPercent: 0,
    currentStreak: 0,
    longestStreak: 0,
    rankChange: 0,
    lastWeekRank: null,
  },
  needsRefresh: false,
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setLeaderboardType: (state, action) => {
      state.activeType = action.payload;
      state.page = 1;
      state.error = null;
      if (action.payload === LEADERBOARD_TYPES.STREAK) {
        state.period = LEADERBOARD_PERIODS.ALL_TIME;
      }
    },
    setLeaderboardPeriod: (state, action) => {
      state.period = action.payload;
      state.page = 1;
      state.error = null;
    },
    setLeaderboardCourseId: (state, action) => {
      state.courseId = action.payload || null;
      state.page = 1;
      state.error = null;
    },
    setLeaderboardAssignmentCourseId: (state, action) => {
      state.assignmentCourseId = action.payload || null;
      state.page = 1;
      state.error = null;
    },
    markLeaderboardRefreshRequired: (state) => {
      state.needsRefresh = true;
    },
    clearLeaderboardRefreshRequired: (state) => {
      state.needsRefresh = false;
    },
    clearLeaderboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload?.entries || [];
        state.total = action.payload?.total || 0;
        state.totalPages = action.payload?.totalPages || 0;
        state.mySummary = action.payload?.mySummary || state.mySummary;
        state.needsRefresh = false;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLeaderboardSummary.fulfilled, (state, action) => {
        state.mySummary = {
          ...state.mySummary,
          ...(action.payload || {}),
        };
      })
      .addCase(fetchLeaderboardCourses.pending, (state) => {
        state.coursesLoading = true;
      })
      .addCase(fetchLeaderboardCourses.fulfilled, (state, action) => {
        state.coursesLoading = false;
        state.courses = action.payload || [];
      })
      .addCase(fetchLeaderboardCourses.rejected, (state, action) => {
        state.coursesLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setLeaderboardType,
  setLeaderboardPeriod,
  setLeaderboardCourseId,
  setLeaderboardAssignmentCourseId,
  markLeaderboardRefreshRequired,
  clearLeaderboardRefreshRequired,
  clearLeaderboardError,
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer;
