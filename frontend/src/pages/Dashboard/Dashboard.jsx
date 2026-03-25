// import { useEffect, useState, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import {
//   LayoutDashboard, BookOpen, TrendingUp, Clock, AlertTriangle, ChevronDown, ChevronUp,
// } from 'lucide-react';
// import { UserLayout } from '../../components/layout/UserLayout';
// import { getProfile, selectUser } from '../../redux/slices/auth.slice';
// import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

// // ─── Reusable Sub-Components ─────────────────────────────────────────

// function StatCard({ icon: Icon, label, value, subtitle }) {
//   return (
//     <motion.div
//       className="bg-[#111] border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-600 transition-colors group"
//       whileHover={{ y: -4 }}
//     >
//       <div className="flex items-center justify-between">
//         <div className="p-2.5 rounded-lg bg-white/5">
//           <Icon className="w-5 h-5 text-gray-300" />
//         </div>
//         <TrendingUp className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
//       </div>
//       <div>
//         <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
//         <p className="text-sm text-gray-400 mt-0.5">{label}</p>
//         {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
//       </div>
//     </motion.div>
//   );
// }

// function SectionTitle({ children, collapsible, collapsed, onToggle }) {
//   if (collapsible) {
//     return (
//       <button
//         onClick={onToggle}
//         className="flex items-center gap-2 text-lg font-semibold text-gray-300 mb-3 hover:text-white transition-colors group"
//       >
//         {children}
//         {collapsed ? (
//           <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
//         ) : (
//           <ChevronUp className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
//         )}
//       </button>
//     );
//   }
//   return <h2 className="text-lg font-semibold text-gray-300 mb-3">{children}</h2>;
// }

// // ─── Dashboard Component ─────────────────────────────────────────

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const user = useSelector(selectUser);

//   // Use protected route hook
//   useProtectedRoute();
//   useTokenRefreshOnActivity();

//   // State for collapsible sections
//   const [collapsedSections, setCollapsedSections] = useState({});

//   useEffect(() => {
//     // Fetch user profile on mount
//     dispatch(getProfile());
//   }, [dispatch]);

//   const toggleSection = useCallback((section) => {
//     setCollapsedSections(prev => ({
//       ...prev,
//       [section]: !prev[section],
//     }));
//   }, []);

//   if (!user) {
//     return (
//       <UserLayout>
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
//             <p className="text-white mt-4">Loading...</p>
//           </div>
//         </div>
//       </UserLayout>
//     );
//   }


//   return (
//     <UserLayout>
//       {/* Main Content */}
//       <div className="w-full bg-[#0f0f0f] min-h-screen">
//         {/* Page Header */}
//         <motion.div
//           className="border-b border-gray-800 bg-[#0a0a0a] p-6"
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//         >
//           <div className="max-w-7xl mx-auto">
//             <h1 className="text-3xl font-bold text-white mb-2">Student Dashboard</h1>
//             <p className="text-gray-400">
//               Welcome back, <span className="text-yellow-400">{user.firstName} {user.lastName}</span>!
//             </p>
//           </div>
//         </motion.div>

//         {/* Main Content Area */}
//         <div className="p-6">
//           <div className="max-w-7xl mx-auto space-y-8">
//             {/* Quick Stats */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//             >
//               <SectionTitle>Quick Stats</SectionTitle>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 <StatCard
//                   icon={BookOpen}
//                   label="Enrolled Courses"
//                   value="5"
//                   subtitle="2 in progress"
//                 />
//                 <StatCard
//                   icon={Clock}
//                   label="Learning Hours"
//                   value="24.5"
//                   subtitle="This month"
//                 />
//                 <StatCard
//                   icon={TrendingUp}
//                   label="Overall Progress"
//                   value="68%"
//                   subtitle="Across all courses"
//                 />
//                 <StatCard
//                   icon={AlertTriangle}
//                   label="Assignments Due"
//                   value="3"
//                   subtitle="This week"
//                 />
//               </div>
//             </motion.div>

//             {/* My Courses */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//             >
//               <SectionTitle
//                 collapsible
//                 collapsed={collapsedSections.courses}
//                 onToggle={() => toggleSection('courses')}
//               >
//                 <BookOpen className="w-5 h-5 inline mr-2" />
//                 My Courses
//               </SectionTitle>

//               {!collapsedSections.courses && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {[
//                     { title: 'React Fundamentals', progress: 75 },
//                     { title: 'Advanced JavaScript', progress: 60 },
//                     { title: 'Web Design Basics', progress: 45 },
//                   ].map((course, index) => (
//                     <motion.div
//                       key={index}
//                       className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors group cursor-pointer"
//                       whileHover={{ y: -4 }}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: 0.3 + index * 0.1 }}
//                     >
//                       <div className="h-32 bg-linear-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
//                         <BookOpen className="w-12 h-12 text-gray-600 group-hover:text-gray-500 transition-colors" />
//                       </div>
//                       <div className="p-4">
//                         <h3 className="text-white font-semibold mb-2">{course.title}</h3>
//                         <div className="space-y-2">
//                           <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
//                             <motion.div
//                               className="h-full bg-linear-to-r from-yellow-500 to-orange-500"
//                               initial={{ width: 0 }}
//                               animate={{ width: `${course.progress}%` }}
//                               transition={{ duration: 1, delay: 0.5 }}
//                             />
//                           </div>
//                           <p className="text-sm text-gray-400">{course.progress}% complete</p>
//                         </div>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </div>
//               )}
//             </motion.div>

