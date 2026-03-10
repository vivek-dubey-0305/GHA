import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  MessageSquare, BookOpen,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { selectCourses, getMyCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import apiClient from '../../utils/api.utils';

export default function Reviews() {
  const dispatch = useDispatch();
  const courses = useSelector(selectCourses);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  useEffect(() => {
    if (!courses.length) dispatch(getMyCourses({ limit: 100 }));
  }, [dispatch, courses.length]);

  const fetchReviews = useCallback(async () => {
    if (!selectedCourse) {
      setReviews([]);
      setPagination(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/courses/${selectedCourse}/reviews`, { params: { page, limit: 10 } });
      setReviews(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { setPage(1); }, [selectedCourse]);

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Star className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Reviews</h1>
            </div>
            <p className="text-gray-500">Student feedback on your courses</p>
          </div>
          {selectedCourse && (
            <button
              onClick={fetchReviews}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          )}
        </div>

        {/* Course Selector */}
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-[#111] border border-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600 min-w-[200px]"
          >
            <option value="">Select a course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* No Course Selected */}
        {!selectedCourse && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Select a course to view reviews</h3>
            <p className="text-gray-500 text-sm">Choose a course from the dropdown above</p>
          </div>
        )}

        {/* Error */}
        {selectedCourse && error && !reviews.length && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-gray-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Failed to load reviews</h2>
            <button onClick={fetchReviews} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors mt-3 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {selectedCourse && loading && !reviews.length && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-[100px]" />
            ))}
          </div>
        )}

        {/* Reviews List */}
        {selectedCourse && !loading && !error && reviews.length > 0 && (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(review.user?.firstName?.[0] || review.user?.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {review.user?.firstName} {review.user?.lastName || review.user?.name || 'Student'}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (review.rating || 0) ? 'text-white fill-white' : 'text-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-400 text-sm mt-3 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No reviews */}
        {selectedCourse && !loading && !error && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Star className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No reviews yet</h3>
            <p className="text-gray-500 text-sm">This course hasn&apos;t received any reviews</p>
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
