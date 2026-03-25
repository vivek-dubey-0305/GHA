/**
 * pages/Communication/Notifications.jsx
 */
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import NotificationCard from "../../components/CommunicationPages/NotificationCard";
import { apiClient } from "../../utils/api.utils";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const unread = items.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/notifications/user/my?limit=100");
      setItems(res?.data?.data?.notifications || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/user/${id}/read`);
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

    setItems((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/notifications/user/read-all");
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
        {loading && <p className="text-gray-500 text-sm py-2">Loading notifications...</p>}
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
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
