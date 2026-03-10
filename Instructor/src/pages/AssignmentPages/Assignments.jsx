import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ClipboardList, Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  BookOpen, Clock, Users, Filter, Send,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyAssignments, getPendingSubmissions,
  selectAssignments, selectAssignmentPagination, selectAssignmentsLoading, selectAssignmentsError,
  selectPendingSubmissions, selectPendingSubmissionsLoading,
} from '../../redux/slices/assignment.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Assignments() {
  const dispatch = useDispatch();
  const assignments = useSelector(selectAssignments);
  const pagination = useSelector(selectAssignmentPagination);
  const loading = useSelector(selectAssignmentsLoading);
  const error = useSelector(selectAssignmentsError);
  const pendingSubmissions = useSelector(selectPendingSubmissions);
  const pendingLoading = useSelector(selectPendingSubmissionsLoading);

  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('assignments'); // 'assignments' | 'submissions'

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyAssignments({ page, limit: 10 }));
    dispatch(getPendingSubmissions({ limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error && !assignments.length) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4"><AlertTriangle className="w-10 h-10 text-gray-400" /></div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load assignments</h2>
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
              <ClipboardList className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Assignments</h1>
            </div>
            <p className="text-gray-500">
              {assignments.length} assignments &middot; {pendingSubmissions.length} pending reviews
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] border border-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('assignments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'assignments' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setTab('submissions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              tab === 'submissions' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending Reviews
            {pendingSubmissions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">
                {pendingSubmissions.length}
              </span>
            )}
          </button>
        </div>

        {/* Assignments Tab */}
        {tab === 'assignments' && (
          loading && !assignments.length ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-[100px]" />
              ))}
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{assignment.title}</h3>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{assignment.description || 'No description'}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {assignment.course?.title || 'No course'}</span>
                        {assignment.dueDate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                        {assignment.maxScore && <span>Max Score: {assignment.maxScore}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="w-12 h-12 text-gray-700 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-gray-500 text-sm">Assignments you create will appear here</p>
            </div>
          )
        )}

        {/* Pending Submissions Tab */}
        {tab === 'submissions' && (
          pendingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-[90px]" />
              ))}
            </div>
          ) : pendingSubmissions.length > 0 ? (
            <div className="space-y-3">
              {pendingSubmissions.map((sub) => (
                <div key={sub._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white/5">
                        <Send className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium">
                          {sub.user?.firstName} {sub.user?.lastName}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {sub.assignment?.title || 'Unknown Assignment'} &middot; {sub.course?.title || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                      </span>
                      {sub.assignment?.maxScore && (
                        <p className="text-xs text-gray-600 mt-0.5">Max: {sub.assignment.maxScore}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Send className="w-12 h-12 text-gray-700 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No pending submissions</h3>
              <p className="text-gray-500 text-sm">All submissions have been reviewed</p>
            </div>
          )
        )}

        {/* Pagination for assignments */}
        {tab === 'assignments' && pagination && pagination.totalPages > 1 && (
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
