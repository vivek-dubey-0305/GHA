// CourseLearning.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileDown,
  CalendarDays,
  Menu,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Radio,
  ClipboardCheck,
  Download,
} from "lucide-react";
import { getCourseById } from "../../redux/slices/course.slice";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";
import { apiClient } from "../../utils/api.utils";
import LearningVideoPlayer from "../../components/CoursePages/learning/LearningVideoPlayer";
import StudentLiveSessionRoom from "../../components/CoursePages/live/StudentLiveSessionRoom";

const getLessonIcon = (type) => {
  if (type === "video") return <PlayCircle className="w-4 h-4" />;
  if (type === "article") return <FileText className="w-4 h-4" />;
  if (type === "material") return <FileDown className="w-4 h-4" />;
  if (type === "live") return <Radio className="w-4 h-4" />;
  if (type === "assignment") return <ClipboardCheck className="w-4 h-4" />;
  return <BookOpen className="w-4 h-4" />;
};

const getBunnyIdFromUrl = (url = "") => {
  const guidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = String(url).match(guidPattern);
  return match ? match[0] : "";
};

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentCourse, loadingCourseDetail } = useSelector((state) => state.course);
  const { myEnrollments } = useSelector((state) => state.enrollment);
  const { user } = useSelector((state) => state.auth);

  const [activeLessonId, setActiveLessonId] = useState("");
  const [expandedModules, setExpandedModules] = useState({});
  const [resumeTime, setResumeTime] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [joiningLiveId, setJoiningLiveId] = useState("");
  const [livePlaybackByLesson, setLivePlaybackByLesson] = useState({});
  const [liveSessionStateByLesson, setLiveSessionStateByLesson] = useState({});
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
  const liveProgressMarkedRef = useRef(new Set());
  const saveMetaRef = useRef({ lastSavedAt: 0, lastSavedTime: 0, lastSeenTime: 0 });
  const saveInFlightRef = useRef(false);

  const course = useMemo(() => {
    if (!currentCourse?._id) return null;
    return String(currentCourse._id) === String(courseId) ? currentCourse : null;
  }, [currentCourse, courseId]);

  const modules = useMemo(() => {
    if (!Array.isArray(course?.modules)) return [];
    return [...course.modules].sort((a, b) => (a?.order || 0) - (b?.order || 0));
  }, [course]);

  const lessonsFlat = useMemo(() => {
    return modules.flatMap((mod, moduleIndex) => {
      const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
      const orderedLessons = [...lessons].sort((a, b) => (a?.order || 0) - (b?.order || 0));
      return orderedLessons.map((lesson, lessonIndex) => ({
        ...lesson,
        moduleId: mod?._id,
        moduleTitle: mod?.title || `Module ${moduleIndex + 1}`,
        moduleIndex,
        lessonIndex,
      }));
    });
  }, [modules]);

  const enrolledCourse = useMemo(() => {
    return myEnrollments.find((item) => String(item?.course?._id || item?.course) === String(courseId));
  }, [myEnrollments, courseId]);

  const activeLesson = useMemo(() => {
    return lessonsFlat.find((lesson) => String(lesson._id) === String(activeLessonId)) || null;
  }, [lessonsFlat, activeLessonId]);

  const activeLessonIndex = useMemo(() => {
    return lessonsFlat.findIndex((lesson) => String(lesson._id) === String(activeLessonId));
  }, [lessonsFlat, activeLessonId]);

  const canGoPrev = activeLessonIndex > 0;
  const canGoNext = activeLessonIndex >= 0 && activeLessonIndex < lessonsFlat.length - 1;

  useEffect(() => {
    dispatch(getCourseById(courseId));
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [courseId, dispatch]);

  useEffect(() => {
    if (modules.length === 0) return;
    const nextExpanded = {};
    modules.forEach((m, i) => {
      nextExpanded[m._id] = i === 0;
    });
    setExpandedModules(nextExpanded);
  }, [modules]);

  useEffect(() => {
    if (loadingCourseDetail || myEnrollments.length === 0) return;
    if (!enrolledCourse) {
      navigate(`/courses/${courseId}`, { replace: true });
    }
  }, [courseId, enrolledCourse, loadingCourseDetail, myEnrollments.length, navigate]);

  useEffect(() => {
    if (!lessonsFlat.length) return;

    const key = `gha:last-lesson:${courseId}`;
    const cachedLessonId = localStorage.getItem(key);
    const preferred =
      lessonsFlat.find((l) => String(l._id) === String(cachedLessonId)) ||
      lessonsFlat.find((l) => l.type === "video") ||
      lessonsFlat[0];

    if (preferred && !activeLessonId) {
      setActiveLessonId(String(preferred._id));
    }
  }, [activeLessonId, courseId, lessonsFlat]);

  useEffect(() => {
    if (!activeLessonId) return;
    localStorage.setItem(`gha:last-lesson:${courseId}`, String(activeLessonId));
  }, [activeLessonId, courseId]);

  useEffect(() => {
    saveMetaRef.current = { lastSavedAt: 0, lastSavedTime: 0, lastSeenTime: 0 };
    saveInFlightRef.current = false;
  }, [activeLesson?._id]);

  useEffect(() => {
    const loadLessonProgress = async () => {
      if (!activeLesson?._id) return;

      const localTime = Number(localStorage.getItem(`gha:lesson-time:${courseId}:${activeLesson._id}`) || 0);
      setResumeTime(localTime);

      try {
        const res = await apiClient.get(`/progress/lesson/${activeLesson._id}`);
        const progress = res?.data?.data || {};
        const remoteTime = Number(progress?.videoProgress?.currentTime || 0);
        const bestTime = Math.max(localTime, remoteTime);
        setResumeTime(bestTime);
      } catch {
        setResumeTime(localTime);
      }
    };

    loadLessonProgress();
  }, [activeLesson?._id, courseId]);

  const persistProgress = useCallback(
    async ({ force = false, currentTime = 0, duration = 0, progressPercentage, activityProgress } = {}) => {
      if (!activeLesson?._id) return;

      const isVideoLesson = activeLesson.type === "video";
      if (!isVideoLesson && !force) return;
      if (saveInFlightRef.current && !force) return;

      const now = Date.now();
      const roundedTime = Math.max(0, Math.floor(currentTime));
      const lastSavedAt = saveMetaRef.current.lastSavedAt;
      const lastSavedTime = saveMetaRef.current.lastSavedTime;
      const deltaTime = Math.max(0, roundedTime - lastSavedTime);
      saveMetaRef.current.lastSeenTime = roundedTime;

      if (isVideoLesson && !force) {
        if (now - lastSavedAt < 10000) return;
        if (Math.abs(roundedTime - lastSavedTime) < 5) return;
      }

      saveInFlightRef.current = true;
      setSavingProgress(true);
      try {
        const payload = {
          progressPercentage,
          activityProgress,
          timeSpent: isVideoLesson ? deltaTime : 0,
          videoProgress: isVideoLesson
            ? {
                currentTime: roundedTime,
                totalDuration: Math.floor(duration || 0),
              }
            : undefined,
        };

        await apiClient.post(`/progress/lesson/${activeLesson._id}`, payload);

        saveMetaRef.current = { lastSavedAt: now, lastSavedTime: roundedTime, lastSeenTime: roundedTime };
        localStorage.setItem(`gha:lesson-time:${courseId}:${activeLesson._id}`, String(roundedTime));
      } catch {
        // Best-effort sync: avoid bubbling frequent transient API failures to global unhandled rejection handler.
      } finally {
        saveInFlightRef.current = false;
        setSavingProgress(false);
      }
    },
    [activeLesson, courseId]
  );

  const handleLessonEnded = useCallback(async () => {
    if (!activeLesson?._id) return;

    try {
      await persistProgress({
        force: true,
        currentTime: saveMetaRef.current.lastSeenTime,
        progressPercentage: 100,
      });
      await apiClient.patch(`/progress/lesson/${activeLesson._id}/complete`);
    } catch {
      // no-op: completion is best-effort while still allowing user navigation
    }

    if (canGoNext) {
      const nextLesson = lessonsFlat[activeLessonIndex + 1];
      if (nextLesson) {
        setActiveLessonId(String(nextLesson._id));
      }
    }
  }, [activeLesson, activeLessonIndex, canGoNext, lessonsFlat, persistProgress]);

  useEffect(() => {
    return () => {
      persistProgress({ force: true, currentTime: saveMetaRef.current.lastSeenTime || saveMetaRef.current.lastSavedTime });
    };
  }, [persistProgress]);

  useEffect(() => {
    if (!activeLesson?._id || activeLesson.type !== "article") return;

    persistProgress({
      force: true,
      progressPercentage: 20,
      activityProgress: { articleOpened: true },
    });
  }, [activeLesson?._id, activeLesson?.type, persistProgress]);

  const handleDownloadMaterial = async (materialId, fileUrl) => {
    if (!materialId || !fileUrl) return;
    try {
      await persistProgress({
        force: true,
        progressPercentage: 100,
        activityProgress: { materialViewed: true, materialDownloaded: true },
      });
      await apiClient.patch(`/materials/${materialId}/download`);
    } finally {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleJoinLiveClass = async (lesson) => {
    const liveId = lesson?.liveClassId?._id;
    if (!liveId) return;

    setJoiningLiveId(String(liveId));
    try {
      const res = await apiClient.post(`/live-classes/${liveId}/join`);
      const responseData = res?.data?.data || {};
      const hls =
        responseData?.signedPlayback?.hls ||
        lesson?.liveClassId?.signedPlayback?.hls ||
        lesson?.liveClassId?.playbackUrl ||
        "";

      setLiveSessionStateByLesson((prev) => ({
        ...prev,
        [lesson._id]: {
          joined: true,
          broadcastStarted: !!responseData.broadcastStarted,
          waitingForHost: !!responseData.waitingForHost,
          sessionEnded: responseData.status === "completed",
          attendanceEligibleNow: !!responseData.attendanceEligibleNow,
          totalOnline: Number(responseData.totalOnline || 0),
          summary: responseData.summary || null,
        },
      }));

      if (hls) {
        setLivePlaybackByLesson((prev) => ({ ...prev, [lesson._id]: hls }));
      }

      setActiveLessonId(String(lesson._id));

      if (responseData.attendanceEligibleNow && !liveProgressMarkedRef.current.has(String(lesson._id))) {
        await persistProgress({
          force: true,
          progressPercentage: 40,
          activityProgress: { liveJoined: true },
        });
        liveProgressMarkedRef.current.add(String(lesson._id));
      }
    } finally {
      setJoiningLiveId("");
    }
  };

  const activeLessonLiveState = useMemo(() => {
    if (!activeLesson?._id || activeLesson.type !== "live") return null;
    return liveSessionStateByLesson[activeLesson._id] || null;
  }, [activeLesson?._id, activeLesson?.type, liveSessionStateByLesson]);

  const updateLessonLiveState = useCallback((lessonId, patch) => {
    if (!lessonId || !patch) return;
    setLiveSessionStateByLesson((prev) => ({
      ...prev,
      [lessonId]: {
        ...(prev[lessonId] || {}),
        ...patch,
      },
    }));
  }, []);

  const handleOpenAssignment = useCallback(() => {
    persistProgress({
      force: true,
      progressPercentage: 25,
      activityProgress: { assignmentStarted: true },
    });
  }, [persistProgress]);

  useEffect(() => {
    if (!activeLesson?._id || activeLesson.type !== "live") return;

    const state = liveSessionStateByLesson[activeLesson._id];
    if (!state?.broadcastStarted || liveProgressMarkedRef.current.has(String(activeLesson._id))) return;

    persistProgress({
      force: true,
      progressPercentage: 40,
      activityProgress: { liveJoined: true },
    }).finally(() => {
      liveProgressMarkedRef.current.add(String(activeLesson._id));
    });
  }, [activeLesson?._id, activeLesson?.type, liveSessionStateByLesson, persistProgress]);

  useEffect(() => {
    if (!activeLesson?._id || activeLesson.type !== "live") return;

    const state = liveSessionStateByLesson[activeLesson._id];
    if (!state?.sessionEnded || !liveProgressMarkedRef.current.has(String(activeLesson._id))) return;

    persistProgress({
      force: true,
      progressPercentage: 100,
      activityProgress: { liveJoined: true, liveAttended: true },
    });
  }, [activeLesson?._id, activeLesson?.type, liveSessionStateByLesson, persistProgress]);

  const handleMarkArticleComplete = useCallback(async () => {
    if (!activeLesson?._id || activeLesson.type !== "article") return;

    try {
      setSavingProgress(true);
      await apiClient.patch(`/progress/lesson/${activeLesson._id}/complete`);
      await dispatch(getMyEnrollments({ page: 1, limit: 100 }));
    } finally {
      setSavingProgress(false);
    }
  }, [activeLesson?._id, activeLesson?.type, dispatch]);

  const activeSourceUrl = useMemo(() => {
    if (!activeLesson) return "";

    if (activeLesson.type === "video") {
      const directUrl = activeLesson?.videoId?.url || "";
      if (directUrl) return directUrl;

      const bunnyId =
        activeLesson?.videoId?.bunnyVideoId ||
        getBunnyIdFromUrl(activeLesson?.videoId?.secure_url || activeLesson?.videoId?.url || "");

      if (bunnyId) {
        const streamHost = activeLesson?.videoId?.url?.match(/https:\/\/([^/]+)\//)?.[1];
        if (streamHost) return `https://${streamHost}/${bunnyId}/playlist.m3u8`;
      }
    }

    if (activeLesson.type === "live") {
      return livePlaybackByLesson[activeLesson._id] || "";
    }

    return "";
  }, [activeLesson, livePlaybackByLesson]);

  const activeLiveState = activeLessonLiveState;

  if (loadingCourseDetail || !course) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-gray-300 flex items-center justify-center">
        Loading learning environment...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#f4f4f2]">
      <header className="sticky top-0 z-40 bg-[#101010]/95 backdrop-blur border-b border-gray-800">
        <div className="px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/dashboard/courses")}
              className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> My Courses
            </button>
            <div className="hidden sm:block h-5 w-px bg-gray-700" />
            <p className="truncate text-sm sm:text-base font-semibold">{course.title}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs border border-yellow-400/30 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
              {enrolledCourse?.progressPercentage || 0}% complete
            </span>
            <button
              onClick={() => setMobileCurriculumOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg border border-gray-700 text-gray-300"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="grid lg:grid-cols-[320px_1fr] min-h-[calc(100vh-64px)]">
        <aside
          className={`border-r border-gray-800 bg-[#111] overflow-auto ${
            mobileCurriculumOpen ? "block" : "hidden"
          } lg:block`}
        >
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-sm">Course Content</h2>
            <p className="text-xs text-gray-500 mt-1">{lessonsFlat.length} lessons across {modules.length} modules</p>
          </div>

          <div className="p-3 space-y-2">
            {modules.map((mod, idx) => {
              const moduleLessons = lessonsFlat.filter((l) => String(l.moduleId) === String(mod._id));
              const isOpen = !!expandedModules[mod._id];
              return (
                <div key={mod._id || idx} className="border border-gray-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedModules((prev) => ({ ...prev, [mod._id]: !prev[mod._id] }))}
                    className="w-full text-left px-3 py-2.5 bg-[#161616] hover:bg-[#1c1c1c]"
                  >
                    <p className="text-sm font-medium truncate">{mod.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{moduleLessons.length} lessons</p>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-gray-800/80">
                      {moduleLessons.map((lesson) => {
                        const active = String(lesson._id) === String(activeLessonId);
                        return (
                          <button
                            key={lesson._id}
                            onClick={() => {
                              setActiveLessonId(String(lesson._id));
                              setMobileCurriculumOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 transition-colors ${
                              active ? "bg-yellow-400/10" : "hover:bg-[#1b1b1b]"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 ${active ? "text-yellow-400" : "text-gray-500"}`}>{getLessonIcon(lesson.type)}</span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm truncate ${active ? "text-yellow-300" : "text-gray-200"}`}>{lesson.title}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{lesson.type}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="p-4 sm:p-6 space-y-5 bg-[#0e0e0e]">
          {activeLesson ? (
            <>
              <div className="rounded-2xl border border-gray-800 bg-[#111] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">{activeLesson.moduleTitle}</p>
                    <h1 className="text-lg sm:text-xl font-semibold mt-1">{activeLesson.title}</h1>
                  </div>
                  <div className="text-xs text-gray-500">{savingProgress ? "Saving progress..." : "Progress synced"}</div>
                </div>
              </div>

              {activeLesson.type === "video" && (
                <LearningVideoPlayer
                  sourceUrl={activeSourceUrl}
                  title={activeLesson.title}
                  poster={activeLesson?.thumbnail?.secure_url || course?.thumbnail?.secure_url || ""}
                  startAt={resumeTime}
                  onProgress={(payload) => persistProgress(payload)}
                  onEnded={handleLessonEnded}
                />
              )}

              {activeLesson.type === "article" && (
                <article className="rounded-2xl border border-gray-800 bg-[#111] p-5 sm:p-6">
                  <h3 className="text-base font-semibold mb-3">Article Lesson</h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-7">
                    {activeLesson?.content?.articleContent || "No article content available for this lesson."}
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={handleMarkArticleComplete}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Complete
                    </button>
                  </div>
                </article>
              )}

              {activeLesson.type === "material" && (
                <div className="rounded-2xl border border-gray-800 bg-[#111] p-5 sm:p-6">
                  <h3 className="text-base font-semibold">Downloadable Resource</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Access source files, notes, templates, and supporting material for this lesson.
                  </p>
                  <button
                    onClick={() => handleDownloadMaterial(activeLesson?.materialId?._id, activeLesson?.materialId?.fileUrl)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300"
                  >
                    <Download className="w-4 h-4" /> Download Resource
                  </button>
                </div>
              )}

              {activeLesson.type === "live" && (
                <div className="rounded-2xl border border-gray-800 bg-[#111] p-5 sm:p-6">
                  <h3 className="text-base font-semibold">Live Class Session</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Join the instructor session, interact live, and revisit recordings from your learning dashboard.
                  </p>

                  <div className="mt-3 text-sm text-gray-300 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-yellow-400" />
                    {activeLesson?.liveClassId?.scheduledAt
                      ? new Date(activeLesson.liveClassId.scheduledAt).toLocaleString()
                      : "Schedule will be announced"}
                  </div>

                  <button
                    onClick={() => handleJoinLiveClass(activeLesson)}
                    disabled={joiningLiveId === String(activeLesson?.liveClassId?._id)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300 disabled:opacity-70"
                  >
                    <Radio className="w-4 h-4" />
                    {joiningLiveId === String(activeLesson?.liveClassId?._id)
                      ? "Joining..."
                      : activeLiveState?.joined
                      ? "Rejoin Live Class"
                      : "Join Live Class"}
                  </button>

                  {!!activeLiveState?.joined && (
                    <div className="mt-3 text-xs text-gray-400">
                      {activeLiveState?.sessionEnded
                        ? "This live session has ended."
                        : activeLiveState?.waitingForHost
                        ? "Waiting for instructor to start broadcasting..."
                        : "Live now"}
                      {Number.isFinite(activeLiveState?.totalOnline)
                        ? ` • ${activeLiveState.totalOnline} joined`
                        : ""}
                    </div>
                  )}

                  {activeLiveState?.joined && activeLiveState?.waitingForHost && !activeLiveState?.sessionEnded && (
                    <div className="mt-5 rounded-xl border border-dashed border-gray-700 bg-[#0f0f0f] p-6 text-sm text-gray-300">
                      Instructor has not started the live broadcast yet. Keep this page open and the stream will start automatically.
                    </div>
                  )}

                  {activeLiveState?.sessionEnded && (
                    <div className="mt-5 rounded-xl border border-gray-700 bg-[#0f0f0f] p-6 text-sm text-gray-300">
                      Live session ended.
                      {activeLiveState?.summary?.durationSeconds
                        ? ` Duration: ${Math.floor(activeLiveState.summary.durationSeconds / 60)} minutes.`
                        : ""}
                    </div>
                  )}

                  {activeSourceUrl && activeLiveState?.broadcastStarted && !activeLiveState?.sessionEnded && (
                    <div className="mt-5">
                      <StudentLiveSessionRoom
                        lesson={activeLesson}
                        user={user}
                        sourceUrl={activeSourceUrl}
                        liveState={activeLiveState}
                        updateLessonLiveState={updateLessonLiveState}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeLesson.type === "assignment" && (
                <div className="rounded-2xl border border-gray-800 bg-[#111] p-5 sm:p-6">
                  <h3 className="text-base font-semibold">Assignment Lesson</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Complete this assignment from your dashboard assignments workspace.
                  </p>
                  <Link
                    to="/dashboard/assignments"
                    onClick={handleOpenAssignment}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:border-gray-500"
                  >
                    Open Assignments
                  </Link>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-[#111] p-4">
                <button
                  disabled={!canGoPrev}
                  onClick={() => setActiveLessonId(String(lessonsFlat[activeLessonIndex - 1]._id))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="text-xs text-gray-500">
                  Lesson {Math.max(activeLessonIndex + 1, 0)} of {lessonsFlat.length}
                </div>

                <button
                  disabled={!canGoNext}
                  onClick={() => setActiveLessonId(String(lessonsFlat[activeLessonIndex + 1]._id))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-400 text-black font-semibold disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-[#111] p-4">
                <h4 className="text-sm font-semibold mb-3">Lesson Details</h4>
                
                {activeLesson.type === "video" && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activeLesson?.content?.videoDescription || activeLesson?.description || "This video lesson covers important course material. Watch carefully and refer to your notes."}
                  </p>
                )}

                {activeLesson.type === "article" && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activeLesson?.description || activeLesson?.content?.articleDescription || "Read through this article carefully to understand the concepts covered in this section."}
                  </p>
                )}

                {activeLesson.type === "live" && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activeLesson?.liveClassId?.description || activeLesson?.description || "Join this live session to interact directly with the instructor. You'll have the opportunity to ask questions and get real-time feedback."}
                  </p>
                )}

                {activeLesson.type === "material" && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activeLesson?.materialId?.description || activeLesson?.description || "Download the provided resources to supplement your learning. These materials include source files, templates, and supporting documents."}
                  </p>
                )}

                {activeLesson.type === "assignment" && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activeLesson?.description || "Complete this assignment to practice the concepts you've learned. Your work will help reinforce your understanding."}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-800 bg-[#111] p-8 text-center text-gray-500">
              No lesson is available in this course yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
