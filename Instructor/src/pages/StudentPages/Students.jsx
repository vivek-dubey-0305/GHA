import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users, Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  BookOpen, Mail, Filter,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyStudents, selectStudents, selectStudentPagination,
  selectStudentsLoading, selectStudentsError,
} from '../../redux/slices/student.slice';
import { getMyCourses, selectCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Students() {
  const dispatch = useDispatch();
  const students = useSelector(selectStudents);
  const pagination = useSelector(selectStudentPagination);
  const loading = useSelector(selectStudentsLoading);
  const error = useSelector(selectStudentsError);
  const courses = useSelector(selectCourses);

  const [page, setPage] = useState(1);
  const [courseFilter, setCourseFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchStudents = useCallback(() => {
    dispatch(getMyStudents({ page, limit: 20, courseId: courseFilter || undefined }));
  }, [dispatch, page, courseFilter]);

  useEffect(() => {
    fetchStudents();
    if (!courses.length) dispatch(getMyCourses({ limit: 100 }));
  }, [fetchStudents, dispatch, courses.length]);

  const filteredStudents = searchQuery
    ? students.filter(s => {
        const name = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase()) || s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : students;

  if (error && !students.length) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4"><AlertTriangle className="w-10 h-10 text-gray-400" /></div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load students</h2>
            <p className="text-gray-500 mb-6">{typeof error === 'string' ? error : 'Something went wrong.'}</p>
            <button onClick={fetchStudents} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
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
              <Users className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Enrolled Students</h1>
            </div>
            <p className="text-gray-500">{pagination?.totalDocs || 0} total students</p>
          </div>
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
              className="bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm px-3 py-2.5 focus:outline-none focus:border-gray-600 transition-colors max-w-[250px]"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        {loading && !students.length ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse h-[72px]" />
            ))}
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Student</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Course</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredStudents.map((enrollment, idx) => (
                    <tr key={enrollment._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {enrollment.user?.profilePicture ? (
                            <img src={enrollment.user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">
                              {enrollment.user?.firstName} {enrollment.user?.lastName}
                            </p>
                            <p className="text-gray-500 text-xs flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {enrollment.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-gray-300 text-sm flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                          {enrollment.course?.title || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          enrollment.status === 'completed' ? 'bg-white/10 text-white'
                          : enrollment.status === 'active' ? 'bg-gray-800 text-gray-300'
                          : 'bg-gray-800 text-gray-500'
                        }`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-sm">
                        {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No students found</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery || courseFilter ? 'Try adjusting your filters' : 'Students will appear here once they enroll in your courses'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span></span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
