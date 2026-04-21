import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "../../utils/api.utils";

export const fetchUnreadSummary = createAsyncThunk(
  "communication/fetchUnreadSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/notifications/user/unread-summary");
      const data = response?.data?.data || {};
      return {
        notificationsUnread: Number(data.notificationsUnread || 0),
        announcementsUnread: Number(data.announcementsUnread || 0),
      };
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to fetch unread summary";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  notificationsUnread: 0,
  announcementsUnread: 0,
  loading: false,
  error: "",
};

const communicationSlice = createSlice({
  name: "communication",
  initialState,
  reducers: {
    setUnreadSummary(state, action) {
      const payload = action.payload || {};
      state.notificationsUnread = Math.max(0, Number(payload.notificationsUnread || 0));
      state.announcementsUnread = Math.max(0, Number(payload.announcementsUnread || 0));
    },
    setNotificationsUnread(state, action) {
      state.notificationsUnread = Math.max(0, Number(action.payload || 0));
    },
    setAnnouncementsUnread(state, action) {
      state.announcementsUnread = Math.max(0, Number(action.payload || 0));
    },
    incrementUnreadFromNotification(state, action) {
      const incomingType = action.payload?.type;
      if (incomingType === "announcement") {
        state.announcementsUnread += 1;
      } else {
        state.notificationsUnread += 1;
      }
    },
    decrementUnreadByType(state, action) {
      const incomingType = action.payload;
      if (incomingType === "announcement") {
        state.announcementsUnread = Math.max(0, state.announcementsUnread - 1);
      } else {
        state.notificationsUnread = Math.max(0, state.notificationsUnread - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadSummary.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchUnreadSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.notificationsUnread = action.payload.notificationsUnread;
        state.announcementsUnread = action.payload.announcementsUnread;
      })
      .addCase(fetchUnreadSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch unread summary";
      });
  },
});

export const {
  setUnreadSummary,
  setNotificationsUnread,
  setAnnouncementsUnread,
  incrementUnreadFromNotification,
  decrementUnreadByType,
} = communicationSlice.actions;

export const selectNotificationsUnread = (state) => state.communication.notificationsUnread;
export const selectAnnouncementsUnread = (state) => state.communication.announcementsUnread;

export default communicationSlice.reducer;
