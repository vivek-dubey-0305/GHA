import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3, RefreshCw, AlertTriangle, TrendingUp, Users, DollarSign, Star, BookOpen,
  ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { getAnalyticsOverview, getEnrollmentTrends, getRevenueTrends, getCourseAnalytics } from '../../redux/slices/analytics.slice';
import { getMyCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CourseAnalytics() {
  const dispatch = useDispatch();
  const { overview, enrollmentTrends, revenueTrends, courseAnalytics, loading, error } = useSelector(s => s.analytics);
  const { courses } = useSelector(s => s.course);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [period, setPeriod] = useState('30d');

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getAnalyticsOverview());
    dispatch(getEnrollmentTrends(period));
    dispatch(getRevenueTrends(period));
    dispatch(getMyCourses({ page: 1, limit: 100 }));
  }, [dispatch, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedCourse) dispatch(getCourseAnalytics(selectedCourse));
  }, [selectedCourse, dispatch]);

  const statCards = overview ? [
    { label: 'Total Enrollments', value: overview.totalEnrollments, icon: Users, color: 'text-blue-400' },
    { label: 'Completion Rate', value: `${overview.completionRate}%`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Total Revenue', value: `₹${(overview.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-yellow-400' },
    { label: 'Avg Rating', value: overview.averageRating || 'N/A', icon: Star, color: 'text-orange-400' },
    { label: 'Total Courses', value: overview.totalCourses, icon: BookOpen, color: 'text-purple-400' },
    { label: 'Total Reviews', value: overview.totalReviews, icon: Star, color: 'text-pink-400' },
  ] : [];

  if (error && !overview) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4"><AlertTriangle className="w-10 h-10 text-gray-400" /></div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load analytics</h2>
            <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors mt-4">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Course Analytics</h1>
            </div>
            <p className="text-gray-500">Monitor performance across all your courses</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        {loading && !overview ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-20 mb-3"></div>
                <div className="h-8 bg-gray-800 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((s, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Trends */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Enrollment Trends</h3>
            {enrollmentTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={enrollmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="_id" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f630" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-600 text-sm">No enrollment data for this period</div>
            )}
          </div>

          {/* Revenue Trends */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Revenue Trends</h3>
            {revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="_id" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-600 text-sm">No revenue data for this period</div>
            )}
          </div>
        </div>

        {/* Per-Course Analytics */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-white font-semibold">Course-Level Analytics</h3>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
              className="px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm max-w-xs">
              <option value="">Select a course</option>
              {(courses || []).map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          {!selectedCourse ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              Select a course to view detailed analytics
            </div>
          ) : loading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (<div key={i} className="h-20 bg-gray-800 rounded-lg"></div>))}
              </div>
            </div>
          ) : courseAnalytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Enrollments', value: courseAnalytics.enrollments },
                  { label: 'Completions', value: courseAnalytics.completions },
                  { label: 'Completion Rate', value: `${courseAnalytics.completionRate}%` },
                  { label: 'Avg Progress', value: `${courseAnalytics.avgProgress}%` },
                  { label: 'Watch Time', value: `${Math.round((courseAnalytics.totalWatchTime || 0) / 60)}m` },
                  { label: 'Avg Rating', value: courseAnalytics.avgRating || 'N/A' },
                  { label: 'Revenue', value: `₹${(courseAnalytics.revenue || 0).toLocaleString()}` },
                  { label: 'Reviews', value: courseAnalytics.totalReviews },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-lg font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Rating Distribution */}
              {courseAnalytics.ratingDistribution && (
                <div>
                  <h4 className="text-sm text-gray-400 mb-3">Rating Distribution</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = courseAnalytics.ratingDistribution[star] || 0;
                      const total = courseAnalytics.totalReviews || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm text-gray-400 w-12">{star} star</span>
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </InstructorLayout>
  );
}
