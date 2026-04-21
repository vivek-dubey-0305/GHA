import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { discussionService } from "../../services/discussion.service.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export const fetchCourseDiscussions = createAsyncThunk(
  "discussion/fetchCourseDiscussions",
  async (params, { rejectWithValue }) => {
    try {
      return await discussionService.getCourseDiscussions(params);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch discussions."));
    }
  }
);

export const fetchDiscussionById = createAsyncThunk(
  "discussion/fetchDiscussionById",
  async (discussionId, { rejectWithValue }) => {
    try {
      return await discussionService.getDiscussionById(discussionId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load discussion."));
    }
  }
);

export const createNewDiscussion = createAsyncThunk(
  "discussion/createNewDiscussion",
  async (payload, { rejectWithValue }) => {
    try {
      return await discussionService.createDiscussion(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create discussion."));
    }
  }
);

export const addDiscussionReply = createAsyncThunk(
  "discussion/addDiscussionReply",
  async ({ discussionId, content }, { rejectWithValue }) => {
    try {
      const reply = await discussionService.addReply({ discussionId, content });
      return { discussionId, reply };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to add reply."));
    }
  }
);

const initialState = {
  discussions: [],
  selectedDiscussion: null,
  pagination: null,

  listLoading: false,
  listError: null,

  detailLoading: false,
  detailError: null,

  createLoading: false,
  createError: null,

  replyLoading: false,
  replyError: null,
};

const discussionSlice = createSlice({
  name: "discussion",
  initialState,
  reducers: {
    clearDiscussionStatus: (state) => {
      state.listError = null;
      state.detailError = null;
      state.createError = null;
      state.replyError = null;
    },
    clearSelectedDiscussion: (state) => {
      state.selectedDiscussion = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseDiscussions.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchCourseDiscussions.fulfilled, (state, action) => {
        state.listLoading = false;
        state.discussions = action.payload?.discussions || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchCourseDiscussions.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      })
      .addCase(fetchDiscussionById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchDiscussionById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedDiscussion = action.payload;
      })
      .addCase(fetchDiscussionById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })
      .addCase(createNewDiscussion.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createNewDiscussion.fulfilled, (state, action) => {
        state.createLoading = false;
        state.discussions = [action.payload, ...state.discussions];
      })
      .addCase(createNewDiscussion.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      .addCase(addDiscussionReply.pending, (state) => {
        state.replyLoading = true;
        state.replyError = null;
      })
      .addCase(addDiscussionReply.fulfilled, (state, action) => {
        state.replyLoading = false;
        if (!state.selectedDiscussion || String(state.selectedDiscussion._id) !== String(action.payload.discussionId)) {
          return;
        }
        state.selectedDiscussion.replies = [
          ...(state.selectedDiscussion.replies || []),
          action.payload.reply,
        ];
      })
      .addCase(addDiscussionReply.rejected, (state, action) => {
        state.replyLoading = false;
        state.replyError = action.payload;
      });
  },
});

export const { clearDiscussionStatus, clearSelectedDiscussion } = discussionSlice.actions;

export const selectDiscussionState = (state) => state.discussion;

export default discussionSlice.reducer;
