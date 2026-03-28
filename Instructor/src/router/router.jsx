import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { store } from '../redux/store/store.js';
import { selectIsAuthenticated } from '../redux/slices/auth.slice.js';
import RouteErrorBoundary from '../components/RouteErrorBoundary.jsx';
import RouteErrorPage from '../components/RouteErrorPage.jsx';

// Lazy load auth pages
const Login = lazy(() => import('../pages/AuthPages/Login'));
const Register = lazy(() => import('../pages/AuthPages/Register'));
const Verify = lazy(() => import('../pages/AuthPages/Verify'));
const Forgot = lazy(() => import('../pages/AuthPages/Forgot'));
const Reset = lazy(() => import('../pages/AuthPages/Reset'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Courses = lazy(() => import('../pages/CoursePages/Courses'));
const CreateCourse = lazy(() => import('../pages/CoursePages/CreateCourse'));
const CourseView = lazy(() => import('../pages/CoursePages/CourseView'));
const EditCourse = lazy(() => import('../pages/CoursePages/EditCourse'));
const Students = lazy(() => import('../pages/StudentPages/Students'));
const StudentProgress = lazy(() => import('../pages/StudentPages/StudentProgress'));
const Assignments = lazy(() => import('../pages/AssignmentPages/Assignments'));
const LiveClasses = lazy(() => import('../pages/LiveClassPages/LiveClasses'));
const GoLiveSetup = lazy(() => import('../pages/LiveClassPages/GoLiveSetup'));
const LiveRoom = lazy(() => import('../pages/LiveClassPages/LiveRoom'));
const Certificates = lazy(() => import('../pages/CertificatePages/Certificates'));
const CourseAnalytics = lazy(() => import('../pages/AnalyticsPages/CourseAnalytics'));
const Coupons = lazy(() => import('../pages/CouponPages/Coupons'));
const Earnings = lazy(() => import('../pages/EarningPages/Earnings'));
const Payouts = lazy(() => import('../pages/FinancePages/Payouts'));
const Transactions = lazy(() => import('../pages/FinancePages/Transactions'));
const Announcements = lazy(() => import('../pages/AnnouncementPages/Announcements'));
const Notifications = lazy(() => import('../pages/NotificationPages/Notifications'));
const DiscussionsQA = lazy(() => import('../pages/DiscussionPages/DiscussionsQA'));
const DoubtTickets = lazy(() => import('../pages/DoubtTicketPages/DoubtTickets'));
const Reviews = lazy(() => import('../pages/ReviewPages/Reviews'));
const Profile = lazy(() => import('../pages/UserPages/Profile'));
const PayoutSettings = lazy(() => import('../pages/AccountPages/PayoutSettings'));
const Security = lazy(() => import('../pages/AccountPages/Security'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// Helper function to wrap protected routes with error boundary
const createProtectedRoute = (Comp) => (
  <RouteErrorBoundary>
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <Comp />
      </Suspense>
    </ProtectedRoute>
  </RouteErrorBoundary>
);

// Helper to create route config with error handling
const createRouteConfig = (Component) => ({
  element: createProtectedRoute(Component),
  errorElement: <RouteErrorPage />
});

// Protected Route - Only allow if authenticated
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  if (!isAuthenticated) {
    return <Navigate to="/instructor/login" replace />;
  }
  return children;
};

// Public Route - Only allow if NOT authenticated
const PublicRoute = ({ children }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  if (isAuthenticated) {
    return <Navigate to="/instructor/dashboard" replace />;
  }
  return children;
};

// Protected Auth Route - Only allow if NOT authenticated AND has required state
const ProtectedAuthRoute = ({ children, requiredState }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/instructor/dashboard" replace />;
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
    path: '/instructor',
    children: [
      {
        index: true,
        element: <Navigate to="/instructor/dashboard" replace />
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
        path: 'register',
        element: (
          <AuthLayout>
            <PublicRoute>
              <Register />
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
        ...createRouteConfig(Dashboard)
      },
      {
        path: 'courses',
        ...createRouteConfig(Courses)
      },
      {
        path: 'students',
        ...createRouteConfig(Students)
      },
      {
        path: 'assignments',
        ...createRouteConfig(Assignments)
      },
      {
        path: 'live-classes',
        ...createRouteConfig(LiveClasses)
      },
      {
        path: 'live-classes/:id/setup',
        ...createRouteConfig(GoLiveSetup)
      },
      {
        path: 'live-classes/:id/room',
        ...createRouteConfig(LiveRoom)
      },
      {
        path: 'earnings',
        ...createRouteConfig(Earnings)
      },
      {
        path: 'reviews',
        ...createRouteConfig(Reviews)
      },
      {
        path: 'profile',
        ...createRouteConfig(Profile)
      },
      {
        path: 'courses/create',
        ...createRouteConfig(CreateCourse)
      },
      {
        path: 'courses/:courseId',
        ...createRouteConfig(CourseView)
      },
      {
        path: 'courses/:courseId/edit',
        ...createRouteConfig(EditCourse)
      },
      {
        path: 'student-progress',
        ...createRouteConfig(StudentProgress)
      },
      {
        path: 'discussions',
        ...createRouteConfig(DiscussionsQA)
      },
      {
        path: 'doubt-tickets',
        ...createRouteConfig(DoubtTickets)
      },
      {
        path: 'certificates',
        ...createRouteConfig(Certificates)
      },
      {
        path: 'analytics',
        ...createRouteConfig(CourseAnalytics)
      },
      {
        path: 'coupons',
        ...createRouteConfig(Coupons)
      },
      {
        path: 'payouts',
        ...createRouteConfig(Payouts)
      },
      {
        path: 'transactions',
        ...createRouteConfig(Transactions)
      },
      {
        path: 'announcements',
        ...createRouteConfig(Announcements)
      },
      {
        path: 'notifications',
        ...createRouteConfig(Notifications)
      },
      {
        path: 'payout-settings',
        ...createRouteConfig(PayoutSettings)
      },
      {
        path: 'security',
        ...createRouteConfig(Security)
      }
    ]
  },
  {
    path: '/',
    element: <Navigate to="/instructor/dashboard" replace />
  },
  {
    path: '*',
    element: <Navigate to="/instructor/dashboard" replace />
  }
]);

export default router;
