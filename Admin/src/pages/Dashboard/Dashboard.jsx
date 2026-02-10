// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { logout, selectAdmin, selectIsAuthenticated } from '../../redux/slices/auth.slice';
// import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
// import { Card, Button } from '../../components/ui';

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const admin = useSelector(selectAdmin);
//   const isAuthenticated = useSelector(selectIsAuthenticated);

//   // Protect this route
//   useProtectedRoute();

//   // Manage token refresh on activity
//   useTokenRefreshOnActivity();

//   const handleLogout = () => {
//     dispatch(logout()).then(() => {
//       navigate('/admin/login');
//     });
//   };

//   if (!isAuthenticated || !admin) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
//             <p className="text-gray-400">Welcome back, {admin.name}</p>
//           </div>
//           <Button
//             variant="secondary"
//             onClick={handleLogout}
//           >
//             Logout
//           </Button>
//         </div>

//         {/* Admin Info Card */}
//         <Card
//           title="Admin Profile"
//           subtitle="Your account information"
//           size="lg"
//           borders={{ top: true, right: true, bottom: true, left: true }}
//           className="mb-6"
//         >
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <p className="text-sm text-gray-600 mb-1">Name</p>
//               <p className="text-lg font-semibold text-gray-900">{admin.name}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-600 mb-1">Email</p>
//               <p className="text-lg font-semibold text-gray-900">{admin.email}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-600 mb-1">Role</p>
//               <p className="text-lg font-semibold text-gray-900">
//                 {admin.isSuperAdmin ? 'Super Admin' : 'Admin'}
//               </p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-600 mb-1">Account Status</p>
//               <p className="text-lg font-semibold text-green-600">
//                 {admin.isActive ? 'Active' : 'Inactive'}
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Features Info */}
//         <Card
//           title="Available Features"
//           subtitle="Features you have access to"
//           size="lg"
//           borders={{ top: true, right: true, bottom: true, left: true }}
//         >
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {admin.permissions && admin.permissions.length > 0 ? (
//               admin.permissions.map((permission, index) => (
//                 <div
//                   key={index}
//                   className="p-4 bg-gray-50 rounded-lg border-l-4 border-black"
//                 >
//                   <p className="text-sm font-medium text-gray-900">
//                     {permission.replace(/_/g, ' ').toUpperCase()}
//                   </p>
//                 </div>
//               ))
//             ) : (
//               <p className="text-gray-600 col-span-full">No specific permissions assigned</p>
//             )}
//           </div>

//           {admin.isSuperAdmin && (
//             <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
//               <p className="text-sm text-blue-900">
//                 ✓ You have super admin access to all features
//               </p>
//             </div>
//           )}
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;




import { Users, GraduationCap, BookOpen, DollarSign, Settings, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';

export default function Dashboard() {
  const navigationItems = [
    { name: 'Users', href: '/admin/users', icon: Users, description: 'Manage user accounts' },
    { name: 'Instructors', href: '/admin/instructors', icon: GraduationCap, description: 'Manage instructors' },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen, description: 'Manage courses' },
    { name: 'Revenue', href: '/admin/revenue', icon: DollarSign, description: 'View revenue stats' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'View analytics' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, description: 'System settings' },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Navigate to different sections</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 hover:border-gray-600 transition-colors block"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-gray-800 text-blue-400">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">{item.name}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
