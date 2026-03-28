import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell, RefreshCw, Check, CheckCheck, Trash2, MessageCircle, BookOpen, DollarSign,
  Award, Star, Users, Video, Megaphone, AlertTriangle, Shield
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyNotifications, markAsRead, markAllAsRead, getUnreadCount
} from '../../redux/slices/notification.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

const typeIcons = {
  new_enrollment: Users,
  new_review: Star,
  assignment_submission: BookOpen,
  assignment_reported: AlertTriangle,
  assignment_moderation_update: Shield,
  discussion_reply: MessageCircle,
  announcement: Megaphone,
  payout_update: DollarSign,
  course_published: BookOpen,
  certificate_issued: Award,
  live_class_reminder: Video,
  doubt_ticket_created: MessageCircle,
  doubt_ticket_accepted: MessageCircle,
  doubt_ticket_resolved: Check,
  doubt_saturday_session_reminder: Bell,
  general: Bell,
};

const typeColors = {
  new_enrollment: 'text-blue-400 bg-blue-400/10',
  new_review: 'text-yellow-400 bg-yellow-400/10',
  assignment_submission: 'text-purple-400 bg-purple-400/10',
  assignment_reported: 'text-red-400 bg-red-400/10',
  assignment_moderation_update: 'text-cyan-400 bg-cyan-400/10',
  discussion_reply: 'text-green-400 bg-green-400/10',
  announcement: 'text-orange-400 bg-orange-400/10',
  payout_update: 'text-emerald-400 bg-emerald-400/10',
  doubt_ticket_created: 'text-amber-400 bg-amber-400/10',
  doubt_ticket_accepted: 'text-blue-400 bg-blue-400/10',
  doubt_ticket_resolved: 'text-green-400 bg-green-400/10',
  doubt_saturday_session_reminder: 'text-violet-400 bg-violet-400/10',
  general: 'text-gray-400 bg-gray-400/10',
};

export default function Notifications() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading, _pagination } = useSelector(s => s.notification);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyNotifications({ page: 1, limit: 50 }));
    dispatch(getUnreadCount());
  }, [dispatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRead = (id) => dispatch(markAsRead(id));
  const handleReadAll = () => dispatch(markAllAsRead());

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bell className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white bg-blue-500">{unreadCount}</span>
              )}
            </div>
            <p className="text-gray-500">Stay updated with your activity</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={handleReadAll}
                className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 rounded-lg text-sm font-medium">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-48"></div>
                    <div className="h-3 bg-gray-800 rounded w-64"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Bell className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No notifications yet</h3>
            <p className="text-gray-500 text-sm">You'll see activity updates here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = typeIcons[n.type] || Bell;
              const colorClass = typeColors[n.type] || typeColors.general;
              return (
                <div key={n._id}
                  className={`bg-[#111] border rounded-xl p-4 transition-colors cursor-pointer ${n.isRead ? 'border-gray-800/50 opacity-70' : 'border-gray-800 hover:border-gray-700'}`}
                  onClick={() => !n.isRead && handleRead(n._id)}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`text-sm font-medium truncate ${n.isRead ? 'text-gray-400' : 'text-white'}`}>{n.title}</h3>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>}
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-1">{n.message}</p>
                      <p className="text-gray-600 text-xs mt-1">{timeAgo(n.createdAt)}</p>
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
