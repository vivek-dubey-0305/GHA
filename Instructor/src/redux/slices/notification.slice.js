import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

export const getMyNotifications = createAsyncThunk(
  'notification/getMyNotifications',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/notifications/instructor/my', { params: { page, limit } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  'notification/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/notifications/instructor/unread-count');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/notifications/instructor/${id}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch('/notifications/instructor/read-all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    addNewNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getMyNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data?.notifications || [];
        state.unreadCount = action.payload.data?.unreadCount || 0;
        state.pagination = action.payload.data?.pagination || null;
      })
      .addCase(getMyNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.data?.count || 0;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.notifications.find(n => n._id === action.payload.data?._id);
        if (n) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNewNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
