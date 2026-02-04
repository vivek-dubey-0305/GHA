import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { scheduleTokenRefresh, clearTokenRefresh } from '../utils/auth.utils';
import { selectIsAuthenticated } from '../redux/slices/auth.slice';

/**
 * Hook to protect routes and manage token refresh
 */
export const useProtectedRoute = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear any pending token refresh
      clearTokenRefresh();
      // Redirect to login
      navigate('/instructor/login', { replace: true });
    } else {
      // Schedule token refresh when authenticated
      scheduleTokenRefresh('15m');

      // Cleanup on unmount
      return () => {
        clearTokenRefresh();
      };
    }
  }, [isAuthenticated, navigate, dispatch]);

  return isAuthenticated;
};

/**
 * Hook to manage token refresh on page activity
 */
export const useTokenRefreshOnActivity = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      // Re-schedule token refresh on user activity
      // This ensures token is refreshed as long as user is active
      scheduleTokenRefresh('15m');
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated]);
};
