import { store } from '../redux/store/store.js';
import { refreshToken, manualLogout } from '../redux/slices/auth.slice.js';

// Token refresh manager
let refreshTokenTimer = null;
let tokenExpiryTime = null;

/**
 * Calculate when to refresh token (1 minute before expiry)
 * Access token expires in 15 minutes, so refresh at 14 minutes
 */
export const scheduleTokenRefresh = (expiresInString = '15m') => {
  // Clear existing timer
  if (refreshTokenTimer) {
    clearTimeout(refreshTokenTimer);
  }

  // Parse expiry string (e.g., "15m" -> milliseconds)
  let expiryMs = 15 * 60 * 1000; // Default 15 minutes

  if (typeof expiresInString === 'string') {
    if (expiresInString.includes('m')) {
      const minutes = parseInt(expiresInString);
      expiryMs = minutes * 60 * 1000;
    } else if (expiresInString.includes('h')) {
      const hours = parseInt(expiresInString);
      expiryMs = hours * 60 * 60 * 1000;
    }
  }

  // Set token expiry time
  tokenExpiryTime = Date.now() + expiryMs;

  // Schedule refresh 1 minute before expiry
  const refreshTime = expiryMs - 60 * 1000; // 1 minute before expiry

  if (refreshTime > 0) {
    refreshTokenTimer = setTimeout(() => {
      handleTokenRefresh();
    }, refreshTime);
  }
};

/**
 * Handle automatic token refresh
 */
const handleTokenRefresh = async () => {
  try {
    const state = store.getState();
    
    // Only refresh if user is authenticated
    if (state.auth.isAuthenticated) {
      await store.dispatch(refreshToken());
      // Schedule next refresh after successful refresh
      scheduleTokenRefresh('15m');
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Force logout on refresh failure
    store.dispatch(manualLogout());
  }
};

/**
 * Clear token refresh timer
 */
export const clearTokenRefresh = () => {
  if (refreshTokenTimer) {
    clearTimeout(refreshTokenTimer);
    refreshTokenTimer = null;
    tokenExpiryTime = null;
  }
};

/**
 * Get time remaining until token expiry
 */
export const getTokenTimeRemaining = () => {
  if (!tokenExpiryTime) return null;
  const remaining = tokenExpiryTime - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Check if token is about to expire (within 2 minutes)
 */
export const isTokenAboutToExpire = () => {
  const remaining = getTokenTimeRemaining();
  return remaining && remaining < 2 * 60 * 1000;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

/**
 * Validate password strength
 * Must include: uppercase, lowercase, number, special character
 */
export const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
  return regex.test(password);
};

/**
 * Get password strength message
 */
export const getPasswordStrengthMessage = (password) => {
  if (!password) return '';

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  const isLongEnough = password.length >= 8;

  const checks = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough];
  const passCount = checks.filter(Boolean).length;

  if (passCount < 3) {
    return 'Weak password';
  } else if (passCount < 5) {
    return 'Moderate password';
  } else {
    return 'Strong password';
  }
};

/**
 * Validate OTP format (6 digits)
 */
export const validateOTP = (otp) => {
  const regex = /^\d{6}$/;
  return regex.test(otp);
};

/**
 * Format error message from API response
 */
export const formatErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
};

/**
 * Handle API errors with specific status codes
 */
export const handleAuthError = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || 'An error occurred';

  switch (status) {
    case 400:
      return { type: 'validation', message };
    case 401:
      return { type: 'unauthorized', message };
    case 403:
      return { type: 'forbidden', message };
    case 429:
      return { type: 'tooManyAttempts', message };
    case 500:
      return { type: 'server', message };
    default:
      return { type: 'unknown', message };
  }
};
