import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { store } from '../redux/store/store.js';
import { selectIsAuthenticated } from '../redux/slices/auth.slice.js';

// Lazy load auth pages
const Login = lazy(() => import('../pages/AuthPages/Login'));
const Verify = lazy(() => import('../pages/AuthPages/Verify'));
const Forgot = lazy(() => import('../pages/AuthPages/Forgot'));
const Reset = lazy(() => import('../pages/AuthPages/Reset'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

// Protected Route - Only allow if authenticated
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Public Route - Only allow if NOT authenticated
const PublicRoute = ({ children }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

// Protected Auth Route - Only allow if NOT authenticated AND has required state
const ProtectedAuthRoute = ({ children, requiredState }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Check if user has the required state (came from proper flow)
  if (requiredState && typeof window !== 'undefined') {
    // This will be checked in the component using location.state
    return children;
  }
  
  return children;
};

// Auth Layout wrapper
const AuthLayout = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

// Main router configuration
const router = createBrowserRouter([
  {
    path: '/admin',
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />
      },
      {
        path: 'login',
        element: (
          <AuthLayout>
            <PublicRoute>
              <Login />
            </PublicRoute>
          </AuthLayout>
        )
      },
      {
        path: 'verify',
        element: (
          <AuthLayout>
            <ProtectedAuthRoute requiredState>
              <Verify />
            </ProtectedAuthRoute>
          </AuthLayout>
        )
      },
      {
        path: 'forgot',
        element: (
          <AuthLayout>
            <ProtectedAuthRoute requiredState>
              <Forgot />
            </ProtectedAuthRoute>
          </AuthLayout>
        )
      },
      {
        path: 'reset',
        element: (
          <AuthLayout>
            <Reset />
          </AuthLayout>
        )
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '/',
    element: <Navigate to="/admin/dashboard" replace />
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />
  }
]);

export default router;
