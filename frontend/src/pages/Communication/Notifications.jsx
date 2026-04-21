/**
 * pages/Communication/Notifications.jsx
 */
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useDispatch } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import NotificationCard from "../../components/CommunicationPages/NotificationCard";
import CommunicationDetailModal from "../../components/CommunicationPages/CommunicationDetailModal";
import { decrementUnreadByType, setNotificationsUnread } from "../../redux/slices/communication.slice";
import { apiClient } from "../../utils/api.utils";

export default function Notifications() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const unread = items.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/notifications/user/my?limit=100");
      const list = (res?.data?.data?.notifications || []).filter((item) => item.type !== "announcement");
      setItems(list);
      dispatch(setNotificationsUnread(list.filter((item) => !item.isRead).length));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = useCallback(async (id) => {
    const target = items.find((item) => item._id === id);
    if (!target || target.isRead) return;

    try {
      await apiClient.patch(`/notifications/user/${id}/read`);
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

    setItems((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    dispatch(decrementUnreadByType(target.type));
  }, [dispatch, items]);

  useEffect(() => {
    const handleIncoming = (event) => {
      const payload = event.detail;
      if (!payload || payload.type === "announcement") return;
      setItems((prev) => [payload, ...prev.filter((item) => item._id !== payload._id)]);
    };

    const handleInboxRefresh = () => {
      loadNotifications();
    };

    window.addEventListener("gha:notification:new", handleIncoming);
    window.addEventListener("gha:inbox:refresh", handleInboxRefresh);
    return () => {
      window.removeEventListener("gha:notification:new", handleIncoming);
      window.removeEventListener("gha:inbox:refresh", handleInboxRefresh);
    };
  }, [loadNotifications]);

  const openDetails = async (notification) => {
    setSelected(notification);
    setIsDetailOpen(true);
    if (!notification.isRead) {
      await handleMarkRead(notification._id);
      setSelected((prev) => (prev ? { ...prev, isRead: true } : prev));
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = items.filter((item) => !item.isRead).map((item) => item._id);

    try {
      await Promise.allSettled(
        unreadIds.map((id) => apiClient.patch(`/notifications/user/${id}/read`))
      );
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    dispatch(setNotificationsUnread(0));
  };

  return (
    <UserLayout>
      <PageShell
        title="Notifications"
        subtitle="Stay up to date with your learning activity."
        actions={
          unread > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors border border-yellow-400/30
                px-3 py-1.5 rounded-lg hover:bg-yellow-400/10"
            >
              Mark all read ({unread})
            </button>
          ) : null
        }
      >
        {loading && (
          <SearchPulseLoader
            label="Syncing notifications"
            sublabel="Gathering your latest activity alerts"
            compact
          />
        )}
        {!loading && error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {!loading && items.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" subtitle="You're all caught up!" />
        ) : (
          <div className="space-y-2">
            {items.map((notif, i) => (
              <NotificationCard
                key={notif._id}
                notification={notif}
                delay={i * 0.04}
                onOpen={openDetails}
              />
            ))}
          </div>
        )}

        <CommunicationDetailModal
          open={isDetailOpen}
          item={selected}
          mode="notification"
          onClose={() => setIsDetailOpen(false)}
        />
      </PageShell>
    </UserLayout>
  );
}