//             {/* Recent Activity */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//             >
//               <SectionTitle
//                 collapsible
//                 collapsed={collapsedSections.activity}
//                 onToggle={() => toggleSection('activity')}
//               >
//                 <Clock className="w-5 h-5 inline mr-2" />
//                 Recent Activity
//               </SectionTitle>

//               {!collapsedSections.activity && (
//                 <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
//                   <div className="space-y-4">
//                     {[
//                       { action: 'Completed Lesson 5', course: 'React Fundamentals', time: '2 hours ago' },
//                       { action: 'Submitted Assignment', course: 'JavaScript Basics', time: 'Yesterday' },
//                       { action: 'Started New Course', course: 'Web Design Basics', time: '3 days ago' },
//                     ].map((activity, index) => (
//                       <motion.div
//                         key={index}
//                         className="flex items-center gap-4 pb-4 border-b border-gray-800/50 last:border-0"
//                         initial={{ opacity: 0, x: -20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: 0.4 + index * 0.1 }}
//                       >
//                         <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
//                           <span className="text-yellow-500">✓</span>
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <p className="text-white font-medium text-sm">{activity.action}</p>
//                           <p className="text-gray-500 text-xs">{activity.course}</p>
//                         </div>
//                         <p className="text-gray-500 text-xs whitespace-nowrap">{activity.time}</p>
//                       </motion.div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </motion.div>

//             {/* Profile Info Section */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.4 }}
//             >
//               <SectionTitle>Profile Information</SectionTitle>
//               <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <p className="text-gray-500 text-sm mb-1">First Name</p>
//                     <p className="text-white font-medium">{user.firstName}</p>
//                   </div>
//                   <div>
//                     <p className="text-gray-500 text-sm mb-1">Last Name</p>
//                     <p className="text-white font-medium">{user.lastName}</p>
//                   </div>
//                   <div>
//                     <p className="text-gray-500 text-sm mb-1">Email</p>
//                     <p className="text-white font-medium">{user.email}</p>
//                   </div>
//                   {user.phone && (
//                     <div>
//                       <p className="text-gray-500 text-sm mb-1">Phone</p>
//                       <p className="text-white font-medium">{user.phone}</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>
//     </UserLayout>
//   );
// };

// export default Dashboard;

/**
 * pages/Dashboard/Dashboard.jsx
 * ─────────────────────────────
 * Main dashboard entry point.
 * Only imports and composes section components — no logic here.
 */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { UserLayout } from "../../components/layout/UserLayout";
import { getProfile, selectUser } from "../../redux/slices/auth.slice";
import { useProtectedRoute, useTokenRefreshOnActivity } from "../../hooks/useProtectedRoute";

import DashboardStats from "../../components/DashboardPages/DashboardStats";
import DashboardContinueLearning from "../../components/DashboardPages/DashboardContinueLearning";
import { DashboardProgressOverview, DashboardStreakCard } from "../../components/DashboardPages/DashboardProgressOverview";
import DashboardUpcomingClasses from "../../components/DashboardPages/DashboardUpcomingClasses";
import DashboardRecentAnnouncements from "../../components/DashboardPages/DashboardRecentAnnouncements";
import {
  DashboardRecentActivity,
  DashboardWalletWidget,
  DashboardPendingAssignments,
} from "../../components/DashboardPages/DashboardWidgets";

// ─── Loading skeleton ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <UserLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto" />
          <p className="text-gray-500 text-sm mt-3">Loading your dashboard…</p>
        </div>
      </div>
    </UserLayout>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  if (!user) return <DashboardSkeleton />;

  return (
    <UserLayout>
      <div className="w-full bg-[#0f0f0f] min-h-screen">
        {/* Header */}
        <motion.div
          className="border-b border-gray-800 bg-[#0a0a0a] px-4 py-5 sm:px-6 sm:py-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              Good {getGreeting()},{" "}
              <span className="text-yellow-400">
                {user.firstName} {user.lastName}
              </span>{" "}
              👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Here's what's happening with your learning today.
            </p>
          </div>
        </motion.div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Stat cards */}
            <DashboardStats />

            {/* Continue learning */}
            <DashboardContinueLearning />

            {/* Progress + Streak — side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardProgressOverview />
              </div>
              <div>
                <DashboardStreakCard />
              </div>
            </div>

            {/* Upcoming classes + Pending assignments — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardUpcomingClasses />
              <DashboardPendingAssignments />
            </div>

            {/* Announcements + Wallet + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardRecentAnnouncements />
              </div>
              <div>
                <DashboardWalletWidget />
              </div>
            </div>

            {/* Recent activity */}
            <DashboardRecentActivity />

          </div>
        </div>
      </div>
    </UserLayout>
  );
};

// ─── Util ────────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default Dashboard;
