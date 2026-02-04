import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectUser, selectIsAuthenticated, uploadProfilePicture, selectUploadProfilePictureLoading } from '../../redux/slices/auth.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import { Card, Button } from '../../components/ui';
import { useState } from 'react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const uploadLoading = useSelector(selectUploadProfilePictureLoading);
  const [selectedFile, setSelectedFile] = useState(null);

  // Protect this route
  useProtectedRoute();

  // Manage token refresh on activity
  useTokenRefreshOnActivity();

  const handleLogout = () => {
    dispatch(logout()).then(() => {
      navigate('/login');
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadProfilePicture = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    dispatch(uploadProfilePicture(formData)).then(() => {
      setSelectedFile(null);
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Student Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user.firstName} {user.lastName}</p>
          </div>
          <Button
            variant="secondary"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        {/* Profile Picture Section */}
        <Card
          title="Profile Picture"
          subtitle="Upload or update your profile picture"
          size="lg"
          borders={{ top: true, right: true, bottom: true, left: true }}
          className="mb-6"
        >
          <div className="flex items-center gap-6">
            {user.profilePicture && (
              <img
                src={user.profilePicture}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-3"
              />
              {selectedFile && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUploadProfilePicture}
                  loading={uploadLoading}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'Uploading...' : 'Upload Picture'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Student Info Card */}
        <Card
          title="Student Profile"
          subtitle="Your account information"
          size="lg"
          borders={{ top: true, right: true, bottom: true, left: true }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-lg font-semibold text-gray-900">{user.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Status</p>
              <p className={`text-lg font-semibold ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email Verified</p>
              <p className={`text-lg font-semibold ${user.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.isEmailVerified ? 'Verified' : 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">KYC Status</p>
              <p className={`text-lg font-semibold ${user.isKYCVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.isKYCVerified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
        </Card>

        {/* Status Alerts */}
        {user.isSuspended && (
          <Card
            title="Account Suspended"
            subtitle="Your account has been suspended"
            size="lg"
            borders={{ top: true, right: true, bottom: true, left: true }}
            className="mb-6 bg-red-50"
          >
            <div className="text-red-900">
              <p className="font-semibold mb-2">Reason: {user.suspensionReason || 'Not specified'}</p>
              <p className="text-sm">Please contact support for more information.</p>
            </div>
          </Card>
        )}

        {/* Statistics */}
        <Card
          title="Quick Stats"
          subtitle="Your learning statistics"
          size="lg"
          borders={{ top: true, right: true, bottom: true, left: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Courses Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{user.learningProgress?.totalCoursesEnrolled || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Courses Completed</p>
              <p className="text-2xl font-bold text-gray-900">{user.learningProgress?.totalCoursesCompleted || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Learning Hours</p>
              <p className="text-2xl font-bold text-gray-900">{user.learningProgress?.totalLearningHours || 0}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
