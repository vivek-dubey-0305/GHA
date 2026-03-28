// import { lazy, Suspense } from 'react';
// import { createBrowserRouter, Navigate } from 'react-router-dom';
// import { store } from '../redux/store/store.js';
// import { selectIsAuthenticated } from '../redux/slices/auth.slice.js';
// import RouteErrorBoundary from '../components/RouteErrorBoundary.jsx';
// import RouteErrorPage from '../components/RouteErrorPage.jsx';

// // Lazy load pages
// const Home = lazy(() => import('../pages/PublicPages/Home'));
// const About = lazy(() => import('../pages/PublicPages/About'));
// const Privacy = lazy(() => import('../pages/PublicPages/Privacy'));
// const Terms = lazy(() => import('../pages/PublicPages/Terms'));
// const CookiePolicy = lazy(() => import('../pages/PublicPages/Cookie'));
// const FAQ = lazy(() => import('../pages/PublicPages/Faq'));
// const Refund = lazy(() => import('../pages/PublicPages/Refund'));
// const Contact = lazy(() => import('../pages/PublicPages/Contact'));
// const Careers = lazy(() => import('../pages/PublicPages/Careers'));
// const Login = lazy(() => import('../pages/AuthPages/Login'));
// const Register = lazy(() => import('../pages/AuthPages/Register'));
// const Verify = lazy(() => import('../pages/AuthPages/Verify'));
// const Forgot = lazy(() => import('../pages/AuthPages/Forgot'));
// const Reset = lazy(() => import('../pages/AuthPages/Reset'));
// const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));

// // Loading fallback component
// const LoadingFallback = () => (
//   <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
//     <div className="flex flex-col items-center gap-4">
//       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
//       <p className="text-white text-lg">Loading...</p>
//     </div>
//   </div>
// );  

// // Helper function to wrap protected routes with error boundary
// const createProtectedRoute = (Comp) => (
//   <RouteErrorBoundary>
//     <ProtectedRoute>
//       <Suspense fallback={<LoadingFallback />}>
//         <Comp />
//       </Suspense>
//     </ProtectedRoute>
//   </RouteErrorBoundary>
// );

// // Helper function to wrap public routes with error boundary
// const createPublicRoute = (Comp) => (
//   <RouteErrorBoundary>
//     <Suspense fallback={<LoadingFallback />}>
//       <Comp />
//     </Suspense>
//   </RouteErrorBoundary>
// );

// // Helper to create route config with error handling
// const createRouteConfig = (Component) => ({
//   element: createProtectedRoute(Component),
//   errorElement: <RouteErrorPage />
// });

// // Helper to create public route config with error handling
// const createPublicRouteConfig = (Component) => ({
//   element: createPublicRoute(Component),
//   errorElement: <RouteErrorPage />
// });

// // Protected Route - Only allow if authenticated
// const ProtectedRoute = ({ children }) => {
//   const isAuthenticated = selectIsAuthenticated(store.getState());
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// };

// // Public Route - Only allow if NOT authenticated
// const PublicRoute = ({ children }) => {
//   const isAuthenticated = selectIsAuthenticated(store.getState());
//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }
//   return children;
// };

// // Protected Auth Route - Only allow if NOT authenticated AND has required state
// const ProtectedAuthRoute = ({ children, requiredState }) => {
//   const isAuthenticated = selectIsAuthenticated(store.getState());
  
//   // If authenticated, redirect to dashboard
//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }
  
//   // Check if user has the required state (came from proper flow)
//   if (requiredState && typeof window !== 'undefined') {
//     // This will be checked in the component using location.state
//     return children;
//   }
  
//   return children;
// };

// // Auth Layout wrapper
// const AuthLayout = ({ children }) => (
//   <Suspense fallback={<LoadingFallback />}>
//     {children}
//   </Suspense>
// );

