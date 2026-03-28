import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/api.utils";

export const getAssignedDoubtTickets = createAsyncThunk(
  "doubtTicket/getAssignedDoubtTickets",
  async ({ page = 1, limit = 20, status } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const response = await apiClient.get("/doubt-tickets/instructor/assigned", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch doubt tickets");
    }
  }
);

export const getAssignedDoubtTicketById = createAsyncThunk(
  "doubtTicket/getAssignedDoubtTicketById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/doubt-tickets/instructor/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch doubt ticket");
    }
  }
);

export const acceptDoubtTicket = createAsyncThunk(
  "doubtTicket/acceptDoubtTicket",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/doubt-tickets/instructor/${id}/accept`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to accept doubt ticket");
    }
  }
);

export const resolveDoubtTicket = createAsyncThunk(
  "doubtTicket/resolveDoubtTicket",
  async ({ id, resolutionNote }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/doubt-tickets/instructor/${id}/resolve`, { resolutionNote });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to resolve doubt ticket");
    }
  }
);

export const addInstructorDoubtReply = createAsyncThunk(
  "doubtTicket/addInstructorDoubtReply",
  async ({ id, content, images = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (content) formData.append("content", content);
      images.forEach((file) => formData.append("images", file));

      const response = await apiClient.post(`/doubt-tickets/instructor/${id}/replies`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { id, reply: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add reply");
    }
  }
);

const doubtTicketSlice = createSlice({
  name: "doubtTicket",
  initialState: {
    tickets: [],
    currentTicket: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDoubtTicketError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAssignedDoubtTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignedDoubtTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.data?.tickets || [];
        state.pagination = action.payload.data?.pagination || null;
      })
      .addCase(getAssignedDoubtTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAssignedDoubtTicketById.fulfilled, (state, action) => {
        state.currentTicket = action.payload.data;
      })
      .addCase(acceptDoubtTicket.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const idx = state.tickets.findIndex((t) => t._id === updated._id);
        if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], ...updated };
        if (state.currentTicket?._id === updated._id) {
          state.currentTicket = { ...state.currentTicket, ...updated };
        }
      })
      .addCase(resolveDoubtTicket.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const idx = state.tickets.findIndex((t) => t._id === updated._id);
        if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], ...updated };
        if (state.currentTicket?._id === updated._id) {
          state.currentTicket = { ...state.currentTicket, ...updated };
        }
      })
      .addCase(addInstructorDoubtReply.fulfilled, (state, action) => {
        if (state.currentTicket?._id === action.payload.id) {
          state.currentTicket.replies = state.currentTicket.replies || [];
          state.currentTicket.replies.push(action.payload.reply);
        }
      });
  },
});

export const { clearDoubtTicketError } = doubtTicketSlice.actions;
export default doubtTicketSlice.reducer;
