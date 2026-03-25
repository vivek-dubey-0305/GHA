/**
 * pages/Assignments/Assignments.jsx
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
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

  const [activeTab, setActiveTab] = useState("All");
  const [selected, setSelected] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftText, setDraftText] = useState("");

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  const loadSubmissions = useCallback(async () => {
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
  }, [selectedSubmission]);

  const handleSubmitAssignment = useCallback(async () => {
    if (!selected?._id || !draftText.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.post(`/submissions/assignment/${selected._id}`, {
        content: {
          text: draftText.trim(),
        },
      });

      await loadAssignments();
      setSelected((prev) => (prev ? { ...prev, status: "submitted" } : prev));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  }, [draftText, loadAssignments, selected]);

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
          <div className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-[#111] overflow-hidden">
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

            <div className="p-5 grid gap-5">
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
              </div>

              <div>
                <p className="text-sm font-semibold text-white mb-2">Your Submission</p>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={8}
                  placeholder="Write your answer here..."
                  className="w-full rounded-xl border border-gray-700 bg-black/40 text-gray-100 px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={submitting || !draftText.trim()}
                    className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-semibold disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Assignment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
