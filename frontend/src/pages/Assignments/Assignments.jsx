/**
 * pages/Assignments/Assignments.jsx
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Link as LinkIcon, Upload, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState } from "../../components/DashboardPages/DashboardUI";
import AssignmentCard from "../../components/AssignmentPages/AssignmentCard";
import AssignmentFeedback from "../../components/AssignmentPages/AssignmentFeedback";
import { ASSIGNMENT_TABS } from "../../constants/dashboard.constants";
import { apiClient } from "../../utils/api.utils";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";
import { formatDateTime } from "../../utils/format.utils";

export default function Assignments() {
  const dispatch = useDispatch();
  const { myEnrollments } = useSelector((state) => state.enrollment);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftLinks, setDraftLinks] = useState([""]);
  const [objectiveAnswers, setObjectiveAnswers] = useState({});
  const [newFiles, setNewFiles] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  const loadSubmissions = useCallback(async () => {
    console.debug("[Assignments] Fetching my submissions");
    const res = await apiClient.get("/submissions/my?limit=200");
    const list = res?.data?.data?.submissions || [];
    setSubmissions(list);
    return list;
  }, []);

  const loadAssignments = useCallback(async () => {
    const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));
    const courseMap = new Map(
      (myEnrollments || []).map((e) => [String(e?.course?._id || e?.course), e?.course])
    );
    const courseIds = Array.from(courseMap.keys()).filter((id) => isObjectId(id));

    if (courseIds.length === 0) {
      setAssignments([]);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      console.debug("[Assignments] Loading assignments across courses", { courseIds });
      const [assignmentResponses, submissionList] = await Promise.all([
        Promise.all(courseIds.map((courseId) => apiClient.get(`/assignments/course/${courseId}?limit=100`))),
        loadSubmissions(),
      ]);

      const byAssignmentId = new Map(submissionList.map((s) => [String(s?.assignment?._id || s?.assignment), s]));

      const merged = assignmentResponses
        .flatMap((res) => res?.data?.data?.assignments || [])
        .map((assignment) => {
          const assignmentId = String(assignment?._id);
          const submission = byAssignmentId.get(assignmentId);
          const due = new Date(assignment?.dueDate || 0).getTime();
          const isOverdue = Number.isFinite(due) && due < Date.now();

          let status = "pending";
          if (submission?.status === "graded") status = "graded";
          else if (submission?.status === "submitted") status = "submitted";
          else if (submission?.status === "returned") status = "pending";
          else if (isOverdue) status = "pending";

          return {
            ...assignment,
            course: assignment?.course && typeof assignment.course === "object"
              ? assignment.course
              : courseMap.get(String(assignment?.course)) || { _id: assignment?.course },
            status,
          };
        })
        .sort((a, b) => new Date(a?.dueDate || 0) - new Date(b?.dueDate || 0));

      setAssignments(merged);
    } catch (err) {
      console.error("[Assignments] Failed to load assignments", err);
      setError(err?.response?.data?.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, [loadSubmissions, myEnrollments]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const submissionMap = useMemo(
    () => Object.fromEntries(submissions.map((s) => [String(s?.assignment?._id || s?.assignment), s])),
    [submissions]
  );

  const filtered = assignments.filter((a) => {
    const courseType = String(a?.course?.type || "recorded").toLowerCase();
    const matchesType =
      typeFilter === "all"
        ? true
        : typeFilter === "recorded"
          ? courseType !== "live"
          : courseType === "live";

    if (!matchesType) return false;
    if (activeTab === "All") return true;
    if (activeTab === "Pending")   return a.status === "pending";
    if (activeTab === "Submitted") return a.status === "submitted";
    if (activeTab === "Graded")    return a.status === "graded";
    return true;
  });

  const selectedSubmission = selected ? submissionMap[String(selected._id)] : null;

  useEffect(() => {
    setDraftText(selectedSubmission?.content?.text || "");
    setDraftLinks((selectedSubmission?.content?.links || []).map((item) => item.url || "") || [""]);
    if (!(selectedSubmission?.content?.links || []).length) setDraftLinks([""]);
    setObjectiveAnswers(selectedSubmission?.content?.mcqAnswers || {});
    setNewFiles([]);
    setIsEditMode(!(selectedSubmission && selectedSubmission.status === "submitted"));
  }, [selectedSubmission]);

  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
    const socket = io(base, { transports: ["websocket"], withCredentials: true });

    socket.on("connect", () => {
      console.debug("[Assignments] Socket connected", socket.id);
      if (user?._id) {
        socket.emit("join_notifications", { userId: user._id, role: "User" });
      }
    });

    socket.on("assignment_graded", (payload) => {
      console.debug("[Assignments] Received real-time grade update", payload);
      loadAssignments();
    });

    socket.on("assignment_moderation_update", (payload) => {
      console.debug("[Assignments] Received moderation update", payload);
      loadAssignments();
    });

    return () => {
      socket.disconnect();
    };
  }, [loadAssignments, user?._id]);

  const addLinkInput = () => setDraftLinks((prev) => [...prev, ""]);
  const updateLink = (index, value) => {
    setDraftLinks((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateObjectiveAnswer = (questionId, value) => {
    setObjectiveAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const assignmentType = selected?.type || "text";
  const assessmentType = String(selected?.assessmentType || "subjective").toLowerCase();
  const isObjectiveAssignment = ["mcq", "true_false", "matching"].includes(assessmentType);
  const gradingType = String(selected?.gradingType || (selected?.course?.type === "recorded" ? "auto" : "manual")).toLowerCase();
  const gradingStatus = String(selectedSubmission?.gradingStatus || "").toLowerCase();
  const existingFiles = selectedSubmission?.content?.files || [];
  const hasExistingSubmission = Boolean(selectedSubmission);
  const isSubmittedState = selectedSubmission?.status === "submitted";
  const isReturnedState = selectedSubmission?.status === "returned";
  const selectedDueMs = selected?.dueDate ? new Date(selected.dueDate).getTime() : Number.NaN;
  const isOverdueNow = Number.isFinite(selectedDueMs) && Date.now() > selectedDueMs;
  const lateAllowed = Boolean(selected?.allowLateSubmission);
  const isSubmissionLockedByDeadline = isOverdueNow && !lateAllowed;
  const canEditNow = (!hasExistingSubmission || isEditMode || isReturnedState) && !isSubmissionLockedByDeadline;

  const validateUrl = (url) => {
    try {
      const parsed = new URL(url);
      const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0"];
      if (!["http:", "https:"].includes(parsed.protocol)) return false;
      if (blockedHosts.includes(parsed.hostname)) return false;
      return true;
    } catch {
      return false;
    }
  };

  const buildSubmissionPayload = () => {
    const links = draftLinks
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ title: "Reference Link", url }));

    if (links.some((item) => !validateUrl(item.url))) {
      throw new Error("One or more URLs are invalid or unsafe.");
    }

    const hasText = Boolean(draftText.trim());
    const hasLinks = links.length > 0;
    const hasFiles = existingFiles.length + newFiles.length > 0;

    if (isObjectiveAssignment) {
      const safeQuestions = Array.isArray(selected?.questions) ? selected.questions : [];
      const allAnswered = safeQuestions.every((question, index) => {
        const questionId = String(question?.questionId || index + 1);
        const answer = objectiveAnswers?.[questionId];

        if (assessmentType === "matching") {
          return answer && typeof answer === "object" && !Array.isArray(answer) && Object.keys(answer).length > 0;
        }

        if (Array.isArray(answer)) return answer.length > 0;
        return String(answer || "").trim().length > 0;
      });

      if (!allAnswered) {
        throw new Error("Please answer all questions before submitting.");
      }
    }

    if (!isObjectiveAssignment && assignmentType === "text" && (!hasText || hasLinks || hasFiles)) {
      throw new Error("This assignment accepts only text.");
    }
    if (!isObjectiveAssignment && assignmentType === "url" && (!hasLinks || hasText || hasFiles)) {
      throw new Error("This assignment accepts only URLs.");
    }
    if (!isObjectiveAssignment && assignmentType === "file" && (!hasFiles || hasText || hasLinks)) {
      throw new Error("This assignment accepts only files.");
    }
    if (!isObjectiveAssignment && assignmentType === "mixed" && !hasText && !hasLinks && !hasFiles) {
      throw new Error("Add at least one text, URL, or file item before submit.");
    }

    const content = {
      text: draftText.trim(),
      links,
      mcqAnswers: isObjectiveAssignment ? objectiveAnswers : {},
    };

    const formData = new FormData();
    formData.append("content", JSON.stringify(content));
    newFiles.forEach((file) => formData.append("files", file));

    return formData;
  };

  const handleSubmitAssignment = useCallback(async () => {
    if (!selected?._id) return;

    if (isSubmittedState && !isEditMode) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = buildSubmissionPayload();
      console.debug("[Assignments] Submitting assignment", {
        assignmentId: selected._id,
        assignmentType,
        newFiles: newFiles.length,
      });
      await apiClient.post(`/submissions/assignment/${selected._id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadAssignments();
      setSelected((prev) => (prev ? { ...prev, status: "submitted" } : prev));
      setIsEditMode(false);
      setNewFiles([]);
    } catch (err) {
      console.error("[Assignments] Submission failed", err);
      setError(err?.response?.data?.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  }, [assignmentType, buildSubmissionPayload, isEditMode, isSubmittedState, loadAssignments, newFiles.length, selected]);

  return (
    <UserLayout>
      <PageShell
        title="Assignments"
        subtitle="Track your pending, submitted, and graded assignments."
      >
        <TabBar tabs={ASSIGNMENT_TABS} active={activeTab} onChange={setActiveTab} />

        <div className="mt-3 inline-flex rounded-xl border border-gray-800 bg-[#0d0d0d] p-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${typeFilter === "all" ? "bg-yellow-400 text-black font-semibold" : "text-gray-300 hover:text-white"}`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("recorded")}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${typeFilter === "recorded" ? "bg-blue-400 text-black font-semibold" : "text-gray-300 hover:text-white"}`}
          >
            Recorded
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("live")}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${typeFilter === "live" ? "bg-green-400 text-black font-semibold" : "text-gray-300 hover:text-white"}`}
          >
            Live Batches
          </button>
        </div>

        {loading && <p className="text-gray-500 text-sm py-4">Loading assignments...</p>}
        {!loading && error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {!loading && filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No assignments here" subtitle="Check another tab." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((asgn, i) => (
              <AssignmentCard
                key={asgn._id}
                assignment={asgn}
                submission={submissionMap[String(asgn._id)]}
                delay={i * 0.05}
                onOpen={() => setSelected(asgn)}
              />
            ))}
          </div>
        )}
      </PageShell>

      {selected && selectedSubmission?.status === "graded" && (
        <AssignmentFeedback
          assignment={selected}
          submission={{
            ...selectedSubmission,
            feedback: selectedSubmission?.feedback || selectedSubmission?.instructorFeedback,
          }}
          onClose={() => setSelected(null)}
        />
      )}

      {selected && selectedSubmission?.status !== "graded" && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-gray-800 bg-[#111] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <p className="text-xs text-gray-500">{selected?.course?.title || "Course Assignment"}</p>
                <h3 className="text-white font-semibold">{selected?.title}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid gap-5 overflow-y-auto">
              <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-6">{selected?.description}</p>
                {selected?.instructions && (
                  <div className="mt-3">
                    <p className="text-xs text-yellow-400 font-semibold mb-1">Instructions</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-6">{selected.instructions}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Due: {formatDateTime(selected?.dueDate)} | Max Score: {selected?.maxScore}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Grading: {gradingType === "auto" ? "Auto grading (instant for MCQ)" : "Manual instructor review"}
                </p>
                {isObjectiveAssignment && (
                  <p className="text-xs text-emerald-300 mt-1">
                    Objective assignment: answers are auto-graded after submission.
                  </p>
                )}
                {gradingType === "auto" && isSubmittedState && ["queued", "processing"].includes(gradingStatus) && (
                  <p className="text-xs text-cyan-300 mt-2">
                    Auto grading is in progress. Your score will appear shortly.
                  </p>
                )}
                {gradingType === "auto" && isSubmittedState && gradingStatus === "failed" && (
                  <p className="text-xs text-red-300 mt-2">
                    Auto grading failed. Please update and resubmit, or contact support.
                  </p>
                )}
                {isSubmissionLockedByDeadline && (
                  <p className="text-xs text-red-400 mt-2">
                    Submission is closed because the deadline has passed and late submission is disabled.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-white mb-2">Your Submission</p>
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Type: {assignmentType}</p>

                {isObjectiveAssignment && (
                  <div className="space-y-3 mb-3">
                    {(selected?.questions || []).map((question, index) => {
                      const questionId = String(question?.questionId || index + 1);
                      const questionType = String(question?.type || assessmentType || "mcq").toLowerCase();
                      const answer = objectiveAnswers?.[questionId];

                      return (
                        <div key={questionId} className="rounded-xl border border-gray-700 bg-black/30 p-3">
                          <p className="text-sm text-gray-100 mb-2">
                            Q{index + 1}. {question?.question}
                            {questionType === "mcq" && Array.isArray(question?.correctAnswers) && question.correctAnswers.length > 1
                              ? " (multiple correct option for this -> select multiple)"
                              : ""}
                          </p>

                          {questionType === "mcq" && (
                            <div className="grid gap-2">
                              {(question?.options || []).map((option, optIndex) => {
                                const allowMulti = Array.isArray(question?.correctAnswers) && question.correctAnswers.length > 1;
                                const values = Array.isArray(answer)
                                  ? answer
                                  : (String(answer || "").trim() ? [String(answer)] : []);
                                const isChecked = values.includes(option);

                                return (
                                  <label key={`${questionId}-${optIndex}`} className="flex items-center gap-2 text-sm text-gray-200">
                                    <input
                                      type={allowMulti ? "checkbox" : "radio"}
                                      name={`question-${questionId}`}
                                      checked={isChecked}
                                      disabled={!canEditNow}
                                      onChange={(event) => {
                                        if (allowMulti) {
                                          const current = Array.isArray(values) ? [...values] : [];
                                          if (event.target.checked) {
                                            updateObjectiveAnswer(questionId, Array.from(new Set([...current, option])));
                                          } else {
                                            updateObjectiveAnswer(questionId, current.filter((item) => item !== option));
                                          }
                                        } else {
                                          updateObjectiveAnswer(questionId, option);
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
                                <label key={`${questionId}-${option}`} className="flex items-center gap-2 text-sm text-gray-200">
                                  <input
                                    type="radio"
                                    name={`question-${questionId}`}
                                    checked={String(answer || "") === option}
                                    disabled={!canEditNow}
                                    onChange={() => updateObjectiveAnswer(questionId, option)}
                                  />
                                  {option}
                                </label>
                              ))}
                            </div>
                          )}

                          {questionType === "matching" && (
                            <div className="grid gap-2">
                              {(question?.pairs || []).map((pair, pairIdx) => {
                                const term = String(pair?.term || `Term ${pairIdx + 1}`);
                                const mapping = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
                                const selectedValue = mapping?.[term] || "";
                                const optionList = Array.from(
                                  new Set(
                                    (question?.pairs || []).flatMap((item) => {
                                      if (Array.isArray(item?.options) && item.options.length > 0) return item.options;
                                      return item?.correctOption ? [item.correctOption] : [];
                                    })
                                  )
                                );

                                return (
                                  <div key={`${questionId}-${pairIdx}`} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                    <p className="text-xs text-gray-400">{term}</p>
                                    <select
                                      value={selectedValue}
                                      disabled={!canEditNow}
                                      onChange={(event) => {
                                        const nextMap = { ...mapping, [term]: event.target.value };
                                        updateObjectiveAnswer(questionId, nextMap);
                                      }}
                                      className="w-full rounded-lg border border-gray-700 bg-black/40 text-gray-100 px-3 py-2 text-sm"
                                    >
                                      <option value="">Select option</option>
                                      {optionList.map((option, optionIdx) => (
                                        <option key={`${questionId}-${pairIdx}-${optionIdx}`} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isObjectiveAssignment && (assignmentType === "text" || assignmentType === "mixed") && (
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={8}
                    disabled={!canEditNow}
                    placeholder="Write your answer here..."
                    className="w-full rounded-xl border border-gray-700 bg-black/40 text-gray-100 px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 disabled:opacity-60"
                  />
                )}

                {!isObjectiveAssignment && (assignmentType === "url" || assignmentType === "mixed") && (
                  <div className="grid gap-2 mt-3">
                    {draftLinks.map((link, index) => (
                      <div key={`link-${index}`} className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-gray-500" />
                        <input
                          value={link}
                          disabled={!canEditNow}
                          onChange={(e) => updateLink(index, e.target.value)}
                          placeholder="https://example.com/reference"
                          className="w-full rounded-xl border border-gray-700 bg-black/40 text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400/50 disabled:opacity-60"
                        />
                      </div>
                    ))}
                    {canEditNow && (
                      <button
                        onClick={addLinkInput}
                        className="w-fit text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        + Add URL
                      </button>
                    )}
                  </div>
                )}

                {!isObjectiveAssignment && (assignmentType === "file" || assignmentType === "mixed") && (
                  <div className="grid gap-2 mt-3">
                    <div className="rounded-xl border border-dashed border-gray-700 p-3 bg-black/30">
                      <label className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>{canEditNow ? "Upload files" : "Files are locked"}</span>
                        {canEditNow && (
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            onChange={(e) => {
                              const selectedFiles = Array.from(e.target.files || []);
                              setNewFiles((prev) => [...prev, ...selectedFiles]);
                            }}
                          />
                        )}
                      </label>
                      <p className="text-xs text-gray-500 mt-2">Allowed: pdf/doc/docx/ppt/pptx/xls/xlsx/txt/csv/md/jpg/jpeg/png/webp/mp4/webm/zip</p>
                    </div>

                    {existingFiles.length > 0 && (
                      <div className="rounded-xl border border-gray-800 bg-black/20 p-3">
                        <p className="text-xs text-gray-500 mb-2">Already Submitted Files</p>
                        <div className="grid gap-1">
                          {existingFiles.map((file, index) => (
                            <a key={`existing-file-${index}`} href={file.url} target="_blank" rel="noreferrer" className="text-sm text-yellow-300 hover:text-yellow-200">
                              {file.name || `File ${index + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {newFiles.length > 0 && (
                      <div className="rounded-xl border border-gray-800 bg-black/20 p-3">
                        <p className="text-xs text-gray-500 mb-2">New Files To Submit</p>
                        <div className="grid gap-1">
                          {newFiles.map((file, index) => (
                            <div key={`new-file-${index}`} className="flex items-center justify-between gap-2">
                              <span className="text-sm text-gray-200 truncate">{file.name}</span>
                              {canEditNow && (
                                <button onClick={() => removeNewFile(index)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="sticky bottom-0 bg-linear-to-t from-[#111] via-[#111] to-transparent pt-4 mt-3 flex justify-end">
                  {isSubmittedState && !isEditMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-semibold cursor-not-allowed"
                      >
                        Submitted
                      </button>
                      <button
                        onClick={() => setIsEditMode(true)}
                        disabled={isSubmissionLockedByDeadline}
                        className="px-4 py-2 rounded-lg border border-yellow-400/40 text-yellow-300 text-sm font-semibold"
                      >
                        Update Submission
                      </button>
                    </div>
                  ) : (
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={submitting || !canEditNow}
                    className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-semibold disabled:opacity-50"
                  >
                    {isSubmissionLockedByDeadline
                      ? "Submission Closed"
                      : submitting
                        ? "Submitting..."
                        : hasExistingSubmission
                          ? "Update Submission"
                          : "Submit Assignment"}
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
