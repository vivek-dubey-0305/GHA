/**
 * pages/Communication/Announcements.jsx
 */
import { useState } from "react";
import { Megaphone } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import AnnouncementCard from "../../components/CommunicationPages/AnnouncementCard";
import { mockAnnouncements } from "../../mock/dashboard";

export default function Announcements() {
  const [items, setItems] = useState(mockAnnouncements);
  const unread = items.filter((a) => !a.isRead).length;

  const handleMarkRead = (id) => {
    setItems((prev) => prev.map((a) => a._id === id ? { ...a, isRead: true } : a));
  };

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  return (
    <UserLayout>
      <PageShell
        title="Announcements"
        subtitle="Updates from your instructors and the platform."
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
          <EmptyState icon={Megaphone} title="No announcements yet" subtitle="Your instructors haven't posted anything yet." />
        ) : (
          <div className="space-y-3">
            {items.map((ann, i) => (
              <AnnouncementCard
                key={ann._id}
                announcement={ann}
                delay={i * 0.05}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
