import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Trash2, Eye, ToggleLeft, ToggleRight,
  RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Users, Star, Clock,
  Filter,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { WarningModal } from '../../components/ui';
import {
  getMyCourses, deleteFullCourse, togglePublishCourse,
  selectCourses, selectCoursePagination, selectCoursesLoading, selectCoursesError,
  selectDeleteCourseLoading, selectTogglePublishLoading,
} from '../../redux/slices/course.slice';
import { getThumbnailUrl } from '../../utils/course.utils';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Courses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const courses = useSelector(selectCourses);
  const pagination = useSelector(selectCoursePagination);
  const loading = useSelector(selectCoursesLoading);
  const error = useSelector(selectCoursesError);
  const deleteLoading = useSelector(selectDeleteCourseLoading);
  const toggleLoading = useSelector(selectTogglePublishLoading);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchCourses = useCallback(() => {
    dispatch(getMyCourses({ page, limit: 12, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    dispatch(deleteFullCourse(deleteTarget._id)).then((res) => {
      if (!res.error) {
        setDeleteTarget(null);
        fetchCourses();
      }
    });
  }, [dispatch, deleteTarget, fetchCourses]);

  const handleTogglePublish = useCallback((courseId) => {
    dispatch(togglePublishCourse(courseId)).then((res) => {
      if (!res.error) fetchCourses();
    });
  }, [dispatch, fetchCourses]);

  const filteredCourses = searchQuery
    ? courses.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : courses;

  // ─── Error State ───────────────────────────────────────────────
  if (error && !courses.length) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4">
              <AlertTriangle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load courses</h2>
            <p className="text-gray-500 mb-6">{typeof error === 'string' ? error : 'Something went wrong.'}</p>
            <button onClick={fetchCourses} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
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
              <BookOpen className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">My Courses</h1>
            </div>
            <p className="text-gray-500">{pagination?.totalDocs || 0} total courses</p>
          </div>
          <button
            onClick={fetchCourses}
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
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm px-3 py-2.5 focus:outline-none focus:border-gray-600 transition-colors"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        {loading && !courses.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-[200px]" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => {
              const thumbUrl = getThumbnailUrl(course.thumbnail);
              return (
              <div key={course._id} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all group">
                {/* Thumbnail - Clickable */}
                <div
                  className="h-36 bg-gray-900 relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/instructor/courses/${course._id}`)}
                >
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-10 h-10 text-gray-700" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      course.status === 'published' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {course.status || 'draft'}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content - Clickable */}
                <div className="p-4 cursor-pointer" onClick={() => navigate(`/instructor/courses/${course._id}`)}>
                  <h3 className="text-white font-semibold text-sm truncate mb-1">{course.title || 'Untitled'}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3">{course.shortDescription || course.description || 'No description'}</p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.enrolledCount || 0}</span>
                    {course.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {Number(course.rating).toFixed(1)}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.totalModules || 0} modules</span>
                  </div>

                  {/* Price */}
                  {course.price != null && (
                    <p className="text-white font-bold text-sm mb-3">
                      {course.price === 0 ? 'Free' : `₹${course.price.toLocaleString()}`}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePublish(course._id); }}
                      disabled={toggleLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                      title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {course.status === 'published' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {course.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(course); }}
                      disabled={deleteLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Start by creating your first course'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">
              Page <span className="text-white font-medium">{page}</span> of{' '}
              <span className="text-white font-medium">{pagination.totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <WarningModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Course"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone and will remove all associated modules, lessons, and enrollments.`}
          confirmText={deleteLoading ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
        />
      )}
    </InstructorLayout>
  );
}
