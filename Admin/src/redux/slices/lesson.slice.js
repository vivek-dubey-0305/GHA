import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

// Async thunks for lesson management API calls

// Get all lessons with pagination
export const getAllLessons = createAsyncThunk(
  'lesson/getAllLessons',
  async ({ page = 1, limit = 20, courseId, moduleId, type } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;
      if (moduleId) params.moduleId = moduleId;
      if (type) params.type = type;

      const response = await apiClient.get(`/lessons`, { params });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch lessons';
      return rejectWithValue(message);
    }
  }
);

// Get lesson by ID
export const getLessonById = createAsyncThunk(
  'lesson/getLessonById',
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch lesson';
      return rejectWithValue(message);
    }
  }
);

// Create new lesson
export const createLesson = createAsyncThunk(
  'lesson/createLesson',
  async (lessonData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/lessons`, lessonData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create lesson';
      return rejectWithValue(message);
    }
  }
);

// Update lesson
export const updateLesson = createAsyncThunk(
  'lesson/updateLesson',
  async ({ lessonId, lessonData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/lessons/${lessonId}`, lessonData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update lesson';
      return rejectWithValue(message);
    }
  }
);

// Delete lesson
export const deleteLesson = createAsyncThunk(
  'lesson/deleteLesson',
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete lesson';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Lessons list
  lessons: [],
  lessonsLoading: false,
  lessonsError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  },

  // Single lesson
  currentLesson: null,
  lessonLoading: false,
  lessonError: null,

  // Create lesson
  createLessonLoading: false,
  createLessonError: null,
  createLessonSuccess: false,

  // Update lesson
  updateLessonLoading: false,
  updateLessonError: null,
  updateLessonSuccess: false,

  // Delete lesson
  deleteLessonLoading: false,
  deleteLessonError: null,
  deleteLessonSuccess: false,
};

// Lesson slice
const lessonSlice = createSlice({
  name: 'lesson',
  initialState,
  reducers: {
    // Clear errors
    clearLessonsError: (state) => {
      state.lessonsError = null;
    },
    clearLessonError: (state) => {
      state.lessonError = null;
    },
    clearCreateLessonError: (state) => {
      state.createLessonError = null;
      state.createLessonSuccess = false;
    },
    clearUpdateLessonError: (state) => {
      state.updateLessonError = null;
      state.updateLessonSuccess = false;
    },
    clearDeleteLessonError: (state) => {
      state.deleteLessonError = null;
      state.deleteLessonSuccess = false;
    },
    // Reset states
    resetLessonStates: (state) => {
      state.currentLesson = null;
      state.lessonLoading = false;
      state.lessonError = null;
    },
    resetCreateLessonState: (state) => {
      state.createLessonLoading = false;
      state.createLessonError = null;
      state.createLessonSuccess = false;
    },
    resetUpdateLessonState: (state) => {
      state.updateLessonLoading = false;
      state.updateLessonError = null;
      state.updateLessonSuccess = false;
    },
    resetDeleteLessonState: (state) => {
      state.deleteLessonLoading = false;
      state.deleteLessonError = null;
      state.deleteLessonSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllLessons.pending, (state) => {
        state.lessonsLoading = true;
        state.lessonsError = null;
      })
      .addCase(getAllLessons.fulfilled, (state, action) => {
        state.lessonsLoading = false;
        state.lessons = action.payload.lessons;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllLessons.rejected, (state, action) => {
        state.lessonsLoading = false;
        state.lessonsError = action.payload;
      })
      .addCase(getLessonById.pending, (state) => {
        state.lessonLoading = true;
        state.lessonError = null;
      })
      .addCase(getLessonById.fulfilled, (state, action) => {
        state.lessonLoading = false;
        state.currentLesson = action.payload;
      })
      .addCase(getLessonById.rejected, (state, action) => {
        state.lessonLoading = false;
        state.lessonError = action.payload;
      })
      .addCase(createLesson.pending, (state) => {
        state.createLessonLoading = true;
        state.createLessonError = null;
        state.createLessonSuccess = false;
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        state.createLessonLoading = false;
        state.createLessonSuccess = true;
        state.lessons.push(action.payload);
      })
      .addCase(createLesson.rejected, (state, action) => {
        state.createLessonLoading = false;
        state.createLessonError = action.payload;
      })
      .addCase(updateLesson.pending, (state) => {
        state.updateLessonLoading = true;
        state.updateLessonError = null;
        state.updateLessonSuccess = false;
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        state.updateLessonLoading = false;
        state.updateLessonSuccess = true;
        const index = state.lessons.findIndex(lesson => lesson._id === action.payload._id);
        if (index !== -1) {
          state.lessons[index] = action.payload;
        }
        if (state.currentLesson && state.currentLesson._id === action.payload._id) {
          state.currentLesson = action.payload;
        }
      })
      .addCase(updateLesson.rejected, (state, action) => {
        state.updateLessonLoading = false;
        state.updateLessonError = action.payload;
      })
      .addCase(deleteLesson.pending, (state) => {
        state.deleteLessonLoading = true;
        state.deleteLessonError = null;
        state.deleteLessonSuccess = false;
      })
      .addCase(deleteLesson.fulfilled, (state, action) => {
        state.deleteLessonLoading = false;
        state.deleteLessonSuccess = true;
        state.lessons = state.lessons.filter(lesson => lesson._id !== action.meta.arg);
      })
      .addCase(deleteLesson.rejected, (state, action) => {
        state.deleteLessonLoading = false;
        state.deleteLessonError = action.payload;
      });
  },
});

// Export actions
export const {
  clearLessonsError,
  clearLessonError,
  clearCreateLessonError,
  clearUpdateLessonError,
  clearDeleteLessonError,
  resetLessonStates,
  resetCreateLessonState,
  resetUpdateLessonState,
  resetDeleteLessonState,
} = lessonSlice.actions;

// Export reducer
export default lessonSlice.reducer;

// Selectors
export const selectLessons = (state) => state.lesson.lessons;
export const selectLessonsLoading = (state) => state.lesson.lessonsLoading;
export const selectLessonsError = (state) => state.lesson.lessonsError;
export const selectLessonPagination = (state) => state.lesson.pagination;
export const selectCurrentLesson = (state) => state.lesson.currentLesson;
export const selectLessonLoading = (state) => state.lesson.lessonLoading;
export const selectLessonError = (state) => state.lesson.lessonError;
export const selectCreateLessonLoading = (state) => state.lesson.createLessonLoading;
export const selectCreateLessonError = (state) => state.lesson.createLessonError;
export const selectCreateLessonSuccess = (state) => state.lesson.createLessonSuccess;
export const selectUpdateLessonLoading = (state) => state.lesson.updateLessonLoading;
export const selectUpdateLessonError = (state) => state.lesson.updateLessonError;
export const selectUpdateLessonSuccess = (state) => state.lesson.updateLessonSuccess;
export const selectDeleteLessonLoading = (state) => state.lesson.deleteLessonLoading;
export const selectDeleteLessonError = (state) => state.lesson.deleteLessonError;
export const selectDeleteLessonSuccess = (state) => state.lesson.deleteLessonSuccess;