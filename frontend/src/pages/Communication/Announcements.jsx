/**
 * pages/Communication/Announcements.jsx
 */
import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import AnnouncementCard from "../../components/CommunicationPages/AnnouncementCard";
import { apiClient } from "../../utils/api.utils";

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const unread = items.filter((a) => !a.isRead).length;

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/announcements/user/my?limit=100");
      setItems(res?.data?.data?.announcements || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.patch(`/announcements/user/${id}/read`);
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

    setItems((prev) => prev.map((a) => a._id === id ? { ...a, isRead: true } : a));
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/announcements/user/read-all");
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

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
        {loading && <p className="text-gray-500 text-sm py-2">Loading announcements...</p>}
        {!loading && error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {!loading && items.length === 0 ? (
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
