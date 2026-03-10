import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageCircle, RefreshCw, AlertTriangle, Pin, CheckCircle, Circle, Send, ArrowLeft, Search, Filter
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getInstructorDiscussions, getDiscussion, addReply, toggleResolve, togglePin
} from '../../redux/slices/discussion.slice';
import { getMyCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function DiscussionsQA() {
  const dispatch = useDispatch();
  const { discussions, currentDiscussion, unresolvedCount, loading, pagination } = useSelector(s => s.discussion);
  const { courses } = useSelector(s => s.course);
  const [view, setView] = useState('list');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterResolved, setFilterResolved] = useState('');
  const [page, setPage] = useState(1);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    const params = { page, limit: 10 };
    if (filterCourse) params.courseId = filterCourse;
    if (filterResolved) params.resolved = filterResolved;
    dispatch(getInstructorDiscussions(params));
    dispatch(getMyCourses({ page: 1, limit: 100 }));
  }, [dispatch, page, filterCourse, filterResolved]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDiscussion = (id) => {
    dispatch(getDiscussion(id));
    setView('detail');
    setReplyText('');
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentDiscussion) return;
    setReplying(true);
    await dispatch(addReply({ id: currentDiscussion._id, content: replyText }));
    setReplyText('');
    setReplying(false);
  };

  const handleResolve = async (id) => {
    await dispatch(toggleResolve(id));
    if (view === 'detail') dispatch(getDiscussion(id));
  };

  const handlePin = async (id) => {
    await dispatch(togglePin(id));
    fetchData();
  };

  if (view === 'detail' && currentDiscussion) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <button onClick={() => { setView('list'); fetchData(); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Discussions
          </button>

          {/* Discussion Header */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {currentDiscussion.isPinned && <Pin className="w-4 h-4 text-yellow-400" />}
                  <h2 className="text-xl font-bold text-white">{currentDiscussion.title}</h2>
                </div>
                <p className="text-gray-400 text-sm mb-3">{currentDiscussion.content}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{currentDiscussion.author?.firstName} {currentDiscussion.author?.lastName}</span>
                  <span>{new Date(currentDiscussion.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-full ${currentDiscussion.isResolved ? 'text-green-400 bg-green-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                    {currentDiscussion.isResolved ? 'Resolved' : 'Open'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleResolve(currentDiscussion._id)}
                  className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${currentDiscussion.isResolved ? 'text-green-400' : 'text-gray-500'}`}>
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={() => handlePin(currentDiscussion._id)}
                  className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${currentDiscussion.isPinned ? 'text-yellow-400' : 'text-gray-500'}`}>
                  <Pin className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Replies */}
          <div className="space-y-3">
            {(currentDiscussion.replies || []).map((r, i) => (
              <div key={r._id || i} className={`bg-[#111] border rounded-xl p-4 ${r.authorRole === 'Instructor' ? 'border-blue-800/40 bg-blue-900/5' : 'border-gray-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white text-sm font-medium">{r.author?.firstName} {r.author?.lastName}</span>
                  {r.authorRole === 'Instructor' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-blue-400 bg-blue-400/10">INSTRUCTOR</span>
                  )}
                  <span className="text-gray-600 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-300 text-sm">{r.content}</p>
              </div>
            ))}
          </div>

          {/* Reply Input */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Write your reply..." rows={3}
              className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600 resize-none mb-3" />
            <button onClick={handleReply} disabled={!replyText.trim() || replying}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 text-sm disabled:opacity-50">
              <Send className="w-4 h-4" /> {replying ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MessageCircle className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Discussions & Q&A</h1>
            </div>
            <p className="text-gray-500">
              {unresolvedCount > 0 ? `${unresolvedCount} unresolved discussion${unresolvedCount > 1 ? 's' : ''}` : 'Manage student discussions'}
            </p>
          </div>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm">
            <option value="">All Courses</option>
            {(courses || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <select value={filterResolved} onChange={e => { setFilterResolved(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm">
            <option value="">All Status</option>
            <option value="false">Open</option>
            <option value="true">Resolved</option>
          </select>
        </div>

        {/* List */}
        {loading && discussions.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-5 bg-gray-800 rounded w-48 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : discussions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <MessageCircle className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No discussions yet</h3>
            <p className="text-gray-500 text-sm">Student discussions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {discussions.map(d => (
              <button key={d._id} onClick={() => openDiscussion(d._id)}
                className="w-full text-left bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {d.isResolved
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <Circle className="w-5 h-5 text-orange-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {d.isPinned && <Pin className="w-3.5 h-3.5 text-yellow-400" />}
                      <h3 className="text-white font-medium truncate">{d.title}</h3>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-1 mb-2">{d.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{d.author?.firstName} {d.author?.lastName}</span>
                      {d.course?.title && <span>{d.course.title}</span>}
                      <span>{d.replies?.length || 0} replies</span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30">Prev</button>
            <span className="text-gray-500 text-sm">Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
