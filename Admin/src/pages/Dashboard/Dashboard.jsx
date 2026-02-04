import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectAdmin, selectIsAuthenticated } from '../../redux/slices/auth.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import { Card, Button } from '../../components/ui';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const admin = useSelector(selectAdmin);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Protect this route
  useProtectedRoute();

  // Manage token refresh on activity
  useTokenRefreshOnActivity();

  const handleLogout = () => {
    dispatch(logout()).then(() => {
      navigate('/admin/login');
    });
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {admin.name}</p>
          </div>
          <Button
            variant="secondary"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        {/* Admin Info Card */}
        <Card
          title="Admin Profile"
          subtitle="Your account information"
          size="lg"
          borders={{ top: true, right: true, bottom: true, left: true }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="text-lg font-semibold text-gray-900">{admin.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-gray-900">{admin.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Role</p>
              <p className="text-lg font-semibold text-gray-900">
                {admin.isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Status</p>
              <p className="text-lg font-semibold text-green-600">
                {admin.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </Card>

        {/* Features Info */}
        <Card
          title="Available Features"
          subtitle="Features you have access to"
          size="lg"
          borders={{ top: true, right: true, bottom: true, left: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admin.permissions && admin.permissions.length > 0 ? (
              admin.permissions.map((permission, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border-l-4 border-black"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {permission.replace(/_/g, ' ').toUpperCase()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 col-span-full">No specific permissions assigned</p>
            )}
          </div>

          {admin.isSuperAdmin && (
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-blue-900">
                ✓ You have super admin access to all features
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
