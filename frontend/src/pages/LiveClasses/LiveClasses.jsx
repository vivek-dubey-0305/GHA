/**
 * pages/LiveClasses/LiveClasses.jsx
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Video } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState } from "../../components/DashboardPages/DashboardUI";
import LiveClassCard from "../../components/LiveClassPages/LiveClassCard";
import { LIVE_CLASS_TABS } from "../../constants/dashboard.constants";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";
import { apiClient } from "../../utils/api.utils";

export default function LiveClasses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myEnrollments } = useSelector((state) => state.enrollment);

  const [activeTab, setActiveTab] = useState("Upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  const loadLiveClasses = useCallback(async () => {
    const enrollments = (myEnrollments || []).filter((e) => ["active", "completed"].includes(e?.status));
    const courseIds = enrollments.map((e) => String(e?.course?._id || e?.course)).filter(Boolean);

    if (courseIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all(courseIds.map((courseId) => apiClient.get(`/courses/${courseId}`)));
      const courseMap = new Map(
        enrollments.map((e) => [String(e?.course?._id || e?.course), e?.course])
      );

      const liveLessons = responses.flatMap((res) => {
        const course = res?.data?.data;
        const modules = Array.isArray(course?.modules) ? course.modules : [];

        return modules.flatMap((mod) => {
          const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
          return lessons
            .filter((lesson) => lesson?.type === "live" && lesson?.liveClassId)
            .map((lesson) => {
              const live = lesson.liveClassId;
              const normalizedStatus = live?.status === "ended" ? "completed" : (live?.status || "scheduled");
              return {
                _id: String(live?._id || lesson._id),
                lessonId: String(lesson?._id),
                courseId: String(course?._id),
                title: live?.title || lesson?.title,
                instructor: live?.instructor || courseMap.get(String(course?._id))?.instructor,
                course: courseMap.get(String(course?._id)) || { _id: course?._id, title: course?.title },
                sessionType: live?.sessionType || "live",
                scheduledAt: live?.scheduledAt,
                duration: live?.duration || 60,
                status: normalizedStatus,
                actualParticipants: live?.actualParticipants || 0,
                maxParticipants: live?.maxParticipants || 0,
                recordingAvailable: Boolean(live?.signedPlayback?.hls || live?.playbackUrl),
              };
            });
        });
      });

      setItems(liveLessons.sort((a, b) => new Date(a?.scheduledAt || 0) - new Date(b?.scheduledAt || 0)));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load live classes.");
    } finally {
      setLoading(false);
    }
  }, [myEnrollments]);

  useEffect(() => {
    loadLiveClasses();
  }, [loadLiveClasses]);

  const filtered = useMemo(() => {
    if (activeTab === "Upcoming") {
      return items.filter((lc) => lc.status === "scheduled" || lc.status === "live");
    }
    return items.filter((lc) => lc.status === "completed");
  }, [activeTab, items]);

  const handleJoin = useCallback(async (liveClass) => {
    if (!liveClass?._id || !liveClass?.courseId) return;

    try {
      await apiClient.post(`/live-classes/${liveClass._id}/join`);
    } catch {
      // Best effort, navigation still allowed.
    }

    if (liveClass.lessonId) {
      localStorage.setItem(`gha:last-lesson:${liveClass.courseId}`, liveClass.lessonId);
    }
    navigate(`/dashboard/learn/${liveClass.courseId}`);
  }, [navigate]);

  const handleWatch = useCallback((liveClass) => {
    if (!liveClass?.courseId) return;
    if (liveClass.lessonId) {
      localStorage.setItem(`gha:last-lesson:${liveClass.courseId}`, liveClass.lessonId);
    }
    navigate(`/dashboard/learn/${liveClass.courseId}`);
  }, [navigate]);

  return (
    <UserLayout>
      <PageShell
        title="Live Classes"
        subtitle="Join upcoming sessions or re-watch past recordings."
      >
        <TabBar tabs={LIVE_CLASS_TABS} active={activeTab} onChange={setActiveTab} />

        {loading && <p className="text-gray-500 text-sm py-4">Loading live classes...</p>}
        {!loading && error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {!loading && filtered.length === 0 ? (
          <EmptyState
            icon={Video}
            title={activeTab === "Upcoming" ? "No upcoming classes" : "No recordings yet"}
            subtitle="Check back later or explore other courses."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((lc, i) => (
              <LiveClassCard
                key={lc._id}
                liveClass={lc}
                delay={i * 0.05}
                onJoin={() => handleJoin(lc)}
                onWatch={() => handleWatch(lc)}
              />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
