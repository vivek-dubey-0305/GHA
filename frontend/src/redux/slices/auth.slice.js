import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient, authClient } from '../../utils/api.utils.js';

// Async thunks for API calls

// Register User (Student)
export const register = createAsyncThunk(
  'auth/register',
  async ({ firstName, lastName, email, password, confirmPassword, phone }, { rejectWithValue }) => {
    try {
      const payload = {
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      };
      
      // Add phone only if provided
      if (phone && phone.trim()) {
        payload.phone = phone;
      }
      
      console.log('Registration payload:', payload);
      
      const response = await authClient.post(`/register`, payload);
      console.log("Response:", response);
      return response.data;
    } catch (error) {
      console.log("Error something's missing:", error);
      console.log("Error details:", error.response?.data);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Login - Step 1: Send credentials and get OTP
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authClient.post(`/login`, {
        email,
        password
      });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data);
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
      console.log('Verifying OTP for email:', email);
      const response = await authClient.post(`/verify-otp`, {
        email,
        otp
      });
      console.log('OTP verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error.response?.data);
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
      const response = await authClient.post(`/resend-otp`, {
        email
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to resend OTP';
      return rejectWithValue(message);
    }
  }
);

// Get user profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/user/profile`);

      return response.data.data; // The user data
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get profile';
      return rejectWithValue(message);
    }
  }
);

// Upload profile picture
export const uploadProfilePicture = createAsyncThunk(
  'auth/uploadProfilePicture',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/user/upload-profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.data; // The updated user data
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to upload profile picture';
      return rejectWithValue(message);
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/user/logout`, {});

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
//       const response = await apiClient.post(`/user/refresh-token`, {});

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
      const response = await authClient.post(`/refresh-token`, {});
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
      // Use authClient which is configured for /api/v1/user/auth endpoints
      console.log("====================")
      const response = await authClient.post(`/refresh-token`, {});
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
      const response = await authClient.post(`/forgot-password`, {
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
      const response = await authClient.post(`/reset-password`, {
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
      const response = await authClient.post(`/verify-reset-token`, {
        token
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Invalid or expired token';
      return rejectWithValue(message);
    }
  }
);

// Get User Sessions
export const getUserSessions = createAsyncThunk(
  'auth/getUserSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/user/sessions`);
      return response.data.data; // The sessions data
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get sessions';
      return rejectWithValue(message);
    }
  }
);

// Logout from specific session
export const logoutSession = createAsyncThunk(
  'auth/logoutSession',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/user/logout-session`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to logout session';
      return rejectWithValue(message);
    }
  }
);

// Logout from all sessions except current
export const logoutAllSessions = createAsyncThunk(
  'auth/logoutAllSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/user/logout-all-sessions`, {});
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to logout all sessions';
      return rejectWithValue(message);
    }
  }
);

// Change Password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/user/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to change password';
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  // Authentication state
  isAuthenticated: false,
  user: null,
  initializingAuth: true, // Track if app is initializing auth

  // Register states
  registerLoading: false,
  registerError: null,
  registerSuccess: false,

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

  // Upload profile picture states
  uploadProfilePictureLoading: false,
  uploadProfilePictureError: null,

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
  resetTokenValid: false,

  // Sessions states
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,

  // Logout session states
  logoutSessionLoading: false,
  logoutSessionError: null,

  // Logout all sessions states
  logoutAllSessionsLoading: false,
  logoutAllSessionsError: null,

  // Change password states
  changePasswordLoading: false,
  changePasswordError: null,
  changePasswordSuccess: false
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear errors
    clearRegisterError: (state) => {
      state.registerError = null;
    },
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
    clearUploadProfilePictureError: (state) => {
      state.uploadProfilePictureError = null;
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
    clearSessionsError: (state) => {
      state.sessionsError = null;
    },
    clearLogoutSessionError: (state) => {
      state.logoutSessionError = null;
    },
    clearLogoutAllSessionsError: (state) => {
      state.logoutAllSessionsError = null;
    },
    clearChangePasswordError: (state) => {
      state.changePasswordError = null;
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
      state.user = null;
      state.otpSent = false;
      state.otpVerified = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.registerLoading = true;
        state.registerError = null;
        state.registerSuccess = false;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.registerSuccess = true;
        state.registerError = null;
        // FIXED: Directly set authenticated state since OTP is now skipped
        // Cookies are automatically set by the backend, so just update Redux state
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.otpSent = false; // No longer needed, but keep for compatibility
      })
      .addCase(register.rejected, (state, action) => {
        state.registerLoading = false;
        state.registerError = action.payload;
        state.registerSuccess = false;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
        state.otpSent = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.loginError = null;
        // FIXED: Directly set authenticated state since OTP is now skipped
        // Cookies are automatically set by the backend, so just update Redux state
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.otpSent = false; // No longer needed, but keep for compatibility
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
        state.user = action.payload.data.user;
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
        state.user = action.payload;
        state.profileError = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.profileError = action.payload;
      })

      // Upload Profile Picture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.uploadProfilePictureLoading = true;
        state.uploadProfilePictureError = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.uploadProfilePictureLoading = false;
        state.user = action.payload;
        state.uploadProfilePictureError = null;
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.uploadProfilePictureLoading = false;
        state.uploadProfilePictureError = action.payload;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.logoutLoading = true;
        state.logoutError = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.logoutLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.otpSent = false;
        state.otpVerified = false;
        state.logoutError = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.logoutLoading = false;
        state.logoutError = action.payload;
        // Even if logout fails on server, clear local state
        state.isAuthenticated = false;
        state.user = null;
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
        state.user = null;
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
          state.user = action.payload.data.user;
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
      })

      // Get User Sessions
      .addCase(getUserSessions.pending, (state) => {
        state.sessionsLoading = true;
        state.sessionsError = null;
      })
      .addCase(getUserSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.sessions = action.payload.sessions;
        state.sessionsError = null;
      })
      .addCase(getUserSessions.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.sessionsError = action.payload;
      })

      // Logout Session
      .addCase(logoutSession.pending, (state) => {
        state.logoutSessionLoading = true;
        state.logoutSessionError = null;
      })
      .addCase(logoutSession.fulfilled, (state) => {
        state.logoutSessionLoading = false;
        state.logoutSessionError = null;
        // Optionally refresh sessions after logout
      })
      .addCase(logoutSession.rejected, (state, action) => {
        state.logoutSessionLoading = false;
        state.logoutSessionError = action.payload;
      })

      // Logout All Sessions
      .addCase(logoutAllSessions.pending, (state) => {
        state.logoutAllSessionsLoading = true;
        state.logoutAllSessionsError = null;
      })
      .addCase(logoutAllSessions.fulfilled, (state) => {
        state.logoutAllSessionsLoading = false;
        state.logoutAllSessionsError = null;
        // Sessions are cleared, but current session remains
      })
      .addCase(logoutAllSessions.rejected, (state, action) => {
        state.logoutAllSessionsLoading = false;
        state.logoutAllSessionsError = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.changePasswordLoading = true;
        state.changePasswordError = null;
        state.changePasswordSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = true;
        state.changePasswordError = null;
        // User needs to login again after password change
        state.isAuthenticated = false;
        state.user = null;
        state.otpSent = false;
        state.otpVerified = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.changePasswordError = action.payload;
        state.changePasswordSuccess = false;
      });
  }
});