// // Main router configuration
// const router = createBrowserRouter([
//   {
//     path: '/',
//     children: [
//       {
//         index: true,
//         element: (
//           <RouteErrorBoundary>
//             <Suspense fallback={<LoadingFallback />}>
//               <Home />
//             </Suspense>
//           </RouteErrorBoundary>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'about',
//         ...createPublicRouteConfig(About)
//       },
//       {
//         path: 'privacy',
//         ...createPublicRouteConfig(Privacy)
//       },
//       {
//         path: 'terms',
//         ...createPublicRouteConfig(Terms)
//       },
//       {
//         path: 'cookies',
//         ...createPublicRouteConfig(CookiePolicy)
//       },
//       {
//         path: 'faq',
//         ...createPublicRouteConfig(FAQ)
//       },
//       {
//         path: 'refund',
//         ...createPublicRouteConfig(Refund)
//       },
//       {
//         path: 'contact',
//         ...createPublicRouteConfig(Contact)
//       },
//       {
//         path: 'careers',
//         ...createPublicRouteConfig(Careers)
//       },
//       {
//         path: 'login',
//         element: (
//           <AuthLayout>
//             <PublicRoute>
//               <Login />
//             </PublicRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'register',
//         element: (
//           <AuthLayout>
//             <PublicRoute>
//               <Register />
//             </PublicRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'verify',
//         element: (
//           <AuthLayout>
//             <ProtectedAuthRoute requiredState>
//               <Verify />
//             </ProtectedAuthRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'forgot',
//         element: (
//           <AuthLayout>
//             <ProtectedAuthRoute requiredState>
//               <Forgot />
//             </ProtectedAuthRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'reset',
//         element: (
//           <AuthLayout>
//             <Reset />
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'dashboard',
//         ...createRouteConfig(Dashboard)
//       }
//     ]
//   },
//   {
//     path: '*',
//     element: <Navigate to="/" replace />
//   }
// ]);

// export default router;


// import { lazy, Suspense } from 'react';
// import { createBrowserRouter, Navigate } from 'react-router-dom';
// import { store } from '../redux/store/store.js';
// import { selectIsAuthenticated } from '../redux/slices/auth.slice.js';
// import RouteErrorBoundary from '../components/RouteErrorBoundary.jsx';
// import RouteErrorPage from '../components/RouteErrorPage.jsx';


// // Lazy load pages
// // const Home = lazy(() => import('../../../homepagePrevioiscomponents/Home.jsx'));
// const Home = lazy(() => import('../pages/PublicPages/Home'));
// const About = lazy(() => import('../pages/PublicPages/About'));
// const Privacy = lazy(() => import('../pages/PublicPages/Privacy'));
// const Terms = lazy(() => import('../pages/PublicPages/Terms'));
// const CookiePolicy = lazy(() => import('../pages/PublicPages/Cookie'));
// const FAQ = lazy(() => import('../pages/PublicPages/Faq'));
// const Refund = lazy(() => import('../pages/PublicPages/Refund'));
// const Contact = lazy(() => import('../pages/PublicPages/Contact'));
// const Careers = lazy(() => import('../pages/PublicPages/Careers'));
// const Login = lazy(() => import('../pages/AuthPages/Login'));
// const Register = lazy(() => import('../pages/AuthPages/Register'));
// const Verify = lazy(() => import('../pages/AuthPages/Verify'));
// const Forgot = lazy(() => import('../pages/AuthPages/Forgot'));
// const Reset = lazy(() => import('../pages/AuthPages/Reset'));
// const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
// const Course = lazy(() => import('../pages/CoursePages/Course'));
// const CourseDetail = lazy(() => import('../pages/CoursePages/CourseDetail'));
// const Instructors = lazy(() => import('../pages/InstructorPages/Instructors'));
// const InstructorDetail = lazy(() => import('../pages/InstructorPages/InstructorDetail'));
// const Paths = lazy(() => import('../pages/PathsPage/Paths.jsx'));

// // Loading fallback component
// const LoadingFallback = () => (
//   <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
//     <div className="flex flex-col items-center gap-4">
//       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
//       <p className="text-white text-lg">Loading...</p>
//     </div>
//   </div>
// );

// // Helper function to wrap protected routes with error boundary
// const createProtectedRoute = (Comp) => (
//   <RouteErrorBoundary>
//     <ProtectedRoute>
//       <Suspense fallback={<LoadingFallback />}>
//         <Comp />
//       </Suspense>
//     </ProtectedRoute>
//   </RouteErrorBoundary>
// );

