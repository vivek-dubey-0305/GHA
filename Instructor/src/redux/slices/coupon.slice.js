import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api.utils';

export const getMyCoupons = createAsyncThunk(
  'coupon/getMyCoupons',
  async ({ page = 1, limit = 10, isActive, courseId } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (isActive !== undefined) params.isActive = isActive;
      if (courseId) params.courseId = courseId;
      const response = await apiClient.get('/coupons/instructor/my', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
    }
  }
);

export const createCoupon = createAsyncThunk(
  'coupon/createCoupon',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/coupons', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'coupon/updateCoupon',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/coupons/instructor/my/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update coupon');
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  'coupon/deleteCoupon',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/coupons/instructor/my/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
    }
  }
);

const couponSlice = createSlice({
  name: 'coupon',
  initialState: {
    coupons: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCouponError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyCoupons.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getMyCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data?.coupons || [];
        state.pagination = action.payload.data?.pagination || null;
      })
      .addCase(getMyCoupons.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.coupons.unshift(action.payload.data);
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter(c => c._id !== action.payload);
      });
  },
});

export const { clearCouponError } = couponSlice.actions;
export default couponSlice.reducer;