// Export actions
export const {
  clearRegisterError,
  clearLoginError,
  clearVerifyOtpError,
  clearResendOtpError,
  clearProfileError,
  clearUploadProfilePictureError,
  clearLogoutError,
  clearRefreshTokenError,
  clearForgotPasswordError,
  clearResetPasswordError,
  clearVerifyResetTokenError,
  clearSessionsError,
  clearLogoutSessionError,
  clearLogoutAllSessionsError,
  clearChangePasswordError,
  resetOtpStates,
  manualLogout
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectInitializingAuth = (state) => state.auth.initializingAuth;
export const selectUser = (state) => state.auth.user;
export const selectRegisterLoading = (state) => state.auth.registerLoading;
export const selectRegisterError = (state) => state.auth.registerError;
export const selectRegisterSuccess = (state) => state.auth.registerSuccess;
export const selectLoginLoading = (state) => state.auth.loginLoading;
export const selectLoginError = (state) => state.auth.loginError;
export const selectOtpSent = (state) => state.auth.otpSent;
export const selectVerifyOtpLoading = (state) => state.auth.verifyOtpLoading;
export const selectVerifyOtpError = (state) => state.auth.verifyOtpError;
export const selectResendOtpLoading = (state) => state.auth.resendOtpLoading;
export const selectResendOtpError = (state) => state.auth.resendOtpError;
export const selectOtpVerified = (state) => state.auth.otpVerified;
export const selectUploadProfilePictureLoading = (state) => state.auth.uploadProfilePictureLoading;
export const selectUploadProfilePictureError = (state) => state.auth.uploadProfilePictureError;
export const selectForgotPasswordLoading = (state) => state.auth.forgotPasswordLoading;
export const selectForgotPasswordError = (state) => state.auth.forgotPasswordError;
export const selectForgotPasswordSent = (state) => state.auth.forgotPasswordSent;
export const selectResetPasswordLoading = (state) => state.auth.resetPasswordLoading;
export const selectResetPasswordError = (state) => state.auth.resetPasswordError;
export const selectResetPasswordSuccess = (state) => state.auth.resetPasswordSuccess;
export const selectVerifyResetTokenLoading = (state) => state.auth.verifyResetTokenLoading;
export const selectVerifyResetTokenError = (state) => state.auth.verifyResetTokenError;
export const selectResetTokenValid = (state) => state.auth.resetTokenValid;
export const selectSessions = (state) => state.auth.sessions;
export const selectSessionsLoading = (state) => state.auth.sessionsLoading;
export const selectSessionsError = (state) => state.auth.sessionsError;
export const selectLogoutSessionLoading = (state) => state.auth.logoutSessionLoading;
export const selectLogoutSessionError = (state) => state.auth.logoutSessionError;
export const selectLogoutAllSessionsLoading = (state) => state.auth.logoutAllSessionsLoading;
export const selectLogoutAllSessionsError = (state) => state.auth.logoutAllSessionsError;
export const selectChangePasswordLoading = (state) => state.auth.changePasswordLoading;
export const selectChangePasswordError = (state) => state.auth.changePasswordError;
export const selectChangePasswordSuccess = (state) => state.auth.changePasswordSuccess;
