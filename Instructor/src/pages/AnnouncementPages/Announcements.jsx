import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Megaphone, Plus, RefreshCw, AlertTriangle, Trash2, Edit2, X, Send, Filter
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement
} from '../../redux/slices/announcement.slice';
import { getMyCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

export default function Announcements() {
  const dispatch = useDispatch();
  const { announcements, loading, error, pagination } = useSelector(s => s.announcement);
  const { courses } = useSelector(s => s.course);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterCourse, setFilterCourse] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ title: '', content: '', course: '', type: 'general', priority: 'normal' });

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    const params = { page, limit: 10 };
    if (filterCourse) params.courseId = filterCourse;
    dispatch(getMyAnnouncements(params));
    dispatch(getMyCourses({ page: 1, limit: 100 }));
  }, [dispatch, page, filterCourse]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.course) delete data.course;
    if (editId) {
      await dispatch(updateAnnouncement({ id: editId, data }));
    } else {
      await dispatch(createAnnouncement(data));
    }
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', content: '', course: '', type: 'general', priority: 'normal' });
    fetchData();
  };

  const handleEdit = (a) => {
    setForm({ title: a.title, content: a.content, course: a.course?._id || '', type: a.type, priority: a.priority });
    setEditId(a._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      await dispatch(deleteAnnouncement(id));
    }
  };

  const priorityColors = { high: 'text-red-400 bg-red-400/10', normal: 'text-blue-400 bg-blue-400/10', low: 'text-gray-400 bg-gray-400/10' };
  const typeLabels = { general: 'General', new_lecture: 'New Lecture', live_class: 'Live Class', assignment: 'Assignment', deadline: 'Deadline', update: 'Update' };

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Megaphone className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Announcements</h1>
            </div>
            <p className="text-gray-500">Communicate with your students</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm">
              <option value="">All Courses</option>
              {(courses || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
            <button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', content: '', course: '', type: 'general', priority: 'normal' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm">
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'New'} Announcement</h2>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Title" required
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your announcement..." required rows={4}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600 resize-none" />
                <div className="grid grid-cols-3 gap-3">
                  <select value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                    className="px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm">
                    <option value="">All Students</option>
                    {(courses || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm">
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-300 text-sm">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 text-sm">
                  <Send className="w-4 h-4" /> {editId ? 'Update' : 'Send'} Announcement
                </button>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-5 bg-gray-800 rounded w-48 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Megaphone className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No announcements yet</h3>
            <p className="text-gray-500 text-sm">Create your first announcement to communicate with students</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-medium truncate">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[a.priority] || priorityColors.normal}`}>
                        {a.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-400 bg-gray-400/10">
                        {typeLabels[a.type] || a.type}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">{a.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {a.course?.title && <span>{a.course.title}</span>}
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(a)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(a._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30 hover:border-gray-600">Prev</button>
            <span className="text-gray-500 text-sm">Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 text-sm disabled:opacity-30 hover:border-gray-600">Next</button>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
