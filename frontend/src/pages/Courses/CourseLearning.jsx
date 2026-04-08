// CourseLearning.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Link as LinkIcon,
  Upload,
} from "lucide-react";
import { getCourseById } from "../../redux/slices/course.slice";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";
import { apiClient } from "../../utils/api.utils";
import { formatDuration, getLessonDurationMinutes, getModuleDurationMinutes } from "../../utils/format.utils";
import LearningVideoPlayer from "../../components/CoursePages/learning/LearningVideoPlayer";
import StudentLiveSessionRoom from "../../components/CoursePages/live/StudentLiveSessionRoom";
import RichContentRenderer from "../../components/common/RichContentRenderer";

const DEBUG_GRADING_ENABLED = String(import.meta.env.VITE_DEBUG_GRADING || "").toLowerCase() === "true";

const gradingDebug = (stage, payload = {}) => {
  if (!DEBUG_GRADING_ENABLED) return;
  console.debug(`🧪 ===[AUTO_GRADER_UI]=== [${stage}]`, payload);
};

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

const normalize = (value) => String(value || "").trim().toLowerCase();

const evaluateQuestionCorrectness = (question, answer, questionType) => {
  if (questionType === "mcq") {
    const correct = Array.isArray(question?.correctAnswers) && question.correctAnswers.length > 0
      ? question.correctAnswers
      : [question?.correctAnswer].filter(Boolean);
    const correctSet = new Set(correct.map(normalize));
    const answerValues = Array.isArray(answer)
      ? answer.map((item) => String(item))
      : (String(answer || "").trim() ? [String(answer)] : []);
    const answerSet = new Set(answerValues.map(normalize));

    const sameSize = answerSet.size === correctSet.size;
    const allMatch = sameSize && [...correctSet].every((item) => answerSet.has(item));

    const optionStatus = {};
    (question?.options || []).forEach((option) => {
      const key = normalize(option);
      const isSelected = answerSet.has(key);
      const isCorrect = correctSet.has(key);
      optionStatus[option] = isSelected ? (isCorrect ? "correct" : "wrong") : (isCorrect ? "missed" : "neutral");
    });

    return { isCorrect: allMatch, optionStatus };
  }

  if (questionType === "true_false") {
    const correct = normalize(question?.correctAnswer);
    const selected = normalize(answer);
    const optionStatus = {
      True: selected === "true" ? (correct === "true" ? "correct" : "wrong") : (correct === "true" ? "missed" : "neutral"),
      False: selected === "false" ? (correct === "false" ? "correct" : "wrong") : (correct === "false" ? "missed" : "neutral"),
    };
    return { isCorrect: selected && selected === correct, optionStatus };
  }

  if (questionType === "matching") {
    const mapping = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
    const pairStatus = {};
    const allPairs = Array.isArray(question?.pairs) ? question.pairs : [];
    let allCorrect = allPairs.length > 0;

    allPairs.forEach((pair, idx) => {
      const term = String(pair?.term || `Term ${idx + 1}`);
      const expected = normalize(pair?.correctOption);
      const selected = normalize(mapping?.[term]);
      const isPairCorrect = Boolean(selected) && selected === expected;
      pairStatus[term] = isPairCorrect ? "correct" : (selected ? "wrong" : "neutral");
      if (!isPairCorrect) allCorrect = false;
    });

    return { isCorrect: allCorrect, pairStatus };
  }

  return { isCorrect: false };
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
  const [inlineAssignmentAnswers, setInlineAssignmentAnswers] = useState({});
  const [inlineAssignmentSubmission, setInlineAssignmentSubmission] = useState(null);
  const [inlineAssignmentLoading, setInlineAssignmentLoading] = useState(false);
  const [inlineAssignmentSubmitting, setInlineAssignmentSubmitting] = useState(false);
  const [inlineAssignmentError, setInlineAssignmentError] = useState("");
  const [inlineAssignmentMetaError, setInlineAssignmentMetaError] = useState("");
  const [inlineAssignmentMetaLoading, setInlineAssignmentMetaLoading] = useState(false);
  const [inlineAssignmentEditMode, setInlineAssignmentEditMode] = useState(true);
  const [inlineDraftText, setInlineDraftText] = useState("");
  const [inlineDraftLinks, setInlineDraftLinks] = useState([""]);
  const [inlineNewFiles, setInlineNewFiles] = useState([]);
  const [resolvedAssignment, setResolvedAssignment] = useState(null);
  const [inlineGradingPollCount, setInlineGradingPollCount] = useState(0);
  const [inlineGradingTraceId, setInlineGradingTraceId] = useState("");
  const [activeMatchingTermByQuestion, setActiveMatchingTermByQuestion] = useState({});
  const [matchingLayoutTick, setMatchingLayoutTick] = useState(0);
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
  const liveProgressMarkedRef = useRef(new Set());
  const inlineLoadRequestRef = useRef(0);
  const matchingBoardRefByQuestion = useRef({});
  const matchingLeftRefByQuestion = useRef({});
  const matchingRightRefByQuestion = useRef({});
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

  const totalCourseMinutes = useMemo(() => {
    const courseMinutes = Number(course?.totalDuration || 0);
    if (courseMinutes > 0) return courseMinutes;
    return modules.reduce((sum, mod) => sum + getModuleDurationMinutes(mod), 0);
  }, [course?.totalDuration, modules]);

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

  const activeAssignmentId = useMemo(() => {
    if (activeLesson?.type !== "assignment") return "";
    const raw = activeLesson?.assignmentId;
    if (!raw) return "";
    if (typeof raw === "object") return String(raw?._id || "");
    return String(raw);
  }, [activeLesson]);

  const activeAssignment = useMemo(() => {
    if (activeLesson?.type !== "assignment") return null;
    if (activeLesson?.assignmentId && typeof activeLesson.assignmentId === "object") {
      return activeLesson.assignmentId;
    }
    if (!activeAssignmentId && resolvedAssignment) {
      const resolvedLessonId = String(resolvedAssignment?.lesson?._id || resolvedAssignment?.lesson || "");
      if (resolvedLessonId && String(activeLesson?._id || "") === resolvedLessonId) {
        return resolvedAssignment;
      }
    }
    if (resolvedAssignment?._id && String(resolvedAssignment._id) === String(activeAssignmentId)) {
      return resolvedAssignment;
    }
    return null;
  }, [activeAssignmentId, activeLesson, resolvedAssignment]);

  const activeAssignmentType = String(activeAssignment?.assessmentType || "subjective").toLowerCase();
  const isActiveAssignmentObjective = ["mcq", "true_false", "matching"].includes(activeAssignmentType);
  const isInlineAssignmentLesson = activeLesson?.type === "assignment" && !!activeAssignment?._id;
  const shouldShowInlineObjectiveAssignment = isInlineAssignmentLesson && isActiveAssignmentObjective;
  const shouldShowInlineManualAssignment = isInlineAssignmentLesson && !isActiveAssignmentObjective;
  const activeSubmissionType = String(activeAssignment?.type || "text").toLowerCase();
  const inlineSubmissionStatus = String(inlineAssignmentSubmission?.status || "").toLowerCase();
  const inlineGradingStatus = String(inlineAssignmentSubmission?.gradingStatus || "").toLowerCase();
  const inlineGradingError = String(inlineAssignmentSubmission?.gradingError || "").trim();
  const isInlineGraded = inlineSubmissionStatus === "graded" || inlineGradingStatus === "completed";
  const isInlineGradingPending = inlineSubmissionStatus === "submitted" && ["queued", "processing"].includes(inlineGradingStatus);
  const isInlineGradingFailed = inlineGradingStatus === "failed";
  const inlineExistingFiles = inlineAssignmentSubmission?.content?.files || [];

  const activeDueMs = activeAssignment?.dueDate ? new Date(activeAssignment.dueDate).getTime() : Number.NaN;
  const inlineOverdueNow = Number.isFinite(activeDueMs) && Date.now() > activeDueMs;
  const inlineLateAllowed = Boolean(activeAssignment?.allowLateSubmission);
  const inlineSubmissionLockedByDeadline = inlineOverdueNow && !inlineLateAllowed;
  const inlineCanEditNow =
    inlineAssignmentEditMode &&
    !inlineAssignmentSubmitting &&
    !inlineAssignmentLoading &&
    !inlineSubmissionLockedByDeadline;

  useEffect(() => {
    if (activeLesson?.type !== "assignment") {
      setResolvedAssignment(null);
      setInlineAssignmentMetaError("");
      setInlineAssignmentMetaLoading(false);
      return;
    }

    if (activeLesson?.assignmentId && typeof activeLesson.assignmentId === "object") {
      setResolvedAssignment(activeLesson.assignmentId);
      setInlineAssignmentMetaError("");
      setInlineAssignmentMetaLoading(false);
      return;
    }

    let ignore = false;
    setInlineAssignmentMetaLoading(true);
    setInlineAssignmentMetaError("");

    const load = async () => {
      try {
        if (activeAssignmentId) {
          const res = await apiClient.get(`/assignments/${activeAssignmentId}`);
          if (ignore) return;
          setResolvedAssignment(res?.data?.data || null);
          return;
        }

        // Fallback for legacy/misaligned lessons where lesson.assignmentId is missing.
        const courseAssignmentsRes = await apiClient.get(`/assignments/course/${courseId}?limit=500`);
        if (ignore) return;
        const assignments = courseAssignmentsRes?.data?.data?.assignments || [];
        const matched = assignments.find((item) => {
          const lessonId = String(item?.lesson?._id || item?.lesson || "");
          return lessonId && lessonId === String(activeLesson?._id || "");
        }) || null;

        if (!matched) {
          setResolvedAssignment(null);
          setInlineAssignmentMetaError("Assignment link missing for this lesson. Please update this lesson in instructor course editor.");
          return;
        }

        setResolvedAssignment(matched);
      } catch (error) {
        if (ignore) return;
        setResolvedAssignment(null);
        setInlineAssignmentMetaError(error?.response?.data?.message || "Failed to load assignment details.");
      } finally {
        if (!ignore) {
          setInlineAssignmentMetaLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [activeAssignmentId, activeLesson?._id, activeLesson?.assignmentId, activeLesson?.type, courseId]);

  const inlineQuestionResults = useMemo(() => {
    if (!isInlineGraded || !activeAssignment) return {};
    const resultMap = {};
    (activeAssignment?.questions || []).forEach((question, index) => {
      const questionId = String(question?.questionId || index + 1);
      const questionType = String(question?.type || activeAssignmentType || "mcq").toLowerCase();
      const answer = inlineAssignmentAnswers?.[questionId];
      resultMap[questionId] = evaluateQuestionCorrectness(question, answer, questionType);
    });
    return resultMap;
  }, [activeAssignment, activeAssignmentType, inlineAssignmentAnswers, isInlineGraded]);

  const inlineAllCorrect = useMemo(() => {
    if (!isInlineGraded || !activeAssignment) return false;
    const questions = Array.isArray(activeAssignment?.questions) ? activeAssignment.questions : [];
    if (!questions.length) return false;
    return questions.every((question, index) => {
      const questionId = String(question?.questionId || index + 1);
      return Boolean(inlineQuestionResults?.[questionId]?.isCorrect);
    });
  }, [activeAssignment, inlineQuestionResults, isInlineGraded]);

  const loadInlineAssignmentSubmission = useCallback(async (assignmentId) => {
    if (!assignmentId) return;

    const requestId = inlineLoadRequestRef.current + 1;
    inlineLoadRequestRef.current = requestId;

    gradingDebug("POLL_REQUEST_START", {
      requestId,
      assignmentId: String(assignmentId || ""),
      traceId: inlineGradingTraceId,
      pollCount: inlineGradingPollCount,
    });

    setInlineAssignmentLoading(true);
    setInlineAssignmentError("");
    try {
      const res = await apiClient.get(`/submissions/my?courseId=${courseId}&limit=500`);
      const list = res?.data?.data?.submissions || [];
      const existing =
        list.find((item) => String(item?.assignment?._id || item?.assignment) === String(assignmentId)) || null;
      if (requestId !== inlineLoadRequestRef.current) return;

      gradingDebug("POLL_RESPONSE", {
        requestId,
        assignmentId: String(assignmentId || ""),
        status: String(existing?.status || ""),
        gradingStatus: String(existing?.gradingStatus || ""),
        score: Number(existing?.score || 0),
        traceId: inlineGradingTraceId,
      });

      setInlineAssignmentSubmission(existing);
      setInlineAssignmentAnswers(existing?.content?.mcqAnswers || {});
      setInlineDraftText(existing?.content?.text || "");
      const safeLinks = (existing?.content?.links || []).map((item) => item?.url).filter(Boolean);
      setInlineDraftLinks(safeLinks.length ? safeLinks : [""]);
      setInlineNewFiles([]);
      setInlineAssignmentEditMode((prev) => {
        if (prev) return true;
        return !(existing && ["submitted", "graded"].includes(String(existing.status || "").toLowerCase()));
      });
    } catch (error) {
      if (requestId !== inlineLoadRequestRef.current) return;
      gradingDebug("POLL_REQUEST_ERROR", {
        requestId,
        assignmentId: String(assignmentId || ""),
        traceId: inlineGradingTraceId,
        error: error?.response?.data?.message || error?.message || "Unknown error",
      });
      setInlineAssignmentError(error?.response?.data?.message || "Unable to load assignment submission state.");
    } finally {
      if (requestId === inlineLoadRequestRef.current) {
        setInlineAssignmentLoading(false);
      }
    }
  }, [courseId, inlineGradingPollCount, inlineGradingTraceId]);

  useEffect(() => {
    if (!isInlineAssignmentLesson) {
      setInlineAssignmentSubmission(null);
      setInlineAssignmentAnswers({});
      setInlineDraftText("");
      setInlineDraftLinks([""]);
      setInlineNewFiles([]);
      setInlineAssignmentError("");
      setInlineAssignmentEditMode(true);
      setInlineGradingPollCount(0);
      setInlineGradingTraceId("");
      setActiveMatchingTermByQuestion({});
      return;
    }

    setActiveMatchingTermByQuestion({});
    setInlineAssignmentEditMode(false);
    setInlineGradingPollCount(0);
    loadInlineAssignmentSubmission(activeAssignment._id);
  }, [activeAssignment?._id, isInlineAssignmentLesson, loadInlineAssignmentSubmission]);

  useEffect(() => {
    if (!isInlineAssignmentLesson || !activeAssignment?._id) return;
    if (!isInlineGradingPending || inlineAssignmentEditMode) {
      if (isInlineGradingFailed) {
        gradingDebug("POLL_STOP_FAILED", {
          assignmentId: String(activeAssignment?._id || ""),
          traceId: inlineGradingTraceId,
          gradingError: inlineGradingError,
        });
      }
      setInlineGradingPollCount(0);
      return;
    }
    if (inlineGradingPollCount >= 24) {
      gradingDebug("POLL_TIMEOUT", {
        assignmentId: String(activeAssignment?._id || ""),
        status: inlineSubmissionStatus,
        gradingStatus: inlineGradingStatus,
        traceId: inlineGradingTraceId,
      });
      return;
    }

    const timer = setTimeout(() => {
      gradingDebug("POLL_TICK", {
        assignmentId: String(activeAssignment?._id || ""),
        nextPollCount: inlineGradingPollCount + 1,
        traceId: inlineGradingTraceId,
      });
      loadInlineAssignmentSubmission(activeAssignment._id);
      setInlineGradingPollCount((prev) => prev + 1);
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    activeAssignment?._id,
    inlineGradingStatus,
    inlineGradingError,
    inlineGradingTraceId,
    inlineAssignmentEditMode,
    inlineGradingPollCount,
    inlineSubmissionStatus,
    isInlineGradingFailed,
    isInlineGradingPending,
    isInlineAssignmentLesson,
    loadInlineAssignmentSubmission,
  ]);

  useEffect(() => {
    if (!shouldShowInlineObjectiveAssignment) return;
    const onResize = () => setMatchingLayoutTick((prev) => prev + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [shouldShowInlineObjectiveAssignment]);

  useEffect(() => {
    if (!shouldShowInlineObjectiveAssignment) return;
    setMatchingLayoutTick((prev) => prev + 1);
  }, [shouldShowInlineObjectiveAssignment, inlineAssignmentAnswers, activeMatchingTermByQuestion, inlineAssignmentEditMode]);

  const updateInlineAssignmentAnswer = useCallback((questionId, value) => {
    setInlineAssignmentAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const addInlineLinkInput = useCallback(() => {
    setInlineDraftLinks((prev) => [...prev, ""]);
  }, []);

  const updateInlineLink = useCallback((index, value) => {
    setInlineDraftLinks((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  }, []);

  const removeInlineNewFile = useCallback((index) => {
    setInlineNewFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const validateUrl = useCallback((url) => {
    try {
      const parsed = new URL(url);
      const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0"];
      if (!["http:", "https:"].includes(parsed.protocol)) return false;
      if (blockedHosts.includes(parsed.hostname)) return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleInlineAssignmentSubmit = useCallback(async () => {
    if (!activeAssignment?._id) return;

    setInlineAssignmentSubmitting(true);
    setInlineAssignmentError("");
    setInlineGradingPollCount(0);
    try {
      const links = inlineDraftLinks
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .map((url) => ({ title: "Reference Link", url }));

      if (links.some((item) => !validateUrl(item.url))) {
        throw new Error("One or more URLs are invalid or unsafe.");
      }

      const hasText = Boolean(String(inlineDraftText || "").trim());
      const hasLinks = links.length > 0;
      const hasFiles = inlineExistingFiles.length + inlineNewFiles.length > 0;

      if (shouldShowInlineObjectiveAssignment) {
        const questions = Array.isArray(activeAssignment?.questions) ? activeAssignment.questions : [];
        const allAnswered = questions.every((question, index) => {
          const questionId = String(question?.questionId || index + 1);
          const answer = inlineAssignmentAnswers?.[questionId];
          const questionType = String(question?.type || activeAssignmentType || "mcq").toLowerCase();

          if (questionType === "matching") {
            if (!answer || typeof answer !== "object" || Array.isArray(answer)) return false;
            const pairs = Array.isArray(question?.pairs) ? question.pairs : [];
            return pairs.every((pair, pairIndex) => {
              const term = String(pair?.term || `Term ${pairIndex + 1}`);
              return String(answer?.[term] || "").trim().length > 0;
            });
          }

          if (Array.isArray(answer)) return answer.length > 0;
          return String(answer || "").trim().length > 0;
        });

        if (!allAnswered) {
          throw new Error("Please answer all questions before submitting.");
        }
      } else {
        if (activeSubmissionType === "text" && (!hasText || hasLinks || hasFiles)) {
          throw new Error("This assignment accepts only text.");
        }
        if (activeSubmissionType === "url" && (!hasLinks || hasText || hasFiles)) {
          throw new Error("This assignment accepts only URLs.");
        }
        if (activeSubmissionType === "file" && (!hasFiles || hasText || hasLinks)) {
          throw new Error("This assignment accepts only files.");
        }
        if (activeSubmissionType === "mixed" && !hasText && !hasLinks && !hasFiles) {
          throw new Error("Add at least one text, URL, or file item before submit.");
        }
      }

      const formData = new FormData();
      formData.append(
        "content",
        JSON.stringify({
          text: shouldShowInlineObjectiveAssignment ? "" : String(inlineDraftText || "").trim(),
          links: shouldShowInlineObjectiveAssignment ? [] : links,
          mcqAnswers: shouldShowInlineObjectiveAssignment ? inlineAssignmentAnswers : {},
        })
      );
      inlineNewFiles.forEach((file) => formData.append("files", file));

      gradingDebug("SUBMIT_REQUEST_START", {
        assignmentId: String(activeAssignment?._id || ""),
        submissionMode: shouldShowInlineObjectiveAssignment ? "objective" : "manual",
      });

      const submitRes = await apiClient.post(`/submissions/assignment/${activeAssignment._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const traceId = String(submitRes?.data?.data?.gradingTraceId || "");
      if (traceId) {
        setInlineGradingTraceId(traceId);
      }

      gradingDebug("SUBMIT_REQUEST_DONE", {
        assignmentId: String(activeAssignment?._id || ""),
        traceId,
        autoGradingQueued: Boolean(submitRes?.data?.data?.autoGradingQueued),
      });

      setInlineAssignmentEditMode(false);
      setInlineGradingPollCount(0);
      await loadInlineAssignmentSubmission(activeAssignment._id);
      await persistProgress({
        force: true,
        progressPercentage: 100,
        activityProgress: { assignmentStarted: true, assignmentSubmitted: true },
      });
      await apiClient.patch(`/progress/lesson/${activeLesson._id}/complete`);
      await dispatch(getMyEnrollments({ page: 1, limit: 100 }));
    } catch (error) {
      gradingDebug("SUBMIT_REQUEST_ERROR", {
        assignmentId: String(activeAssignment?._id || ""),
        traceId: inlineGradingTraceId,
        error: error?.response?.data?.message || error?.message || "Unknown error",
      });
      setInlineAssignmentError(error?.response?.data?.message || error?.message || "Failed to submit assignment.");
    } finally {
      setInlineAssignmentSubmitting(false);
    }
  }, [
    activeAssignment,
    activeAssignmentType,
    activeSubmissionType,
    activeLesson?._id,
    dispatch,
    inlineGradingTraceId,
    inlineAssignmentAnswers,
    inlineDraftLinks,
    inlineDraftText,
    inlineExistingFiles.length,
    inlineNewFiles,
    loadInlineAssignmentSubmission,
    persistProgress,
    shouldShowInlineObjectiveAssignment,
    validateUrl,
  ]);

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
            <p className="text-xs text-gray-500 mt-1">{lessonsFlat.length} lessons across {modules.length} modules • {formatDuration(totalCourseMinutes)}</p>
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
                    <p className="text-xs text-gray-500 mt-0.5">{moduleLessons.length} lessons • {formatDuration(getModuleDurationMinutes(mod))}</p>
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
                                <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{lesson.type} • {formatDuration(getLessonDurationMinutes(lesson))}</p>
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
                  {(activeLesson?.content?.articleContentRich || activeLesson?.content?.articleContent) ? (
                    <RichContentRenderer
                      content={activeLesson?.content?.articleContentRich || activeLesson?.content?.articleContent}
                      className="text-sm text-gray-300"
                    />
                  ) : (
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-7">No article content available for this lesson.</p>
                  )}
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

                  {isInlineAssignmentLesson ? (
                    <div className="mt-3 space-y-4">
                      <div className="rounded-xl border border-gray-700 bg-black/30 p-4">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-6">
                          {activeAssignment?.description || "Answer all questions to complete this assignment."}
                        </p>
                        {activeAssignment?.instructions && (
                          <p className="text-xs text-yellow-300 mt-2 whitespace-pre-wrap">
                            {activeAssignment.instructions}
                          </p>
                        )}
                      </div>

                      {inlineAssignmentLoading ? (
                        <p className="text-sm text-gray-400">Loading your assignment attempt...</p>
                      ) : (
                        <>
                          {inlineAssignmentError && (
                            <p className="text-sm text-red-300">{inlineAssignmentError}</p>
                          )}

                          {inlineSubmissionStatus === "submitted" && ["queued", "processing"].includes(inlineGradingStatus) && (
                            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                              <p className="text-sm text-cyan-200">
                                Your assignment will be graded shortly. Please wait or refresh this page.
                              </p>
                              {inlineGradingTraceId && (
                                <p className="text-[11px] text-cyan-300/80 mt-1">Trace: {inlineGradingTraceId}</p>
                              )}
                            </div>
                          )}

                          {isInlineGradingFailed && (
                            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3">
                              <p className="text-sm text-red-200 font-medium">
                                Auto-grading failed. Please update and resubmit.
                              </p>
                              {inlineGradingError && (
                                <p className="text-xs text-red-200/90 mt-1 whitespace-pre-wrap">
                                  {inlineGradingError}
                                </p>
                              )}
                              {inlineGradingTraceId && (
                                <p className="text-[11px] text-red-200/80 mt-1">Trace: {inlineGradingTraceId}</p>
                              )}
                            </div>
                          )}

                          {isInlineGraded && (
                            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
                              <p className="text-sm text-emerald-200 font-medium">
                                Auto-graded score: {Number(inlineAssignmentSubmission?.score || 0)} / {Number(inlineAssignmentSubmission?.maxScore || activeAssignment?.maxScore || 0)}
                              </p>
                              <p className="text-xs text-emerald-300/90 mt-1">
                                {inlineAllCorrect
                                  ? "All answers are correct. Great work."
                                  : "Some answers are incorrect. You can update and resubmit."}
                              </p>
                            </div>
                          )}

                          {(activeAssignment?.questions || []).map((question, index) => {
                            const questionId = String(question?.questionId || index + 1);
                            const questionType = String(question?.type || activeAssignmentType || "mcq").toLowerCase();
                            const answer = inlineAssignmentAnswers?.[questionId];
                            const allowMulti =
                              questionType === "mcq" &&
                              Array.isArray(question?.correctAnswers) &&
                              question.correctAnswers.length > 1;
                            const selectedValues = Array.isArray(answer)
                              ? answer
                              : (String(answer || "").trim() ? [String(answer)] : []);
                            const result = inlineQuestionResults?.[questionId] || {};

                            return (
                              <div key={questionId} className="rounded-xl border border-gray-700 bg-black/30 p-4">
                                <p className="text-sm text-gray-100 mb-2">
                                  Q{index + 1}. {question?.question}
                                  {allowMulti ? " (multiple correct option for this -> select multiple)" : ""}
                                </p>

                                {questionType === "mcq" && (
                                  <div className="grid gap-2">
                                    {(question?.options || []).map((option, optionIndex) => {
                                      const isChecked = selectedValues.includes(option);
                                      const optionState = result?.optionStatus?.[option] || "neutral";
                                      const gradedClass = isInlineGraded
                                        ? optionState === "correct"
                                          ? "text-emerald-300"
                                          : optionState === "wrong"
                                          ? "text-red-300"
                                          : optionState === "missed"
                                          ? "text-emerald-200/80"
                                          : "text-gray-200"
                                        : "text-gray-200";
                                      return (
                                        <label key={`${questionId}-${optionIndex}`} className={`flex items-center gap-2 text-sm ${gradedClass}`}>
                                          <input
                                            type={allowMulti ? "checkbox" : "radio"}
                                            name={`inline-question-${questionId}`}
                                            checked={isChecked}
                                            disabled={!inlineAssignmentEditMode}
                                            onChange={(event) => {
                                              if (allowMulti) {
                                                const nextValues = event.target.checked
                                                  ? Array.from(new Set([...selectedValues, option]))
                                                  : selectedValues.filter((item) => item !== option);
                                                updateInlineAssignmentAnswer(questionId, nextValues);
                                              } else {
                                                updateInlineAssignmentAnswer(questionId, option);
                                              }
                                            }}
                                          />
                                          {option}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}

                                {questionType === "true_false" && (
                                  <div className="flex items-center gap-4">
                                    {["True", "False"].map((option) => (
                                      <label
                                        key={`${questionId}-${option}`}
                                        className={`flex items-center gap-2 text-sm ${
                                          isInlineGraded && result?.optionStatus?.[option] === "correct"
                                            ? "text-emerald-300"
                                            : isInlineGraded && result?.optionStatus?.[option] === "wrong"
                                            ? "text-red-300"
                                            : isInlineGraded && result?.optionStatus?.[option] === "missed"
                                            ? "text-emerald-200/80"
                                            : "text-gray-200"
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`inline-question-${questionId}`}
                                          checked={String(answer || "") === option}
                                          disabled={!inlineAssignmentEditMode}
                                          onChange={() => updateInlineAssignmentAnswer(questionId, option)}
                                        />
                                        {option}
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {questionType === "matching" && (
                                  <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-4">
                                    {(() => {
                                      const pairs = Array.isArray(question?.pairs) ? question.pairs : [];
                                      const mapping =
                                        answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
                                      const terms = pairs.map((pair, pairIndex) => String(pair?.term || `Term ${pairIndex + 1}`));
                                      const allOptions = Array.from(
                                        new Set(
                                          pairs.flatMap((pair) => {
                                            if (Array.isArray(pair?.options) && pair.options.length > 0) {
                                              return pair.options.map((item) => String(item));
                                            }
                                            return pair?.correctOption ? [String(pair.correctOption)] : [];
                                          })
                                        )
                                      );
                                      const activeTerm = activeMatchingTermByQuestion?.[questionId] || "";

                                      const boardEl = matchingBoardRefByQuestion.current?.[questionId] || null;
                                      const boardRect = boardEl?.getBoundingClientRect?.();
                                      const viewWidth = Math.max(1, Number(boardRect?.width || 0));
                                      const viewHeight = Math.max(1, Number(boardRect?.height || 0));

                                      const getEdgeCenter = (side, key) => {
                                        const store = side === "left"
                                          ? matchingLeftRefByQuestion.current?.[questionId]
                                          : matchingRightRefByQuestion.current?.[questionId];
                                        const el = store?.[key];
                                        if (!el || !boardRect) return null;
                                        const rect = el.getBoundingClientRect();
                                        return {
                                          x: side === "left" ? (rect.right - boardRect.left) : (rect.left - boardRect.left),
                                          y: (rect.top + (rect.height / 2) - boardRect.top),
                                        };
                                      };

                                      return (
                                        <div className="space-y-3">
                                          <p className="text-xs text-gray-400">
                                            Click a left item, then click a right option to connect.
                                          </p>

                                          <div
                                            ref={(node) => {
                                              if (!matchingBoardRefByQuestion.current) matchingBoardRefByQuestion.current = {};
                                              matchingBoardRefByQuestion.current[questionId] = node;
                                            }}
                                            className="relative rounded-lg border border-gray-800 bg-black/20 p-4"
                                          >
                                            <svg
                                              className="pointer-events-none absolute inset-0 w-full h-full"
                                              aria-hidden="true"
                                              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                                              preserveAspectRatio="none"
                                            >
                                              {terms.map((term) => {
                                                const selectedOption = mapping?.[term];
                                                if (!selectedOption) return null;
                                                const state = result?.pairStatus?.[term] || "neutral";
                                                const strokeColor = state === "correct" ? "#34d399" : state === "wrong" ? "#f87171" : "#f0c040";
                                                const glowColor = state === "correct" ? "rgba(52,211,153,0.24)" : state === "wrong" ? "rgba(248,113,113,0.22)" : "rgba(240,192,64,0.25)";

                                                const p1 = getEdgeCenter("left", term);
                                                const p2 = getEdgeCenter("right", selectedOption);
                                                if (!p1 || !p2) return null;

                                                const dx = p2.x - p1.x;
                                                const c1 = p1.x + (dx * 0.42);
                                                const c2 = p2.x - (dx * 0.42);

                                                return (
                                                  <g key={`${questionId}-${term}-line`}>
                                                    <path
                                                      d={`M ${p1.x} ${p1.y} C ${c1} ${p1.y}, ${c2} ${p2.y}, ${p2.x} ${p2.y}`}
                                                      stroke={glowColor}
                                                      strokeWidth="8"
                                                      fill="none"
                                                      strokeLinecap="round"
                                                    />
                                                    <path
                                                      d={`M ${p1.x} ${p1.y} C ${c1} ${p1.y}, ${c2} ${p2.y}, ${p2.x} ${p2.y}`}
                                                      stroke={strokeColor}
                                                      strokeWidth="2.2"
                                                      fill="none"
                                                      strokeLinecap="round"
                                                    />
                                                    <circle cx={p1.x} cy={p1.y} r="4" fill={strokeColor} />
                                                    <circle cx={p2.x} cy={p2.y} r="4" fill={strokeColor} />
                                                  </g>
                                                );
                                              })}
                                            </svg>

                                            <div key={matchingLayoutTick} className="relative z-10 grid grid-cols-[1fr_190px_1fr] gap-0 items-start">
                                              <div className="space-y-3">
                                                {terms.map((term, termIndex) => {
                                                  const isActiveTerm = term === activeTerm;
                                                  const connectedOption = mapping?.[term] || "";
                                                  const state = result?.pairStatus?.[term] || "neutral";
                                                  const isConnected = Boolean(connectedOption);

                                                  return (
                                                    <button
                                                      key={`${questionId}-term-${termIndex}`}
                                                      type="button"
                                                      disabled={!inlineAssignmentEditMode}
                                                      onClick={() => {
                                                        setActiveMatchingTermByQuestion((prev) => ({
                                                          ...prev,
                                                          [questionId]: term,
                                                        }));
                                                      }}
                                                      ref={(node) => {
                                                        if (!matchingLeftRefByQuestion.current[questionId]) {
                                                          matchingLeftRefByQuestion.current[questionId] = {};
                                                        }
                                                        if (node) matchingLeftRefByQuestion.current[questionId][term] = node;
                                                      }}
                                                      className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                                                        isActiveTerm
                                                          ? "border-yellow-400 bg-yellow-400/10 text-yellow-200"
                                                          : isInlineGraded && state === "correct"
                                                          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                                                          : isInlineGraded && state === "wrong"
                                                          ? "border-red-400/60 bg-red-500/10 text-red-200"
                                                          : isConnected
                                                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                                                          : "border-[#2e2e3a] bg-[#14141a] text-gray-200 hover:border-yellow-400 hover:bg-[#1d1c24]"
                                                      }`}
                                                    >
                                                      <span>{term}</span>
                                                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                                        <span className="w-2.5 h-2.5 rounded-full border border-current -mr-1" style={{ marginRight: "-8px" }} />
                                                      </span>
                                                    </button>
                                                  );
                                                })}
                                              </div>

                                              <div />

                                              <div className="space-y-3">
                                                {allOptions.map((option, optionIndex) => {
                                                  const isConnected = Object.values(mapping).includes(option);
                                                  const isActiveTarget =
                                                    activeTerm && String(mapping?.[activeTerm] || "") === String(option);
                                                  const linkedTerm = terms.find((term) => String(mapping?.[term] || "") === String(option));
                                                  const linkedState = linkedTerm ? (result?.pairStatus?.[linkedTerm] || "neutral") : "neutral";
                                                  return (
                                                    <button
                                                      key={`${questionId}-option-${optionIndex}`}
                                                      type="button"
                                                      disabled={!inlineAssignmentEditMode || !activeTerm}
                                                      onClick={() => {
                                                        if (!activeTerm) return;
                                                        const nextMap = { ...mapping, [activeTerm]: option };
                                                        updateInlineAssignmentAnswer(questionId, nextMap);
                                                        setActiveMatchingTermByQuestion((prev) => ({
                                                          ...prev,
                                                          [questionId]: "",
                                                        }));
                                                      }}
                                                      ref={(node) => {
                                                        if (!matchingRightRefByQuestion.current[questionId]) {
                                                          matchingRightRefByQuestion.current[questionId] = {};
                                                        }
                                                        if (node) matchingRightRefByQuestion.current[questionId][option] = node;
                                                      }}
                                                      className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                                                        isActiveTarget
                                                          ? "border-yellow-400 bg-yellow-400/10 text-yellow-200"
                                                          : isInlineGraded && linkedState === "correct"
                                                          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                                                          : isInlineGraded && linkedState === "wrong"
                                                          ? "border-red-400/60 bg-red-500/10 text-red-200"
                                                          : isConnected
                                                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                                                          : "border-[#2e2e3a] bg-[#14141a] text-gray-200 hover:border-yellow-400 hover:bg-[#1d1c24]"
                                                      }`}
                                                    >
                                                      <span className="w-2.5 h-2.5 rounded-full border border-current -mr-1" style={{ marginLeft: "-8px" }} />
                                                      <span>{option}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex justify-end">
                                            <button
                                              type="button"
                                              disabled={!inlineAssignmentEditMode}
                                              onClick={() => {
                                                updateInlineAssignmentAnswer(questionId, {});
                                                setActiveMatchingTermByQuestion((prev) => ({
                                                  ...prev,
                                                  [questionId]: "",
                                                }));
                                              }}
                                              className="text-xs text-gray-400 hover:text-yellow-300"
                                            >
                                              Clear all
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {shouldShowInlineManualAssignment && (
                            <div className="rounded-xl border border-gray-700 bg-black/30 p-4 space-y-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Submission Type: {activeSubmissionType}</p>

                              {(activeSubmissionType === "text" || activeSubmissionType === "mixed") && (
                                <textarea
                                  value={inlineDraftText}
                                  onChange={(event) => setInlineDraftText(event.target.value)}
                                  rows={7}
                                  disabled={!inlineCanEditNow}
                                  placeholder="Write your answer here..."
                                  className="w-full rounded-xl border border-gray-700 bg-black/40 text-gray-100 px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 disabled:opacity-60"
                                />
                              )}

                              {(activeSubmissionType === "url" || activeSubmissionType === "mixed") && (
                                <div className="grid gap-2">
                                  {inlineDraftLinks.map((link, linkIndex) => (
                                    <div key={`inline-link-${linkIndex}`} className="flex items-center gap-2">
                                      <LinkIcon className="w-4 h-4 text-gray-500" />
                                      <input
                                        value={link}
                                        disabled={!inlineCanEditNow}
                                        onChange={(event) => updateInlineLink(linkIndex, event.target.value)}
                                        placeholder="https://example.com/reference"
                                        className="w-full rounded-xl border border-gray-700 bg-black/40 text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400/50 disabled:opacity-60"
                                      />
                                    </div>
                                  ))}
                                  {inlineCanEditNow && (
                                    <button
                                      type="button"
                                      onClick={addInlineLinkInput}
                                      className="w-fit text-xs text-yellow-400 hover:text-yellow-300"
                                    >
                                      + Add URL
                                    </button>
                                  )}
                                </div>
                              )}

                              {(activeSubmissionType === "file" || activeSubmissionType === "mixed") && (
                                <div className="grid gap-2">
                                  <div className="rounded-xl border border-dashed border-gray-700 p-3 bg-black/30">
                                    <label className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                                      <Upload className="w-4 h-4" />
                                      <span>{inlineCanEditNow ? "Upload files" : "Files are locked"}</span>
                                      {inlineCanEditNow && (
                                        <input
                                          type="file"
                                          className="hidden"
                                          multiple
                                          onChange={(event) => {
                                            const selectedFiles = Array.from(event.target.files || []);
                                            setInlineNewFiles((prev) => [...prev, ...selectedFiles]);
                                          }}
                                        />
                                      )}
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">Allowed: pdf/doc/docx/ppt/pptx/xls/xlsx/txt/csv/md/jpg/jpeg/png/webp/mp4/webm/zip</p>
                                  </div>

                                  {inlineExistingFiles.length > 0 && (
                                    <div className="rounded-xl border border-gray-800 bg-black/20 p-3">
                                      <p className="text-xs text-gray-500 mb-2">Already Submitted Files</p>
                                      <div className="grid gap-1">
                                        {inlineExistingFiles.map((file, fileIndex) => (
                                          <a
                                            key={`inline-existing-file-${fileIndex}`}
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-yellow-300 hover:text-yellow-200"
                                          >
                                            {file.name || `File ${fileIndex + 1}`}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {inlineNewFiles.length > 0 && (
                                    <div className="rounded-xl border border-gray-800 bg-black/20 p-3">
                                      <p className="text-xs text-gray-500 mb-2">New Files To Submit</p>
                                      <div className="grid gap-1">
                                        {inlineNewFiles.map((file, fileIndex) => (
                                          <div key={`inline-new-file-${fileIndex}`} className="flex items-center justify-between gap-2">
                                            <span className="text-sm text-gray-200 truncate">{file.name}</span>
                                            {inlineCanEditNow && (
                                              <button
                                                type="button"
                                                onClick={() => removeInlineNewFile(fileIndex)}
                                                className="text-xs text-red-400 hover:text-red-300"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {inlineSubmissionStatus === "graded" && (
                                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
                                  <p className="text-sm text-yellow-200">
                                    Latest Grade: {Number(inlineAssignmentSubmission?.score || 0)} / {Number(inlineAssignmentSubmission?.maxScore || activeAssignment?.maxScore || 0)}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2">
                            {(inlineSubmissionStatus === "submitted" || inlineSubmissionStatus === "graded") && !inlineAssignmentEditMode ? (
                              <>
                                <button
                                  type="button"
                                  disabled
                                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-semibold cursor-not-allowed"
                                >
                                  Submitted
                                </button>
                                {((shouldShowInlineObjectiveAssignment && !inlineAllCorrect) ||
                                  (shouldShowInlineManualAssignment && inlineSubmissionStatus !== "graded")) && (
                                  <button
                                    type="button"
                                    onClick={() => setInlineAssignmentEditMode(true)}
                                    className="px-4 py-2 rounded-lg border border-yellow-400/40 text-yellow-300 text-sm font-semibold"
                                  >
                                    {shouldShowInlineObjectiveAssignment ? "Update Answers" : "Update Submission"}
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={handleInlineAssignmentSubmit}
                                disabled={!inlineCanEditNow}
                                className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-semibold disabled:opacity-60"
                              >
                                {inlineAssignmentSubmitting
                                  ? "Submitting..."
                                  : inlineAssignmentSubmission
                                  ? "Update Submission"
                                  : "Submit Assignment"}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : shouldShowInlineManualAssignment ? (
                    <div className="mt-3 space-y-4">
                      <div className="rounded-xl border border-gray-700 bg-black/30 p-4">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-6">
                          {activeAssignment?.description || "Complete and submit this assignment from this page."}
                        </p>
                        {activeAssignment?.instructions && (
                          <p className="text-xs text-yellow-300 mt-2 whitespace-pre-wrap">
                            {activeAssignment.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : inlineAssignmentMetaLoading ? (
                    <p className="text-sm text-gray-400 mt-2">Loading assignment content...</p>
                  ) : inlineAssignmentMetaError ? (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                      <p className="text-sm text-red-300">{inlineAssignmentMetaError}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">Assignment content is unavailable for this lesson.</p>
                  )}
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
