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
  const [selected, setSelected] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftLinks, setDraftLinks] = useState([""]);
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
    const courseMap = new Map(
      (myEnrollments || []).map((e) => [String(e?.course?._id || e?.course), e?.course])
    );
    const courseIds = Array.from(courseMap.keys()).filter(Boolean);

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

  const assignmentType = selected?.type || "text";
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

    if (assignmentType === "text" && (!hasText || hasLinks || hasFiles)) {
      throw new Error("This assignment accepts only text.");
    }
    if (assignmentType === "url" && (!hasLinks || hasText || hasFiles)) {
      throw new Error("This assignment accepts only URLs.");
    }
    if (assignmentType === "file" && (!hasFiles || hasText || hasLinks)) {
      throw new Error("This assignment accepts only files.");
    }
    if (assignmentType === "mixed" && !hasText && !hasLinks && !hasFiles) {
      throw new Error("Add at least one text, URL, or file item before submit.");
    }

    const content = {
      text: draftText.trim(),
      links,
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
                {isSubmissionLockedByDeadline && (
                  <p className="text-xs text-red-400 mt-2">
                    Submission is closed because the deadline has passed and late submission is disabled.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-white mb-2">Your Submission</p>
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Type: {assignmentType}</p>

                {(assignmentType === "text" || assignmentType === "mixed") && (
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={8}
                    disabled={!canEditNow}
                    placeholder="Write your answer here..."
                    className="w-full rounded-xl border border-gray-700 bg-black/40 text-gray-100 px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 disabled:opacity-60"
                  />
                )}

                {(assignmentType === "url" || assignmentType === "mixed") && (
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

                {(assignmentType === "file" || assignmentType === "mixed") && (
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
