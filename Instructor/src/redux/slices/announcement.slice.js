import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

export const getMyAnnouncements = createAsyncThunk(
  'announcement/getMyAnnouncements',
  async ({ page = 1, limit = 10, courseId } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;
      const response = await apiClient.get('/announcements/instructor/my', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'announcement/createAnnouncement',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/announcements', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create announcement');
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'announcement/updateAnnouncement',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/announcements/instructor/my/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update announcement');
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'announcement/deleteAnnouncement',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/announcements/instructor/my/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete announcement');
    }
  }
);

const announcementSlice = createSlice({
  name: 'announcement',
  initialState: {
    announcements: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAnnouncementError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyAnnouncements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getMyAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = action.payload.data?.announcements || [];
        state.pagination = action.payload.data?.pagination || null;
      })
      .addCase(getMyAnnouncements.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.announcements.unshift(action.payload.data);
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.announcements = state.announcements.filter(a => a._id !== action.payload);
      });
  },
});

export const { clearAnnouncementError } = announcementSlice.actions;
export default announcementSlice.reducer;
