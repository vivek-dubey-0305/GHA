/**
 * pages/Communication/Announcements.jsx
 */
import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { useDispatch } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import AnnouncementCard from "../../components/CommunicationPages/AnnouncementCard";
import CommunicationDetailModal from "../../components/CommunicationPages/CommunicationDetailModal";
import { setAnnouncementsUnread } from "../../redux/slices/communication.slice";
import { apiClient } from "../../utils/api.utils";

export default function Announcements() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const unread = items.filter((a) => !a.isRead).length;

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/announcements/user/my?limit=100");
      const list = res?.data?.data?.announcements || [];
      setItems(list);
      dispatch(setAnnouncementsUnread(list.filter((item) => !item.isRead).length));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    const handleIncoming = () => {
      loadAnnouncements();
    };

    const handleInboxRefresh = () => {
      loadAnnouncements();
    };

    window.addEventListener("gha:announcement:new", handleIncoming);
    window.addEventListener("gha:inbox:refresh", handleInboxRefresh);
    return () => {
      window.removeEventListener("gha:announcement:new", handleIncoming);
      window.removeEventListener("gha:inbox:refresh", handleInboxRefresh);
    };
  }, [loadAnnouncements]);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.patch(`/announcements/user/${id}/read`);
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

    setItems((prev) => {
      const next = prev.map((a) => a._id === id ? { ...a, isRead: true } : a);
      dispatch(setAnnouncementsUnread(next.filter((item) => !item.isRead).length));
      return next;
    });
    setSelected((prev) => (prev?._id === id ? { ...prev, isRead: true } : prev));
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/announcements/user/read-all");
    } catch {
      // Keep optimistic local UI even on transient failures.
    }

    setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
    dispatch(setAnnouncementsUnread(0));
  };

  const openDetails = async (announcement) => {
    setSelected(announcement);
    setIsDetailOpen(true);
    if (!announcement.isRead) {
      await handleMarkRead(announcement._id);
    }
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
        {loading && (
          <SearchPulseLoader
            label="Fetching announcements"
            sublabel="Loading instructor and platform updates"
            compact
          />
        )}
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
                onOpen={openDetails}
              />
            ))}
          </div>
        )}

        <CommunicationDetailModal
          open={isDetailOpen}
          item={selected}
          mode="announcement"
          onClose={() => setIsDetailOpen(false)}
        />
      </PageShell>
    </UserLayout>
  );
}
