/**
 * pages/Communication/Notifications.jsx
 */
import { useState } from "react";
import { Bell } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import NotificationCard from "../../components/CommunicationPages/NotificationCard";
import { mockNotifications } from "../../mock/dashboard";

export default function Notifications() {
  const [items, setItems] = useState(mockNotifications);
  const unread = items.filter((n) => !n.isRead).length;

  const handleMarkRead = (id) => {
    setItems((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = () => {
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
        {items.length === 0 ? (
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
