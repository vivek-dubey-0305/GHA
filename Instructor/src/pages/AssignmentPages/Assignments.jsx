import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ClipboardList, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  BookOpen, Clock, Send, X, Link as LinkIcon, FileText,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyAssignments, getPendingSubmissions,
  getAssignmentSubmissions, gradeSubmission, returnSubmissionForRevision, reportSuspiciousSubmission,
  selectAssignments, selectAssignmentPagination, selectAssignmentsLoading, selectAssignmentsError,
  selectPendingSubmissions, selectPendingSubmissionsLoading,
  selectAssignmentSubmissions, selectAssignmentSubmissionsLoading, selectAssignmentSubmissionsError,
  selectAssignmentActionLoading, selectAssignmentActionError, selectAssignmentActionSuccess,
  clearAssignmentActionState,
} from '../../redux/slices/assignment.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import apiClient from '../../utils/api.utils';

export default function Assignments() {
  const dispatch = useDispatch();
  const assignments = useSelector(selectAssignments);
  const pagination = useSelector(selectAssignmentPagination);
  const loading = useSelector(selectAssignmentsLoading);
  const error = useSelector(selectAssignmentsError);
  const pendingSubmissions = useSelector(selectPendingSubmissions);
  const pendingLoading = useSelector(selectPendingSubmissionsLoading);
  const assignmentSubmissions = useSelector(selectAssignmentSubmissions);
  const assignmentSubmissionsLoading = useSelector(selectAssignmentSubmissionsLoading);
  const assignmentSubmissionsError = useSelector(selectAssignmentSubmissionsError);
  const actionLoading = useSelector(selectAssignmentActionLoading);
  const actionError = useSelector(selectAssignmentActionError);
  const actionSuccess = useSelector(selectAssignmentActionSuccess);

  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('assignments'); // 'assignments' | 'submissions'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeNote, setGradeNote] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportFiles, setReportFiles] = useState([]);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyAssignments({ page, limit: 10 }));
    dispatch(getPendingSubmissions({ limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!actionSuccess && !actionError) return;
    console.debug('[InstructorAssignments] submission action result', { actionSuccess, actionError });
  }, [actionError, actionSuccess]);

  const openAssignmentSubmissions = useCallback((assignment) => {
    setSelectedAssignment(assignment);
    setSelectedSubmission(null);
    dispatch(clearAssignmentActionState());
    console.debug('[InstructorAssignments] loading submissions for assignment', assignment?._id);
    dispatch(getAssignmentSubmissions({ assignmentId: assignment._id }));
  }, [dispatch]);

  const openSubmissionReview = useCallback(async (submission) => {
    dispatch(clearAssignmentActionState());
    console.debug('[InstructorAssignments] opening submission review', submission?._id);

    try {
      const needsDetails = !submission?.content;
      const detail = needsDetails
        ? (await apiClient.get(`/submissions/instructor/${submission._id}`))?.data?.data
        : submission;

      setSelectedSubmission(detail);
      setGradeScore(detail?.score ?? '');
      setGradeNote(detail?.instructorFeedback || '');
      setReportReason('');
      setReportFiles([]);
    } catch (err) {
      console.error('[InstructorAssignments] failed to load submission detail', err);
    }
  }, [dispatch]);

  const closeSubmissionReview = () => {
    setSelectedSubmission(null);
    setGradeScore('');
    setGradeNote('');
    setReportReason('');
    setReportFiles([]);
  };

  const refreshSelectedAssignmentSubmissions = useCallback(() => {
    if (!selectedAssignment?._id) return;
    dispatch(getAssignmentSubmissions({ assignmentId: selectedAssignment._id }));
  }, [dispatch, selectedAssignment]);

  const onGradeSubmit = async () => {
    if (!selectedSubmission?._id) return;
    const score = Number(gradeScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) return;

    const result = await dispatch(gradeSubmission({
      submissionId: selectedSubmission._id,
      payload: {
        score,
        feedback: gradeNote,
      },
    }));

    if (!result.error) {
      refreshSelectedAssignmentSubmissions();
      fetchData();
      closeSubmissionReview();
    }
  };

  const onReturnForRevision = async () => {
    if (!selectedSubmission?._id) return;
    const result = await dispatch(returnSubmissionForRevision({
      submissionId: selectedSubmission._id,
      feedback: gradeNote || 'Please revise and resubmit.',
    }));

    if (!result.error) {
      refreshSelectedAssignmentSubmissions();
      fetchData();
      closeSubmissionReview();
    }
  };

  const onReportSuspicious = async () => {
    if (!selectedSubmission?._id) return;
    if (!reportReason.trim() || reportReason.trim().length < 10) return;

    const result = await dispatch(reportSuspiciousSubmission({
      submissionId: selectedSubmission._id,
      reason: reportReason.trim(),
      evidenceFiles: reportFiles,
    }));

    if (!result.error) {
      refreshSelectedAssignmentSubmissions();
      fetchData();
      closeSubmissionReview();
    }
  };

  if (error && !assignments.length) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4"><AlertTriangle className="w-10 h-10 text-gray-400" /></div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load assignments</h2>
            <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors mt-4">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ClipboardList className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Assignments</h1>
            </div>
            <p className="text-gray-500">
              {assignments.length} assignments &middot; {pendingSubmissions.length} pending reviews
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] border border-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('assignments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'assignments' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setTab('submissions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              tab === 'submissions' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending Reviews
            {pendingSubmissions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">
                {pendingSubmissions.length}
              </span>
            )}
          </button>
        </div>

        {/* Assignments Tab */}
        {tab === 'assignments' && (
          loading && !assignments.length ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-25" />
              ))}
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{assignment.title}</h3>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{assignment.description || 'No description'}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {assignment.course?.title || 'No course'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${assignment.gradingType === 'auto' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {assignment.gradingType === 'auto' ? 'Auto Graded' : 'Manual Graded'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-700/70 text-gray-300 uppercase">
                          {assignment.assessmentType || 'subjective'}
                        </span>
                        {assignment.dueDate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                        {assignment.maxScore && <span>Max Score: {assignment.maxScore}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => openAssignmentSubmissions(assignment)}
                      className="px-3 py-2 rounded-lg border border-gray-700 text-gray-200 text-xs hover:border-gray-500"
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="w-12 h-12 text-gray-700 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-gray-500 text-sm">Assignments you create will appear here</p>
            </div>
          )
        )}

        {/* Pending Submissions Tab */}
        {tab === 'submissions' && (
          pendingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-22.5" />
              ))}
            </div>
          ) : pendingSubmissions.length > 0 ? (
            <div className="space-y-3">
              {pendingSubmissions.map((sub) => (
                <div key={sub._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white/5">
                        <Send className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium">
                          {sub.user?.firstName} {sub.user?.lastName}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {sub.assignment?.title || 'Unknown Assignment'} &middot; {sub.course?.title || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-500">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {sub.assignment?.gradingType === 'auto' ? 'Auto grading' : 'Manual grading'}
                      </p>
                      {sub.assignment?.maxScore && (
                        <p className="text-xs text-gray-600 mt-0.5">Max: {sub.assignment.maxScore}</p>
                      )}
                      <button
                        onClick={() => openSubmissionReview(sub)}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs border border-gray-700 text-gray-200 hover:border-gray-500"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Send className="w-12 h-12 text-gray-700 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No pending submissions</h3>
              <p className="text-gray-500 text-sm">All submissions have been reviewed</p>
            </div>
          )
        )}

        {/* Pagination for assignments */}
        {tab === 'assignments' && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span></span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="p-2 rounded-lg bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {selectedAssignment && (
          <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-xl border border-gray-800 bg-[#0f0f10]">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Submissions</p>
                  <h3 className="text-white font-semibold">{selectedAssignment.title}</h3>
                </div>
                <button onClick={() => setSelectedAssignment(null)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">
                {assignmentSubmissionsLoading && <p className="text-sm text-gray-400">Loading submissions...</p>}
                {!assignmentSubmissionsLoading && assignmentSubmissionsError && (
                  <p className="text-sm text-red-400">{assignmentSubmissionsError}</p>
                )}
                {!assignmentSubmissionsLoading && !assignmentSubmissionsError && assignmentSubmissions.length === 0 && (
                  <p className="text-sm text-gray-500">No submissions available for this assignment.</p>
                )}

                {assignmentSubmissions.map((sub) => (
                  <div key={sub._id} className="rounded-xl border border-gray-800 p-4 bg-[#131316] flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white font-medium">{sub.user?.firstName} {sub.user?.lastName}</p>
                      <p className="text-xs text-gray-500 mt-1">Status: {sub.status} | Attempt: {sub.attemptNumber || 1}</p>
                    </div>
                    <button
                      onClick={() => openSubmissionReview(sub)}
                      className="px-3 py-1.5 rounded-lg text-xs border border-gray-700 text-gray-200 hover:border-gray-500"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedSubmission && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-[#0e0f10]">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Submission Review</p>
                  <h3 className="text-white font-semibold">{selectedSubmission.assignment?.title || 'Assignment'}</h3>
                </div>
                <button onClick={closeSubmissionReview} className="p-2 rounded-lg hover:bg-gray-800 text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 grid gap-5">
                {actionError && <p className="text-sm text-red-400">{actionError}</p>}
                {actionSuccess && <p className="text-sm text-green-400">{actionSuccess}</p>}

                <div className="rounded-xl border border-gray-800 p-4 bg-[#151517]">
                  <p className="text-xs text-gray-500 mb-2">Student</p>
                  <p className="text-sm text-white">{selectedSubmission.user?.firstName} {selectedSubmission.user?.lastName} ({selectedSubmission.user?.email})</p>
                  <p className="text-xs text-gray-500 mt-2">Status: {selectedSubmission.status} | Submitted: {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">Grading: {selectedSubmission.assignment?.gradingType || selectedSubmission.gradingType || 'manual'}</p>
                </div>

                <div className="rounded-xl border border-gray-800 p-4 bg-[#151517]">
                  <p className="text-xs text-gray-500 mb-2">Text</p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{selectedSubmission.content?.text || 'No text submitted.'}</p>
                </div>

                <div className="rounded-xl border border-gray-800 p-4 bg-[#151517]">
                  <p className="text-xs text-gray-500 mb-2">Links</p>
                  {(selectedSubmission.content?.links || []).length === 0 && <p className="text-sm text-gray-500">No links submitted.</p>}
                  {(selectedSubmission.content?.links || []).map((link, index) => (
                    <a
                      key={`${link.url}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> {link.title || link.url}
                    </a>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-800 p-4 bg-[#151517]">
                  <p className="text-xs text-gray-500 mb-2">Files</p>
                  {(selectedSubmission.content?.files || []).length === 0 && <p className="text-sm text-gray-500">No files submitted.</p>}
                  {(selectedSubmission.content?.files || []).map((file, index) => (
                    <a
                      key={`${file.url}-${index}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-yellow-300 hover:text-yellow-200"
                    >
                      <FileText className="w-3.5 h-3.5" /> {file.name || `File ${index + 1}`}
                    </a>
                  ))}
                </div>

                {['mcq', 'true_false', 'matching'].includes(String(selectedSubmission.assignment?.assessmentType || '').toLowerCase()) && (
                  <div className="rounded-xl border border-gray-800 p-4 bg-[#151517] grid gap-3">
                    <p className="text-xs text-gray-500">Objective Answers</p>
                    {(selectedSubmission.assignment?.questions || []).map((question, index) => {
                      const questionId = String(question?.questionId || index + 1);
                      const answers = selectedSubmission.content?.mcqAnswers || {};
                      const studentAnswer = answers?.[questionId];
                      const type = String(question?.type || selectedSubmission.assignment?.assessmentType || 'mcq').toLowerCase();

                      return (
                        <div key={questionId} className="rounded-lg border border-gray-800 bg-black/30 p-3">
                          <p className="text-sm text-gray-100">Q{index + 1}. {question?.question}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase">Type: {type}</p>
                          <p className="text-xs text-gray-400 mt-2">Student Answer:</p>
                          <pre className="text-xs text-gray-200 whitespace-pre-wrap mt-1">{typeof studentAnswer === 'object' ? JSON.stringify(studentAnswer, null, 2) : String(studentAnswer || 'Not answered')}</pre>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-xl border border-gray-800 p-4 bg-[#151517] grid gap-3">
                  <p className="text-xs text-gray-500">Grading</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      placeholder="Score (0-100)"
                      className="px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-gray-200"
                    />
                    <input
                      value={gradeNote}
                      onChange={(e) => setGradeNote(e.target.value)}
                      placeholder="Feedback note"
                      className="px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-gray-200"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={actionLoading}
                      onClick={onGradeSubmit}
                      className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold disabled:opacity-60"
                    >
                      {actionLoading ? 'Saving...' : 'Save Grade'}
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={onReturnForRevision}
                      className="px-4 py-2 rounded-lg border border-gray-700 text-gray-100 text-xs disabled:opacity-60"
                    >
                      Return For Revision
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-red-900/50 p-4 bg-red-950/20 grid gap-3">
                  <p className="text-xs text-red-300">Suspicious Content Report</p>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={3}
                    placeholder="Describe why this submission is suspicious..."
                    className="px-3 py-2 rounded-lg bg-black/40 border border-red-900/50 text-sm text-gray-200"
                  />
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setReportFiles(Array.from(e.target.files || []))}
                    className="text-xs text-gray-300"
                  />
                  <button
                    disabled={actionLoading || reportReason.trim().length < 10}
                    onClick={onReportSuspicious}
                    className="w-fit px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold disabled:opacity-60"
                  >
                    Report And Temporary Lock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
