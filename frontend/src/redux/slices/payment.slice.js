// src/redux/slices/payment.slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api.utils.js';

function ensureRazorpaySdk() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export const initiatePayment = createAsyncThunk(
  'payment/initiatePayment',
  async ({ courseId, couponCode }, { rejectWithValue }) => {
    try {
      console.info('[payment] initiatePayment:start', { courseId });
      const response = await apiClient.post('/payments/initiate', {
        courseId,
        paymentMethod: 'razorpay',
        couponCode,
      });
      console.info('[payment] initiatePayment:success', {
        paymentId: response?.data?.data?.payment?._id,
        hasCheckout: !!response?.data?.data?.checkout,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to initiate payment';
      console.error('[payment] initiatePayment:error', { message, courseId });
      return rejectWithValue(message);
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'payment/verifyPayment',
  async ({ paymentId, gatewayOrderId, gatewayPaymentId, gatewaySignature }, { rejectWithValue }) => {
    try {
      console.info('[payment] verifyPayment:start', { paymentId, gatewayOrderId });
      const response = await apiClient.post('/payments/verify', {
        paymentId,
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature,
      });
      console.info('[payment] verifyPayment:success', {
        paymentId,
        enrollmentId: response?.data?.data?.enrollment?._id,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to verify payment';
      console.error('[payment] verifyPayment:error', { message, paymentId });
      return rejectWithValue(message);
    }
  }
);

export const launchRazorpayCheckout = createAsyncThunk(
  'payment/launchRazorpayCheckout',
  async ({ payment, checkout, prefill = {} }, { dispatch, rejectWithValue }) => {
    try {
      if (!payment?._id || !checkout?.orderId || !checkout?.key) {
        throw new Error('Missing checkout data from backend');
      }

      await ensureRazorpaySdk();

      console.info('[payment] checkout:open', {
        paymentId: payment._id,
        orderId: checkout.orderId,
      });

      const result = await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: checkout.key,
          amount: checkout.amount,
          currency: checkout.currency || 'INR',
          name: checkout.name || 'Greed Hunter Academy',
          description: checkout.description || 'Course enrollment payment',
          order_id: checkout.orderId,
          prefill,
          notes: {
            paymentId: payment._id,
          },
          handler: (response) => {
            resolve(response);
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment popup closed before completion'));
            },
          },
        });

        razorpay.on('payment.failed', (err) => {
          reject(new Error(err?.error?.description || 'Payment failed at gateway'));
        });

        razorpay.open();
      });

      const verifyResult = await dispatch(
        verifyPayment({
          paymentId: payment._id,
          gatewayOrderId: result.razorpay_order_id,
          gatewayPaymentId: result.razorpay_payment_id,
          gatewaySignature: result.razorpay_signature,
        })
      ).unwrap();

      console.info('[payment] checkout:verified', {
        paymentId: payment._id,
      });

      return verifyResult;
    } catch (error) {
      const message = error?.message || 'Razorpay checkout failed';
      console.error('[payment] checkout:error', { message, paymentId: payment?._id });
      return rejectWithValue(message);
    }
  }
);

export const getMyPayments = createAsyncThunk(
  'payment/getMyPayments',
  async ({ page = 1, limit = 10, status } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (status) params.append('status', status);

      const response = await apiClient.get(`/payments/my?${params.toString()}`);
      console.info('[payment] getMyPayments:success', {
        count: response?.data?.data?.payments?.length || 0,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch payments';
      console.error('[payment] getMyPayments:error', { message });
      return rejectWithValue(message);
    }
  }
);

export const requestPaymentRefund = createAsyncThunk(
  'payment/requestPaymentRefund',
  async ({ paymentId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/refund`, { reason });
      console.info('[payment] requestPaymentRefund:success', { paymentId });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to request refund';
      console.error('[payment] requestPaymentRefund:error', { message, paymentId });
      return rejectWithValue(message);
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    currentPayment: null,
    currentCheckout: null,
    payments: [],
    paymentsPagination: null,
    latestEnrollment: null,
    loading: false,
    checkoutLoading: false,
    error: null,
  },
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
    resetPaymentFlow: (state) => {
      state.currentPayment = null;
      state.currentCheckout = null;
      state.latestEnrollment = null;
      state.checkoutLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload?.data?.payment || null;
        state.currentCheckout = action.payload?.data?.checkout || null;
        state.latestEnrollment = action.payload?.data?.enrollment || null;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(launchRazorpayCheckout.pending, (state) => {
        state.checkoutLoading = true;
        state.error = null;
      })
      .addCase(launchRazorpayCheckout.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.currentPayment = action.payload?.data?.payment || state.currentPayment;
        state.latestEnrollment = action.payload?.data?.enrollment || state.latestEnrollment;
      })
      .addCase(launchRazorpayCheckout.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload;
      })

      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload?.data?.payment || state.currentPayment;
        state.latestEnrollment = action.payload?.data?.enrollment || state.latestEnrollment;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getMyPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload?.data?.payments || [];
        state.paymentsPagination = action.payload?.data?.pagination || null;
      })
      .addCase(getMyPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(requestPaymentRefund.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPaymentRefund.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload?.data || state.currentPayment;
      })
      .addCase(requestPaymentRefund.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentError, resetPaymentFlow } = paymentSlice.actions;

export default paymentSlice.reducer;