// // Helper function to wrap public routes with error boundary
// const createPublicRoute = (Comp) => (
//   <RouteErrorBoundary>
//     <Suspense fallback={<LoadingFallback />}>
//       <Comp />
//     </Suspense>
//   </RouteErrorBoundary>
// );

// // Helper to create route config with error handling
// const createRouteConfig = (Component) => ({
//   element: createProtectedRoute(Component),
//   errorElement: <RouteErrorPage />
// });

// // Helper to create public route config with error handling
// const createPublicRouteConfig = (Component) => ({
//   element: createPublicRoute(Component),
//   errorElement: <RouteErrorPage />
// });

// // Protected Route - Only allow if authenticated
// const ProtectedRoute = ({ children }) => {
//   const isAuthenticated = selectIsAuthenticated(store.getState());
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// };

// // Public Route - Only allow if NOT authenticated
// const PublicRoute = ({ children }) => {
//   const isAuthenticated = selectIsAuthenticated(store.getState());
//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }
//   return children;
// };

// // Protected Auth Route - Only allow if NOT authenticated AND has required state
// const ProtectedAuthRoute = ({ children, requiredState }) => {
//   const isAuthenticated = selectIsAuthenticated(store.getState());

//   // If authenticated, redirect to dashboard
//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   // Check if user has the required state (came from proper flow)
//   if (requiredState && typeof window !== 'undefined') {
//     // This will be checked in the component using location.state
//     return children;
//   }

//   return children;
// };

// // Auth Layout wrapper
// const AuthLayout = ({ children }) => (
//   <Suspense fallback={<LoadingFallback />}>
//     {children}
//   </Suspense>
// );

// // Main router configuration
// const router = createBrowserRouter([
//   {
//     path: '/',
//     children: [
//       {
//         index: true,
//         element: (
//           <RouteErrorBoundary>
//             <Suspense fallback={<LoadingFallback />}>
//               <Home />
//             </Suspense>
//           </RouteErrorBoundary>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'about',
//         ...createPublicRouteConfig(About)
//       },
//       {
//         path: 'privacy',
//         ...createPublicRouteConfig(Privacy)
//       },
//       {
//         path: 'terms',
//         ...createPublicRouteConfig(Terms)
//       },
//       {
//         path: 'cookies',
//         ...createPublicRouteConfig(CookiePolicy)
//       },
//       {
//         path: 'faq',
//         ...createPublicRouteConfig(FAQ)
//       },
//       {
//         path: 'refund',
//         ...createPublicRouteConfig(Refund)
//       },
//       {
//         path: 'contact',
//         ...createPublicRouteConfig(Contact)
//       },
//       {
//         path: 'careers',
//         ...createPublicRouteConfig(Careers)
//       },
//       {
//         path: 'courses',
//         ...createPublicRouteConfig(Course)
//       },
//       {
//         path: 'courses/:id',
//         ...createPublicRouteConfig(CourseDetail)
//       },
//       {
//               path: 'instructors',
//         ...createPublicRouteConfig(Instructors)
//       },
//       {
//         path: 'instructors/:id',
//         ...createPublicRouteConfig(InstructorDetail)
//       },
//       {
//         path: 'paths',
//         ...createPublicRouteConfig(Paths)
//       },
//       {
//         path: 'login',
//         element: (
//           <AuthLayout>
//             <PublicRoute>
//               <Login />
//             </PublicRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'register',
//         element: (
//           <AuthLayout>
//             <PublicRoute>
//               <Register />
//             </PublicRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'verify',
//         element: (
//           <AuthLayout>
//             <ProtectedAuthRoute requiredState>
//               <Verify />
//             </ProtectedAuthRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'forgot',
//         element: (
//           <AuthLayout>
//             <ProtectedAuthRoute requiredState>
//               <Forgot />
//             </ProtectedAuthRoute>
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//       {
//         path: 'reset',
//         element: (
//           <AuthLayout>
//             <Reset />
//           </AuthLayout>
//         ),
//         errorElement: <RouteErrorPage />
//       },
//  // ── Dashboard ──────────────────────────────────────────
//       {
//         path: 'dashboard',
//         ...createRouteConfig(Dashboard)
//       },
 
    
//     ]
//   },
//   {
//     path: '*',
//     element: <Navigate to="/" replace />
//   }
// ]);

// export default router;


