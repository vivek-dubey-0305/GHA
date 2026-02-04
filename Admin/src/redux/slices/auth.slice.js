import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient, authClient } from '../../utils/api.utils.js';

// Async thunks for API calls

// Login - Step 1: Send credentials and get OTP
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/login`, {
        email,
        password
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Verify OTP - Step 2: Send OTP and get authenticated
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/verify-otp`, {
        email,
        otp
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'OTP verification failed';
      return rejectWithValue(message);
    }
  }
);

// Resend OTP
export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/resend-otp`, {
        email
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to resend OTP';
      return rejectWithValue(message);
    }
  }
);

// Get admin profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/profile`);

      return response.data.data; // The admin data
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get profile';
      return rejectWithValue(message);
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/logout`, {});

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Logout failed';
      return rejectWithValue(message);
    }
  }
);

// Refresh access token
// export const refreshToken = createAsyncThunk(
//   'auth/refreshToken',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await apiClient.post(`/refresh-token`, {});

//       return response.data;
//     } catch (error) {
//       const message = error.response?.data?.message || error.message || 'Token refresh failed';
//       return rejectWithValue(message);
//     }
//   }
// );

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // Use authClient (no interceptor) to avoid recursion
      const response = await authClient.post(`/admin/refresh-token`, {});
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Token refresh failed';
      return rejectWithValue(message);
    }
  }
);

// Initialize auth state on app load
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Try to refresh token silently to check if user is authenticated
      // Use apiClient which has withCredentials: true configured globally
      console.log("====================")
      const response = await apiClient.post(`/refresh-token`, {});
      console.log("response for refresh-api", response)
      return response.data;
    } catch (error) {
      console.log("Error in refresh api", error)
      // If refresh fails, user is not authenticated, but don't treat as error
      // Just return null to indicate no auth
      return null;
    }
  }
);

// Forgot Password - Request reset link
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/forgot-password`, {
        email
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to send reset link';
      return rejectWithValue(message);
    }
  }
);

