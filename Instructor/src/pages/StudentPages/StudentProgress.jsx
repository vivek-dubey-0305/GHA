import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users, RefreshCw, Search, BarChart3, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { getMyCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import apiClient from '../../utils/api.utils';

export default function StudentProgress() {
  const dispatch = useDispatch();
  const { courses } = useSelector(s => s.course);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useProtectedRoute();
  useTokenRefreshOnActivity();

  useEffect(() => { dispatch(getMyCourses({ page: 1, limit: 100 })); }, [dispatch]);

  const fetchProgress = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/enrollments/course/${selectedCourse}`);
      setEnrollments(res.data?.data?.enrollments || res.data?.data || []);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const filtered = enrollments.filter(e =>
    !searchTerm || (e.user?.firstName + ' ' + e.user?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: enrollments.length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    active: enrollments.filter(e => e.status === 'active').length,
    avgProgress: enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.completionPercentage || 0), 0) / enrollments.length)
      : 0
  };

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Student Progress</h1>
            </div>
            <p className="text-gray-500">Track student learning in your courses</p>
          </div>
          <button onClick={fetchProgress} disabled={loading || !selectedCourse}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm flex-1 max-w-xs">
            <option value="">Select a course</option>
            {(courses || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          {selectedCourse && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
            </div>
          )}
        </div>

        {/* Stats */}
        {selectedCourse && enrollments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: stats.total, icon: Users, color: 'text-blue-400' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
              { label: 'Active', value: stats.active, icon: Clock, color: 'text-yellow-400' },
              { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: BarChart3, color: 'text-purple-400' },
            ].map((s, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-gray-500 uppercase">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {!selectedCourse ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Users className="w-16 h-16 text-gray-700 mb-4" />
            <p className="text-gray-500">Select a course to view student progress</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-40"></div>
                    <div className="h-2 bg-gray-800 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Users className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No students found</h3>
            <p className="text-gray-500 text-sm">No enrollments match your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(e => {
              const pct = e.completionPercentage || 0;
              return (
                <div key={e._id} className="bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white font-medium text-sm shrink-0">
                      {e.user?.firstName?.[0]}{e.user?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium truncate">{e.user?.firstName} {e.user?.lastName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === 'completed' ? 'text-green-400 bg-green-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                          {e.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : pct > 50 ? '#3b82f6' : '#f59e0b' }}></div>
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {e.completedLessons || 0}/{e.totalLessons || 0} lessons • Enrolled {new Date(e.enrolledAt || e.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