/// ─── Router configuration with lazy loading, route guards, and error boundaries ─────────────────────────────────────────────────────────────

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { store } from '../redux/store/store.js';
import { selectIsAuthenticated } from '../redux/slices/auth.slice.js';
import RouteErrorBoundary from '../components/RouteErrorBoundary.jsx';
import RouteErrorPage from '../components/RouteErrorPage.jsx';

// ─── Public pages ────────────────────────────────────────────────────────────
const Home            = lazy(() => import('../pages/PublicPages/Home'));
const About           = lazy(() => import('../pages/PublicPages/About'));
const Privacy         = lazy(() => import('../pages/PublicPages/Privacy'));
const Terms           = lazy(() => import('../pages/PublicPages/Terms'));
const CookiePolicy    = lazy(() => import('../pages/PublicPages/Cookie'));
const FAQ             = lazy(() => import('../pages/PublicPages/Faq'));
const Refund          = lazy(() => import('../pages/PublicPages/Refund'));
const Contact         = lazy(() => import('../pages/PublicPages/Contact'));
const Careers         = lazy(() => import('../pages/PublicPages/Careers'));
const Course          = lazy(() => import('../pages/CoursePages/Course'));
const CourseDetail    = lazy(() => import('../pages/CoursePages/CourseDetail'));
const Instructors     = lazy(() => import('../pages/InstructorPages/Instructors'));
const InstructorDetail= lazy(() => import('../pages/InstructorPages/InstructorDetail'));
const Paths           = lazy(() => import('../pages/PathsPage/Paths.jsx'));

// ─── Auth pages ───────────────────────────────────────────────────────────────
const Login    = lazy(() => import('../pages/AuthPages/Login'));
const Register = lazy(() => import('../pages/AuthPages/Register'));
const Verify   = lazy(() => import('../pages/AuthPages/Verify'));
const Forgot   = lazy(() => import('../pages/AuthPages/Forgot'));
const Reset    = lazy(() => import('../pages/AuthPages/Reset'));

// ─── Dashboard pages ──────────────────────────────────────────────────────────
const Dashboard        = lazy(() => import('../pages/Dashboard/Dashboard'));
const MyCourses        = lazy(() => import('../pages/Courses/MyCourses'));
const CourseLearning   = lazy(() => import('../pages/Courses/CourseLearning'));
const CourseProgress   = lazy(() => import('../pages/Courses/CourseProgress'));
const Assignments      = lazy(() => import('../pages/Assignments/Assignments'));
const LiveClasses      = lazy(() => import('../pages/LiveClasses/LiveClasses'));
const DoubtTickets     = lazy(() => import('../pages/DoubtTickets/DoubtTickets'));
const Discussions      = lazy(() => import('../pages/Community/Discussions'));
const StudyGroups      = lazy(() => import('../pages/Community/StudyGroups'));
const Certificates     = lazy(() => import('../pages/Achievements/Certificates'));
const Badges           = lazy(() => import('../pages/Achievements/Badges'));
const Leaderboard      = lazy(() => import('../pages/Achievements/Leaderboard'));
const LearningAnalytics= lazy(() => import('../pages/Analytics/LearningAnalytics'));
const Wallet           = lazy(() => import('../pages/Wallet/Wallet'));
const Transactions     = lazy(() => import('../pages/Wallet/Transactions'));
const Withdraw         = lazy(() => import('../pages/Wallet/Withdraw'));
const Announcements    = lazy(() => import('../pages/Communication/Announcements'));
const Notifications    = lazy(() => import('../pages/Communication/Notifications'));
const Profile          = lazy(() => import('../pages/Account/Profile'));
const Reviews          = lazy(() => import('../pages/Account/Reviews'));
const Security         = lazy(() => import('../pages/Account/Security'));

// ─── Loading fallback ────────────────────────────────────────────────────────
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  </div>
);

// ─── Route Guards ─────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const ProtectedAuthRoute = ({ children }) => {
  const isAuthenticated = selectIsAuthenticated(store.getState());
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const wrap = (Comp) => (
  <RouteErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <Comp />
    </Suspense>
  </RouteErrorBoundary>
);

const protect = (Comp) => (
  <RouteErrorBoundary>
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <Comp />
      </Suspense>
    </ProtectedRoute>
  </RouteErrorBoundary>
);

