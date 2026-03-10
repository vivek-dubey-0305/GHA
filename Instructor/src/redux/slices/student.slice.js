import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

// Get students enrolled in instructor's courses
export const getMyStudents = createAsyncThunk(
  'student/getMyStudents',
  async ({ page = 1, limit = 20, courseId } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (courseId) params.courseId = courseId;
      const response = await apiClient.get('/instructor/students', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
    }
  }
);

const initialState = {
  students: [],
  studentPagination: null,
  studentsLoading: false,
  studentsError: null,
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    clearStudentsError: (state) => { state.studentsError = null; },
    resetStudentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyStudents.pending, (state) => {
        state.studentsLoading = true;
        state.studentsError = null;
      })
      .addCase(getMyStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.students = action.payload.data?.students || [];
        state.studentPagination = action.payload.data?.pagination || null;
      })
      .addCase(getMyStudents.rejected, (state, action) => {
        state.studentsLoading = false;
        state.studentsError = action.payload;
      });
  },
});

export const { clearStudentsError, resetStudentState } = studentSlice.actions;
export default studentSlice.reducer;

export const selectStudents = (state) => state.student.students;
export const selectStudentPagination = (state) => state.student.studentPagination;
export const selectStudentsLoading = (state) => state.student.studentsLoading;
export const selectStudentsError = (state) => state.student.studentsError;