// Reset Password - Submit new password
export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/reset-password`, {
        token,
        password,
        confirmPassword
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to reset password';
      return rejectWithValue(message);
    }
  }
);

// Verify Reset Token
export const verifyResetToken = createAsyncThunk(
  'auth/verifyResetToken',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/verify-reset-token`, {
        token
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Invalid or expired token';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Authentication state
  isAuthenticated: false,
  admin: null,
  initializingAuth: true, // Track if app is initializing auth

  // Login states
  loginLoading: false,
  loginError: null,
  otpSent: false,

  // OTP verification states
  verifyOtpLoading: false,
  verifyOtpError: null,
  otpVerified: false,

  // Resend OTP states
  resendOtpLoading: false,
  resendOtpError: null,

  // Profile states
  profileLoading: false,
  profileError: null,

  // Logout states
  logoutLoading: false,
  logoutError: null,

  // Refresh token states
  refreshTokenLoading: false,
  refreshTokenError: null,

  // Forgot password states
  forgotPasswordLoading: false,
  forgotPasswordError: null,
  forgotPasswordSent: false,

  // Reset password states
  resetPasswordLoading: false,
  resetPasswordError: null,
  resetPasswordSuccess: false,

  // Verify reset token states
  verifyResetTokenLoading: false,
  verifyResetTokenError: null,
  resetTokenValid: false
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear errors
    clearLoginError: (state) => {
      state.loginError = null;
    },
    clearVerifyOtpError: (state) => {
      state.verifyOtpError = null;
    },
    clearResendOtpError: (state) => {
      state.resendOtpError = null;
    },
    clearProfileError: (state) => {
      state.profileError = null;
    },
    clearLogoutError: (state) => {
      state.logoutError = null;
    },
    clearRefreshTokenError: (state) => {
      state.refreshTokenError = null;
    },
    clearForgotPasswordError: (state) => {
      state.forgotPasswordError = null;
    },
    clearResetPasswordError: (state) => {
      state.resetPasswordError = null;
    },
    clearVerifyResetTokenError: (state) => {
      state.verifyResetTokenError = null;
    },

    // Reset OTP states
    resetOtpStates: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
      state.verifyOtpError = null;
      state.resendOtpError = null;
    },

    // Manual logout (for when tokens expire)
    manualLogout: (state) => {
      state.isAuthenticated = false;
      state.admin = null;
      state.otpSent = false;
      state.otpVerified = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
        state.otpSent = false;
      })
      .addCase(login.fulfilled, (state) => {
        state.loginLoading = false;
        state.otpSent = true;
        state.loginError = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload;
        state.otpSent = false;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.verifyOtpLoading = true;
        state.verifyOtpError = null;
        state.otpVerified = false;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verifyOtpLoading = false;
        state.otpVerified = true;
        state.isAuthenticated = true;
        state.admin = action.payload.data.admin;
        state.verifyOtpError = null;
        // Clear login states after successful verification
        state.loginError = null;
        state.otpSent = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifyOtpLoading = false;
        state.verifyOtpError = action.payload;
        state.otpVerified = false;
      })

      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.resendOtpLoading = true;
        state.resendOtpError = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.resendOtpLoading = false;
        state.otpSent = true;
        state.resendOtpError = null;
        // Clear previous OTP errors
        state.verifyOtpError = null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.resendOtpLoading = false;
        state.resendOtpError = action.payload;
      })

      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.isAuthenticated = true;
        state.admin = action.payload;
        state.profileError = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.isAuthenticated = false;
        state.admin = null;
        state.profileError = action.payload;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.logoutLoading = true;
        state.logoutError = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.logoutLoading = false;
        state.isAuthenticated = false;
        state.admin = null;
        state.otpSent = false;
        state.otpVerified = false;
        state.logoutError = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.logoutLoading = false;
        state.logoutError = action.payload;
        // Even if logout fails on server, clear local state
        state.isAuthenticated = false;
        state.admin = null;
        state.otpSent = false;
        state.otpVerified = false;
      })

      // Refresh Token
      .addCase(refreshToken.pending, (state) => {
        state.refreshTokenLoading = true;
        state.refreshTokenError = null;
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.refreshTokenLoading = false;
        state.refreshTokenError = null;
        // Token refreshed successfully, authentication remains
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.refreshTokenLoading = false;
        state.refreshTokenError = action.payload;
        // If refresh fails, user needs to login again
        state.isAuthenticated = false;
        state.admin = null;
        state.otpSent = false;
        state.otpVerified = false;
      })

      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.initializingAuth = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initializingAuth = false;
        if (action.payload) {
          // Successfully refreshed, set authenticated
          state.isAuthenticated = true;
          state.admin = action.payload.data.admin;
          state.otpVerified = true; // Assume verified since token worked
        }
        // If payload is null, do nothing (not authenticated)
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.initializingAuth = false;
        // Initialization failed, user is not authenticated
        state.isAuthenticated = false;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordError = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSent = true;
        state.forgotPasswordError = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordError = action.payload;
      })

      // Reset Password
      .addCase(resetPasswordThunk.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordError = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = true;
        state.resetPasswordError = null;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordError = action.payload;
        state.resetPasswordSuccess = false;
      })

      // Verify Reset Token
      .addCase(verifyResetToken.pending, (state) => {
        state.verifyResetTokenLoading = true;
        state.verifyResetTokenError = null;
        state.resetTokenValid = false;
      })
      .addCase(verifyResetToken.fulfilled, (state) => {
        state.verifyResetTokenLoading = false;
        state.resetTokenValid = true;
        state.verifyResetTokenError = null;
      })
      .addCase(verifyResetToken.rejected, (state, action) => {
        state.verifyResetTokenLoading = false;
        state.resetTokenValid = false;
        state.verifyResetTokenError = action.payload;
      });
  }
});

// Export actions
export const {
  clearLoginError,
  clearVerifyOtpError,
  clearResendOtpError,
  clearProfileError,
  clearLogoutError,
  clearRefreshTokenError,
  clearForgotPasswordError,
  clearResetPasswordError,
  clearVerifyResetTokenError,
  resetOtpStates,
  manualLogout
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectInitializingAuth = (state) => state.auth.initializingAuth;
export const selectAdmin = (state) => state.auth.admin;
export const selectLoginLoading = (state) => state.auth.loginLoading;
export const selectLoginError = (state) => state.auth.loginError;
export const selectOtpSent = (state) => state.auth.otpSent;
export const selectVerifyOtpLoading = (state) => state.auth.verifyOtpLoading;
export const selectVerifyOtpError = (state) => state.auth.verifyOtpError;
export const selectResendOtpLoading = (state) => state.auth.resendOtpLoading;
export const selectResendOtpError = (state) => state.auth.resendOtpError;
export const selectOtpVerified = (state) => state.auth.otpVerified;
export const selectForgotPasswordLoading = (state) => state.auth.forgotPasswordLoading;
export const selectForgotPasswordError = (state) => state.auth.forgotPasswordError;
export const selectForgotPasswordSent = (state) => state.auth.forgotPasswordSent;
export const selectResetPasswordLoading = (state) => state.auth.resetPasswordLoading;
export const selectResetPasswordError = (state) => state.auth.resetPasswordError;
export const selectResetPasswordSuccess = (state) => state.auth.resetPasswordSuccess;
export const selectVerifyResetTokenLoading = (state) => state.auth.verifyResetTokenLoading;
export const selectVerifyResetTokenError = (state) => state.auth.verifyResetTokenError;
export const selectResetTokenValid = (state) => state.auth.resetTokenValid;