const publicRoute  = (Comp) => ({ element: wrap(Comp),    errorElement: <RouteErrorPage /> });
const protectedRoute = (Comp) => ({ element: protect(Comp), errorElement: <RouteErrorPage /> });

// ─── Router ──────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      // ── Public ────────────────────────────────────────────────────────
      { index: true, ...publicRoute(Home) },
      { path: 'about',            ...publicRoute(About)             },
      { path: 'privacy',          ...publicRoute(Privacy)           },
      { path: 'terms',            ...publicRoute(Terms)             },
      { path: 'cookies',          ...publicRoute(CookiePolicy)      },
      { path: 'faq',              ...publicRoute(FAQ)               },
      { path: 'refund',           ...publicRoute(Refund)            },
      { path: 'contact',          ...publicRoute(Contact)           },
      { path: 'careers',          ...publicRoute(Careers)           },
      { path: 'courses',          ...publicRoute(Course)            },
      { path: 'courses/:id',      ...publicRoute(CourseDetail)      },
      { path: 'instructors',      ...publicRoute(Instructors)       },
      { path: 'instructors/:id',  ...publicRoute(InstructorDetail)  },
      { path: 'paths',            ...publicRoute(Paths)             },

      // ── Auth ──────────────────────────────────────────────────────────
      {
        path: 'login',
        element: <Suspense fallback={<LoadingFallback />}><PublicRoute><Login /></PublicRoute></Suspense>,
        errorElement: <RouteErrorPage />
      },
      {
        path: 'register',
        element: <Suspense fallback={<LoadingFallback />}><PublicRoute><Register /></PublicRoute></Suspense>,
        errorElement: <RouteErrorPage />
      },
      {
        path: 'verify',
        element: <Suspense fallback={<LoadingFallback />}><ProtectedAuthRoute><Verify /></ProtectedAuthRoute></Suspense>,
        errorElement: <RouteErrorPage />
      },
      {
        path: 'forgot',
        element: <Suspense fallback={<LoadingFallback />}><ProtectedAuthRoute><Forgot /></ProtectedAuthRoute></Suspense>,
        errorElement: <RouteErrorPage />
      },
      {
        path: 'reset',
        element: <Suspense fallback={<LoadingFallback />}><Reset /></Suspense>,
        errorElement: <RouteErrorPage />
      },

      // ── Dashboard ─────────────────────────────────────────────────────
      { path: 'dashboard',                    ...protectedRoute(Dashboard)         },
      { path: 'dashboard/courses',            ...protectedRoute(MyCourses)         },
      { path: 'dashboard/learn/:courseId',    ...protectedRoute(CourseLearning)    },
      { path: 'dashboard/course-progress',    ...protectedRoute(CourseProgress)    },
      { path: 'dashboard/assignments',        ...protectedRoute(Assignments)       },
      { path: 'dashboard/live-classes',       ...protectedRoute(LiveClasses)       },
      { path: 'dashboard/doubt-tickets',      ...protectedRoute(DoubtTickets)      },
      { path: 'dashboard/discussions',        ...protectedRoute(Discussions)       },
      { path: 'dashboard/study-groups',       ...protectedRoute(StudyGroups)       },
      { path: 'dashboard/certificates',       ...protectedRoute(Certificates)      },
      { path: 'dashboard/badges',             ...protectedRoute(Badges)            },
      { path: 'dashboard/leaderboard',        ...protectedRoute(Leaderboard)       },
      { path: 'dashboard/analytics',          ...protectedRoute(LearningAnalytics) },
      { path: 'dashboard/wallet',             ...protectedRoute(Wallet)            },
      { path: 'dashboard/transactions',       ...protectedRoute(Transactions)      },
      { path: 'dashboard/withdraw',           ...protectedRoute(Withdraw)          },
      { path: 'dashboard/announcements',      ...protectedRoute(Announcements)     },
      { path: 'dashboard/notifications',      ...protectedRoute(Notifications)     },
      { path: 'dashboard/profile',            ...protectedRoute(Profile)           },
      { path: 'dashboard/reviews',            ...protectedRoute(Reviews)           },
      { path: 'dashboard/security',           ...protectedRoute(Security)          },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
