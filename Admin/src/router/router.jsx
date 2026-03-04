import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { store } from '../redux/store/store.js';
import { selectIsAuthenticated } from '../redux/slices/auth.slice.js';

// Lazy load auth pages
const Login = lazy(() => import('../pages/AuthPages/Login'));
const Verify = lazy(() => import('../pages/AuthPages/Verify'));
const Forgot = lazy(() => import('../pages/AuthPages/Forgot'));
const Reset = lazy(() => import('../pages/AuthPages/Reset'));

// Lazy load admin pages
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Users = lazy(() => import('../pages/UserPages/Users'));
const Instructors = lazy(() => import('../pages/InstructorPages/Instructors'));
const Courses = lazy(() => import('../pages/CoursePages/Courses'));
const Revenue = lazy(() => import('../pages/RevenuePages/Revenue'));
const Modules = lazy(() => import('../pages/ModulePages/Modules'));
const Lessons = lazy(() => import('../pages/LessonPages/Lessons'));
const Enrollments = lazy(() => import('../pages/EnrollmentPages/Enrollments'));
const Assignments = lazy(() => import('../pages/AssignmentPages/Assignments'));
const Certificates = lazy(() => import('../pages/CertificatePages/Certificates'));
const Payments = lazy(() => import('../pages/PaymentPages/Payments'));
const Wallets = lazy(() => import('../pages/WalletPages/Wallets'));
const Payouts = lazy(() => import('../pages/PayoutPages/Payouts'));
const Reviews = lazy(() => import('../pages/ReviewPages/Reviews'));
const Submissions = lazy(() => import('../pages/SubmissionPages/Submissions'));
const LiveClasses = lazy(() => import('../pages/LiveClassPages/LiveClasses'));
const VideoPackages = lazy(() => import('../pages/VideoPackagePages/VideoPackages'));
const Materials = lazy(() => import('../pages/MaterialPages/Materials'));
const Progress = lazy(() => import('../pages/ProgressPages/Progress'));

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
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Users />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'instructors',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Instructors />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'courses',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Courses />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'revenue',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Revenue />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'modules',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Modules />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'lessons',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Lessons />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'enrollments',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Enrollments />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'assignments',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Assignments />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'certificates',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Certificates />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Payments />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'wallets',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Wallets />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'payouts',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Payouts />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'reviews',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Reviews />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'submissions',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Submissions />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'live-classes',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <LiveClasses />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'video-packages',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <VideoPackages />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'materials',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Materials />
            </Suspense>
          </ProtectedRoute>
        )
      },
      {
        path: 'progress',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Progress />
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
