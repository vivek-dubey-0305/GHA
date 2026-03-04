import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  FileText,
  UserCheck,
  ClipboardList,
  Award,
  DollarSign,
  Star,
  Send,
  Video,
  Package,
  Paperclip,
  LayoutDashboard,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  PenLine,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { getDashboard, selectDashboardData, selectDashboardLoading, selectDashboardError } from '../../redux/slices/dashboard.slice';
import { selectAdmin } from '../../redux/slices/auth.slice';
import { getDraftCourses, selectDraftCourses, selectDraftCoursesLoading } from '../../redux/slices/course.slice';

function StatCard({ icon: Icon, label, value, subtitle, iconColor = 'text-blue-400', iconBg = 'bg-blue-500/10' }) {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-lg font-semibold text-gray-300 mb-3">{children}</h2>;
}

function SkeletonCard() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="w-10 h-10 bg-gray-800 rounded-lg mb-4" />
      <div className="w-20 h-6 bg-gray-800 rounded mb-2" />
      <div className="w-28 h-4 bg-gray-800 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dashboardData = useSelector(selectDashboardData);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const admin = useSelector(selectAdmin);
  const draftCourses = useSelector(selectDraftCourses);
  const draftCoursesLoading = useSelector(selectDraftCoursesLoading);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    dispatch(getDashboard());
    dispatch(getDraftCourses({ limit: 5 }));
    setLastRefreshed(new Date());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getDashboard());
    dispatch(getDraftCourses({ limit: 5 }));
    setLastRefreshed(new Date());
  };

  const overview = dashboardData?.data?.overview;
  const payments = dashboardData?.data?.payments;
  const recent = dashboardData?.data?.recent;

  const navigationItems = [
    { name: 'Users', href: '/admin/users', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Instructors', href: '/admin/instructors', icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen, color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'Modules', href: '/admin/modules', icon: Layers, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { name: 'Lessons', href: '/admin/lessons', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { name: 'Enrollments', href: '/admin/enrollments', icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Assignments', href: '/admin/assignments', icon: ClipboardList, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { name: 'Certificates', href: '/admin/certificates', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'Payments', href: '/admin/payments', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'Reviews', href: '/admin/reviews', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { name: 'Submissions', href: '/admin/submissions', icon: Send, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { name: 'Live Classes', href: '/admin/live-classes', icon: Video, color: 'text-red-400', bg: 'bg-red-500/10' },
    { name: 'Video Packages', href: '/admin/video-packages', icon: Package, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { name: 'Materials', href: '/admin/materials', icon: Paperclip, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  ];

  // Loading state
  if (loading && !dashboardData) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 space-y-8">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="w-48 h-8 bg-gray-800 rounded mb-2" />
            <div className="w-72 h-4 bg-gray-800 rounded" />
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-red-500/10 mb-4">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              {typeof error === 'string' ? error : 'An unexpected error occurred while fetching dashboard data.'}
            </p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LayoutDashboard className="w-7 h-7 text-blue-400" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
            </div>
            <p className="text-gray-400">
              Welcome back, <span className="text-gray-200 font-medium">{admin?.name || 'Admin'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div>
          <SectionTitle>Overview</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={overview?.totalUsers?.toLocaleString()}
              subtitle="Registered accounts"
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
            />
            <StatCard
              icon={GraduationCap}
              label="Total Instructors"
              value={overview?.totalInstructors?.toLocaleString()}
              subtitle="Active educators"
              iconColor="text-purple-400"
              iconBg="bg-purple-500/10"
            />
            <StatCard
              icon={BookOpen}
              label="Total Courses"
              value={overview?.totalCourses?.toLocaleString()}
              subtitle="All courses"
              iconColor="text-green-400"
              iconBg="bg-green-500/10"
            />
            <StatCard
              icon={UserCheck}
              label="Total Enrollments"
              value={overview?.totalEnrollments?.toLocaleString()}
              subtitle="Course enrollments"
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10"
            />
          </div>
        </div>

        {/* Revenue Row */}
        <div>
          <SectionTitle>Revenue & Payments</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={payments?.totalRevenue != null ? `$${payments.totalRevenue.toLocaleString()}` : undefined}
              subtitle="Lifetime earnings"
              iconColor="text-green-400"
              iconBg="bg-green-500/10"
            />
            <StatCard
              icon={TrendingUp}
              label="Completed Payments"
              value={payments?.completed?.toLocaleString()}
              subtitle="Successful transactions"
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10"
            />
            <StatCard
              icon={Clock}
              label="Pending Payments"
              value={payments?.pending?.toLocaleString()}
              subtitle="Awaiting confirmation"
              iconColor="text-yellow-400"
              iconBg="bg-yellow-500/10"
            />
            <StatCard
              icon={DollarSign}
              label="Total Transactions"
              value={payments?.totalTransactions?.toLocaleString()}
              subtitle="All payment records"
              iconColor="text-cyan-400"
              iconBg="bg-cyan-500/10"
            />
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div>
          <SectionTitle>Additional Statistics</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Published Courses"
              value={overview?.publishedCourses?.toLocaleString()}
              subtitle="Live & available"
              iconColor="text-teal-400"
              iconBg="bg-teal-500/10"
            />
            <StatCard
              icon={UserCheck}
              label="Active Enrollments"
              value={overview?.activeEnrollments?.toLocaleString()}
              subtitle="Currently learning"
              iconColor="text-indigo-400"
              iconBg="bg-indigo-500/10"
            />
            <StatCard
              icon={Award}
              label="Total Certificates"
              value={overview?.totalCertificates?.toLocaleString()}
              subtitle="Certificates issued"
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10"
            />
            <StatCard
              icon={AlertTriangle}
              label="Reported Reviews"
              value={overview?.reportedReviews?.toLocaleString()}
              subtitle="Needs attention"
              iconColor="text-red-400"
              iconBg="bg-red-500/10"
            />
          </div>
        </div>

        {/* Recent Activity Row */}
        <div>
          <SectionTitle>Recent Activity (Last 30 Days)</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{recent?.users?.toLocaleString() ?? '—'}</p>
                  <p className="text-sm text-gray-400 mt-0.5">New Users</p>
                  <p className="text-xs text-gray-500 mt-1">Registered in the last 30 days</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <UserCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{recent?.enrollments?.toLocaleString() ?? '—'}</p>
                  <p className="text-sm text-gray-400 mt-0.5">New Enrollments</p>
                  <p className="text-xs text-gray-500 mt-1">Enrolled in the last 30 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Draft Courses */}
        {(draftCourses?.length > 0 || draftCoursesLoading) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Draft Courses</SectionTitle>
              <Link to="/admin/courses" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {draftCoursesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftCourses.slice(0, 5).map((draft) => (
                  <div
                    key={draft._id}
                    className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-yellow-500/30 transition-colors group cursor-pointer"
                    onClick={() => navigate('/admin/courses', { state: { resumeDraft: draft } })}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/10 shrink-0">
                        <PenLine className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-semibold truncate">{draft.title || 'Untitled Draft'}</h3>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">{draft.shortDescription || draft.description || 'No description'}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                          <span>{draft.modules?.length || 0} modules</span>
                          <span>&bull;</span>
                          <span>{new Date(draft.updatedAt || draft.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <span className="text-yellow-400 text-xs font-medium group-hover:text-yellow-300 flex items-center gap-1">
                        Resume editing <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Navigation Grid */}
        <div>
          <SectionTitle>Quick Navigation</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all block"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${item.bg}`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                  <h3 className="text-white text-sm font-semibold">{item.name}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
