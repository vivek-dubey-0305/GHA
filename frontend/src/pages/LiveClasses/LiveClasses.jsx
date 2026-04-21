/**
 * pages/LiveClasses/LiveClasses.jsx
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Video, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState } from "../../components/DashboardPages/DashboardUI";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import LiveClassCard from "../../components/LiveClassPages/LiveClassCard";
import StudentLiveSessionRoom from "../../components/CoursePages/live/StudentLiveSessionRoom";
import { LIVE_CLASS_TABS } from "../../constants/dashboard.constants";
import { apiClient } from "../../utils/api.utils";

export default function LiveClasses() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoJoinHandledRef = useRef("");
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("Upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderChannel, setReminderChannel] = useState("email");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderStatus, setReminderStatus] = useState("");
  const [roomTarget, setRoomTarget] = useState(null);
  const [roomLesson, setRoomLesson] = useState(null);
  const [roomSourceUrl, setRoomSourceUrl] = useState("");
  const [roomLiveState, setRoomLiveState] = useState(null);
  const [roomError, setRoomError] = useState("");

  const loadLiveClasses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const userLiveRes = await apiClient.get("/live-classes/my-user");

      const directLiveClasses = (userLiveRes?.data?.data?.liveClasses || []).map((liveClass) => {
        const normalizedStatus = liveClass?.status === "ended" ? "completed" : (liveClass?.status || "scheduled");
        const courseId = String(liveClass?.course?._id || liveClass?.course || "");
        const instructorObj = typeof liveClass?.instructor === "object" && liveClass?.instructor
          ? liveClass.instructor
          : null;

        return {
          _id: String(liveClass?._id),
          lessonId: liveClass?.lesson?._id ? String(liveClass.lesson._id) : "",
          courseId,
          title: liveClass?.title,
          instructor: instructorObj,
          course: liveClass?.course || null,
          sessionType: liveClass?.sessionType || "live",
          scheduledAt: liveClass?.scheduledAt,
          duration: liveClass?.duration || 60,
          status: normalizedStatus,
          actualParticipants: liveClass?.actualParticipants || 0,
          maxParticipants: liveClass?.maxParticipants || 0,
          recordingAvailable: Boolean(liveClass?.recordingAvailable || liveClass?.cfVideoUID || liveClass?.signedPlayback?.hls || liveClass?.playbackUrl),
        };
      });

      setItems(directLiveClasses.sort((a, b) => new Date(a?.scheduledAt || 0) - new Date(b?.scheduledAt || 0)));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load live classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveClasses();
  }, [loadLiveClasses]);

  useEffect(() => {
    const handleRealtimeRefresh = () => {
      loadLiveClasses();
    };

    window.addEventListener("gha:inbox:refresh", handleRealtimeRefresh);
    return () => window.removeEventListener("gha:inbox:refresh", handleRealtimeRefresh);
  }, [loadLiveClasses]);

  const filtered = useMemo(() => {
    const nowMs = Date.now();

    if (activeTab === "Active") {
      return items.filter((lc) => lc.status === "live");
    }

    if (activeTab === "Upcoming") {
      return items.filter((lc) => {
        if (lc.status !== "scheduled") return false;
        const ts = new Date(lc?.scheduledAt || 0).getTime();
        return Number.isFinite(ts) && ts >= nowMs;
      });
    }

    if (activeTab === "Expired") {
      return items.filter((lc) => {
        if (lc.status === "completed") return false;
        if (lc.status === "live") return false;
        const ts = new Date(lc?.scheduledAt || 0).getTime();
        return Number.isFinite(ts) && ts < nowMs;
      });
    }

    return items.filter((lc) => lc.status === "completed");
  }, [activeTab, items]);

  const closeRoom = useCallback(() => {
    setRoomTarget(null);
    setRoomLesson(null);
    setRoomSourceUrl("");
    setRoomLiveState(null);
    setRoomError("");
  }, []);

  const openDirectRoom = useCallback(async (liveClass) => {
    setRoomError("");
    try {
      const res = await apiClient.post(`/live-classes/${liveClass._id}/join`);
      const responseData = res?.data?.data || {};
      const hls = responseData?.signedPlayback?.hls || "";
      const syntheticLesson = {
        _id: `direct-live-${liveClass._id}`,
        title: liveClass?.title || "Live Session",
        type: "live",
        liveClassId: {
          _id: liveClass._id,
          scheduledAt: liveClass?.scheduledAt,
          description: liveClass?.description,
        },
      };

      setRoomTarget(liveClass);
      setRoomLesson(syntheticLesson);
      setRoomSourceUrl(hls);
      setRoomLiveState({
        joined: true,
        broadcastStarted: !!responseData.broadcastStarted,
        waitingForHost: !!responseData.waitingForHost,
        sessionEnded: responseData.status === "completed",
        attendanceEligibleNow: !!responseData.attendanceEligibleNow,
        totalOnline: Number(responseData.totalOnline || 0),
        summary: responseData.summary || null,
      });
    } catch (err) {
      setRoomError(err?.response?.data?.message || "Unable to join this session.");
    }
  }, []);

  const updateDirectLiveState = useCallback((lessonId, patch) => {
    if (!roomLesson?._id || lessonId !== roomLesson._id || !patch) return;
    setRoomLiveState((prev) => ({
      ...(prev || {}),
      ...patch,
    }));
  }, [roomLesson]);

  const handleJoin = useCallback(async (liveClass) => {
    if (!liveClass?._id) return;

    if (liveClass.lessonId && liveClass.courseId) {
      try {
        await apiClient.post(`/live-classes/${liveClass._id}/join`);
      } catch {
        // Best effort, navigation still allowed.
      }

      localStorage.setItem(`gha:last-lesson:${liveClass.courseId}`, liveClass.lessonId);
      navigate(`/dashboard/learn/${liveClass.courseId}`);
      return;
    }

    await openDirectRoom(liveClass);
  }, [navigate, openDirectRoom]);

  useEffect(() => {
    const joinLiveClassId = searchParams.get("joinLiveClassId");
    if (!joinLiveClassId || loading || !items.length) return;
    if (autoJoinHandledRef.current === joinLiveClassId) return;

    const target = items.find((item) => String(item._id) === String(joinLiveClassId));
    if (!target) return;

    autoJoinHandledRef.current = joinLiveClassId;
    handleJoin(target).finally(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("joinLiveClassId");
      setSearchParams(next, { replace: true });
    });
  }, [handleJoin, items, loading, searchParams, setSearchParams]);

  const handleOpenReminder = useCallback((liveClass) => {
    setReminderTarget(liveClass);
    setReminderChannel("email");
    setReminderStatus("");
  }, []);

  const handleSaveReminder = useCallback(async () => {
    if (!reminderTarget?._id) return;

    setReminderSaving(true);
    setReminderStatus("");
    try {
      await apiClient.post(`/live-classes/${reminderTarget._id}/reminders`, {
        channel: reminderChannel,
      });
      setReminderStatus(`Reminder saved via ${reminderChannel}. We will notify you at 30 and 5 minutes before class.`);
      setTimeout(() => {
        setReminderTarget(null);
        setReminderStatus("");
      }, 1100);
    } catch (err) {
      setReminderStatus(err?.response?.data?.message || "Failed to save reminder.");
    } finally {
      setReminderSaving(false);
    }
  }, [reminderChannel, reminderTarget]);

  const handleWatch = useCallback(async (liveClass) => {
    if (liveClass?.lessonId && liveClass?.courseId) {
      localStorage.setItem(`gha:last-lesson:${liveClass.courseId}`, liveClass.lessonId);
      navigate(`/dashboard/learn/${liveClass.courseId}`);
      return;
    }

    await openDirectRoom(liveClass);
  }, [navigate, openDirectRoom]);

  return (
    <UserLayout>
      <PageShell
        title="Live Classes"
        subtitle="Join upcoming sessions or re-watch past recordings."
      >
        <TabBar tabs={LIVE_CLASS_TABS} active={activeTab} onChange={setActiveTab} />

        {loading && (
          <SearchPulseLoader
            label="Loading live classes"
            sublabel="Matching sessions and recordings to your courses"
            compact
          />
        )}
        {!loading && error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {!loading && filtered.length === 0 ? (
          <EmptyState
            icon={Video}
            title={
              activeTab === "Upcoming"
                ? "No upcoming classes"
                : activeTab === "Expired"
                  ? "No expired classes"
                  : activeTab === "Active"
                    ? "No active classes"
                    : "No recordings yet"
            }
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
                onSetReminder={() => handleOpenReminder(lc)}
              />
            ))}
          </div>
        )}

        {reminderTarget && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-white font-semibold text-base">Set Class Reminder</h3>
                <p className="text-gray-500 text-sm mt-1">{reminderTarget.title}</p>
                <p className="text-gray-600 text-xs mt-1">Static options for now. Delivery integration will be added later.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <input
                    type="radio"
                    name="reminder-channel"
                    value="email"
                    checked={reminderChannel === "email"}
                    onChange={(e) => setReminderChannel(e.target.value)}
                  />
                  Email
                </label>
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <input
                    type="radio"
                    name="reminder-channel"
                    value="whatsapp"
                    checked={reminderChannel === "whatsapp"}
                    onChange={(e) => setReminderChannel(e.target.value)}
                  />
                  WhatsApp
                </label>
              </div>

              {reminderStatus && (
                <p className={`text-sm ${reminderStatus.toLowerCase().includes("failed") ? "text-red-400" : "text-green-400"}`}>
                  {reminderStatus}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-gray-300 border border-gray-700 rounded-lg hover:border-gray-500"
                  onClick={() => setReminderTarget(null)}
                  disabled={reminderSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-black bg-yellow-400 rounded-lg hover:bg-yellow-300 disabled:opacity-70"
                  onClick={handleSaveReminder}
                  disabled={reminderSaving}
                >
                  {reminderSaving ? "Saving..." : "Save Reminder"}
                </button>
              </div>
            </div>
          </div>
        )}

        {roomTarget && (
          <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto bg-[#111] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-white font-semibold text-base">{roomTarget?.title || "Live Session"}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {roomTarget?.course?.title || "Instant doubt session"}
                  </p>
                </div>
                <button
                  type="button"
                  className="h-9 w-9 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 inline-flex items-center justify-center"
                  onClick={closeRoom}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {roomError && <p className="text-sm text-red-400">{roomError}</p>}

              {roomLesson && roomLiveState && roomLiveState.joined && roomSourceUrl && (
                <StudentLiveSessionRoom
                  lesson={roomLesson}
                  user={user}
                  sourceUrl={roomSourceUrl}
                  liveState={roomLiveState}
                  updateLessonLiveState={updateDirectLiveState}
                />
              )}

              {roomLesson && roomLiveState && roomLiveState.joined && !roomSourceUrl && (
                <div className="rounded-xl border border-dashed border-gray-700 bg-[#0f0f0f] p-6 text-sm text-gray-300">
                  {roomLiveState.sessionEnded
                    ? "Session has ended and recording is not ready yet."
                    : "Instructor has not started broadcasting yet. Keep this window open and stream will begin automatically."}
                </div>
              )}
            </div>
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
