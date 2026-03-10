import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

export const getInstructorDiscussions = createAsyncThunk(
  'discussion/getInstructorDiscussions',
  async ({ page = 1, limit = 10, resolved, courseId } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (resolved !== undefined) params.resolved = resolved;
      if (courseId) params.courseId = courseId;
      const response = await apiClient.get('/discussions/instructor/my', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch discussions');
    }
  }
);

export const getDiscussion = createAsyncThunk(
  'discussion/getDiscussion',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/discussions/${id}/instructor`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch discussion');
    }
  }
);

export const addReply = createAsyncThunk(
  'discussion/addReply',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/discussions/instructor/${id}/replies`, { content });
      return { discussionId: id, reply: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reply');
    }
  }
);

export const toggleResolve = createAsyncThunk(
  'discussion/toggleResolve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/discussions/${id}/resolve`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle resolve');
    }
  }
);

export const togglePin = createAsyncThunk(
  'discussion/togglePin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/discussions/${id}/pin`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle pin');
    }
  }
);

const discussionSlice = createSlice({
  name: 'discussion',
  initialState: {
    discussions: [],
    currentDiscussion: null,
    unresolvedCount: 0,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDiscussionError: (state) => { state.error = null; },
    addSocketReply: (state, action) => {
      if (state.currentDiscussion && state.currentDiscussion._id === action.payload.discussionId) {
        state.currentDiscussion.replies.push(action.payload.reply);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getInstructorDiscussions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getInstructorDiscussions.fulfilled, (state, action) => {
        state.loading = false;
        state.discussions = action.payload.data?.discussions || [];
        state.unresolvedCount = action.payload.data?.unresolvedCount || 0;
        state.pagination = action.payload.data?.pagination || null;
      })
      .addCase(getInstructorDiscussions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getDiscussion.pending, (state) => { state.loading = true; })
      .addCase(getDiscussion.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDiscussion = action.payload.data;
      })
      .addCase(getDiscussion.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addReply.fulfilled, (state, action) => {
        if (state.currentDiscussion && state.currentDiscussion._id === action.payload.discussionId) {
          state.currentDiscussion.replies.push(action.payload.reply);
        }
      })
      .addCase(toggleResolve.fulfilled, (state, action) => {
        const d = action.payload.data;
        if (d) {
          const idx = state.discussions.findIndex(disc => disc._id === d._id);
          if (idx !== -1) state.discussions[idx].isResolved = d.isResolved;
          if (state.currentDiscussion?._id === d._id) state.currentDiscussion.isResolved = d.isResolved;
        }
      })
      .addCase(togglePin.fulfilled, (state, action) => {
        const d = action.payload.data;
        if (d) {
          const idx = state.discussions.findIndex(disc => disc._id === d._id);
          if (idx !== -1) state.discussions[idx].isPinned = d.isPinned;
          if (state.currentDiscussion?._id === d._id) state.currentDiscussion.isPinned = d.isPinned;
        }
      });
  },
});

export const { clearDiscussionError, addSocketReply } = discussionSlice.actions;
export default discussionSlice.reducer;
