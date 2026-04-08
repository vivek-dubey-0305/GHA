import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Video, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  Clock, Users, BookOpen, Radio, Calendar, Plus, Play, Square,
  Copy, CheckCircle, Settings, Trash2, Zap, Eye, Search,
  MessageCircleQuestion, PhoneCall, Briefcase, ArrowRight, X, Loader2,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getMyLiveClasses, createLiveClass, createInstantSession,
  endLiveClass, deleteLiveClass, getAvailableInstructors,
  getEnrolledStudents, requestAdminCall,
  getStreamCredentials, getObsConfig, clearMutationState,
  clearCreatedSession, clearEnrolledStudents,
  selectLiveClasses, selectLiveClassPagination,
  selectLiveClassesLoading, selectLiveClassesError,
  selectMutationLoading, selectMutationSuccess, selectMutationError,
  selectStreamCredentials, selectStreamCredentialsLoading,
  selectObsConfig, selectObsConfigLoading,
  selectAvailableInstructors, selectEnrolledStudents,
  selectEnrolledStudentsLoading, selectCreatedSession,
} from '../../redux/slices/liveclass.slice';
import { getMyCourses, selectCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live Now' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SESSION_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'doubt', label: 'Doubt Session' },
  { value: 'instant', label: 'Instant' },
  { value: 'instructor', label: 'Instructor Call' },
  { value: 'business', label: 'Business Call' },
];

const INSTANT_PURPOSES = [
  { value: 'doubt', label: 'Doubt Solving', desc: 'Select a course and invite students', icon: MessageCircleQuestion, color: 'yellow' },
  { value: 'instructor', label: 'Instructor Call', desc: 'Call another instructor for discussion', icon: PhoneCall, color: 'cyan' },
  { value: 'business', label: 'Admin Business Call', desc: 'Request a call with admin', icon: Briefcase, color: 'pink' },
];

const statusBadge = (status) => {
  const map = {
    scheduled: 'border-gray-600 text-gray-300',
    live: 'border-green-500 text-green-400 bg-green-500/10',
    completed: 'border-gray-700 text-gray-500',
    cancelled: 'border-gray-800 text-gray-600',
  };
  return map[status] || 'border-gray-700 text-gray-500';
};

const sessionTypeBadge = (type) => {
  const map = {
    lecture: 'text-purple-400 bg-purple-500/10', doubt: 'text-yellow-400 bg-yellow-500/10',
    instant: 'text-orange-400 bg-orange-500/10', instructor: 'text-cyan-400 bg-cyan-500/10',
    business: 'text-pink-400 bg-pink-500/10',
  };
  return map[type] || 'text-gray-400 bg-gray-500/10';
};

const inputCls = 'w-full bg-[#0d0d0d] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-600';
const selectCls = 'w-full bg-[#0d0d0d] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-600';

export default function LiveClasses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const liveClasses = useSelector(selectLiveClasses);
  const pagination = useSelector(selectLiveClassPagination);
  const loading = useSelector(selectLiveClassesLoading);
  const error = useSelector(selectLiveClassesError);
  const mutLoading = useSelector(selectMutationLoading);
  const mutSuccess = useSelector(selectMutationSuccess);
  const mutError = useSelector(selectMutationError);
  const streamCreds = useSelector(selectStreamCredentials);
  const streamCredsLoading = useSelector(selectStreamCredentialsLoading);
  const obsConfig = useSelector(selectObsConfig);
  const obsConfigLoading = useSelector(selectObsConfigLoading);
  const availableInstructors = useSelector(selectAvailableInstructors);
  const enrolledStudents = useSelector(selectEnrolledStudents);
  const enrolledStudentsLoading = useSelector(selectEnrolledStudentsLoading);
  const courses = useSelector(selectCourses);
  const createdSession = useSelector(selectCreatedSession);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showObs, setShowObs] = useState(false);
  const [copied, setCopied] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Instant flow
  const [showInstant, setShowInstant] = useState(false);
  const [instantStep, setInstantStep] = useState('purpose'); // 'purpose' | 'configure' | 'confirm'
  const [instantPurpose, setInstantPurpose] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedInstructors, setSelectedInstructors] = useState([]);
  const [instantTitle, setInstantTitle] = useState('');
  const [instantDesc, setInstantDesc] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Create session form
  const [form, setForm] = useState({ title: '', description: '', sessionType: 'lecture', scheduledAt: '', duration: 60, maxParticipants: 100, course: '' });

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchData = useCallback(() => {
    dispatch(getMyLiveClasses({ page, limit: 10, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
//   useEffect(() => {
//   fetchData();
// }, [page, statusFilter]);
  // useEffect(() => { setPage(1); }, [statusFilter]);

  const resetInstantFlow = useCallback(() => {
    setShowInstant(false);
    setInstantStep('purpose');
    setInstantPurpose('');
    setSelectedCourse('');
    setSelectedStudents([]);
    setSelectedInstructors([]);
    setInstantTitle('');
    setInstantDesc('');
    setStudentSearch('');
    dispatch(clearEnrolledStudents());
  }, [dispatch]);

  // On mutation success: for instant/create, redirect to GoLiveSetup
  // useEffect(() => {
  //   if (mutSuccess && createdSession?._id) {
  //     dispatch(clearMutationState());
  //     dispatch(clearCreatedSession());
  //     navigate(`/instructor/live-classes/${createdSession._id}/setup`);
  //     return;
  //   }
  //   if (mutSuccess) {
  //     setShowCreate(false);
  //     setConfirmAction(null);
  //     resetInstantFlow();
  //     fetchData();
  //     const t = setTimeout(() => dispatch(clearMutationState()), 2000);
  //     return () => clearTimeout(t);
  //   }
  // }, [mutSuccess, createdSession, fetchData, dispatch, navigate, resetInstantFlow]);
  useEffect(() => {
    if (!mutSuccess) return;

    // case 1: instant session created
    if (createdSession?._id) {
      dispatch(clearMutationState());
      dispatch(clearCreatedSession());
      navigate(`/instructor/live-classes/${createdSession._id}/setup`);
      return;
    }

    // case 2: normal mutation
    queueMicrotask(() => {
      setShowCreate(false);
      setConfirmAction(null);
      resetInstantFlow();
    });

    fetchData();

    const t = setTimeout(() => dispatch(clearMutationState()), 2000);
    return () => clearTimeout(t);

  }, [mutSuccess, createdSession, fetchData, dispatch, navigate, resetInstantFlow]);
    
  const copyText = (text, key) => {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    };

  const handleCreate = () => {
    if (!form.title.trim()) return;
    dispatch(createLiveClass({
      ...form,
      duration: parseInt(form.duration) || 60,
      maxParticipants: parseInt(form.maxParticipants) || 100,
    }));
  };

  // ── Instant flow handlers ──
  const handlePurposeSelect = (purpose) => {
    setInstantPurpose(purpose);
    if (purpose === 'business') {
      // Admin request — no need for step 2, just send request
      setInstantStep('confirm');
      return;
    }
    setInstantStep('configure');
    if (purpose === 'doubt' && (!courses || courses.length === 0)) {
      dispatch(getMyCourses({ page: 1, limit: 100 }));
    }
    if (purpose === 'instructor') {
      dispatch(getAvailableInstructors());
    }
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    setSelectedStudents([]);
    if (courseId) dispatch(getEnrolledStudents(courseId));
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(s => s !== studentId) : [...prev, studentId]
    );
  };

  const toggleInstructor = (instructorId) => {
    setSelectedInstructors(prev =>
      prev.includes(instructorId) ? prev.filter(i => i !== instructorId) : [...prev, instructorId]
    );
  };

  const handleInstantCreate = () => {
    if (instantPurpose === 'business') {
      dispatch(requestAdminCall({ title: instantTitle || 'Business Call Request', description: instantDesc }));
      resetInstantFlow();
      return;
    }
    const body = {
      sessionType: instantPurpose,
      title: instantTitle || undefined,
      description: instantDesc || undefined,
      duration: 60,
    };
    if (instantPurpose === 'doubt') {
      body.courseId = selectedCourse;
      if (selectedStudents.length > 0) body.invitedStudentIds = selectedStudents;
    } else if (instantPurpose === 'instructor') {
      body.invitedInstructorIds = selectedInstructors;
    }
    dispatch(createInstantSession(body));
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    if (type === 'end') dispatch(endLiveClass(id));
    else if (type === 'delete') dispatch(deleteLiveClass(id));
  };

  const openObs = () => {
    setShowObs(true);
    if (!streamCreds) dispatch(getStreamCredentials());
    if (!obsConfig) dispatch(getObsConfig());
  };

  const filteredStudents = enrolledStudents.filter(s =>
    !studentSearch || (s.name || s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
  );
  const liveCourses = (courses || []).filter((course) => (course.type || 'recorded') === 'live');

  /* ───── Error state ───── */
  if (error && !liveClasses.length) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4"><AlertTriangle className="w-10 h-10 text-gray-400" /></div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load live classes</h2>
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
              <Video className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Live Classes</h1>
            </div>
            <p className="text-gray-500">{pagination?.total || liveClasses.length} total classes</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={openObs} className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium">
              <Settings className="w-4 h-4" /> OBS Setup
            </button>
            <button onClick={() => setShowInstant(true)} disabled={mutLoading} className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 border border-orange-600/40 text-orange-400 hover:bg-orange-600/30 rounded-lg transition-colors text-sm font-medium disabled:opacity-50">
              <Zap className="w-4 h-4" /> Instant
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              <Plus className="w-4 h-4" /> Create Session
            </button>
            <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mutation feedback */}
        {mutSuccess && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">Action completed successfully</div>}
        {mutError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{mutError}</div>}

        {/* Filter */}
        <div className="flex items-center gap-3">
          {/* <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls + ' w-auto'}> */}
          <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1); // reset page when filter changes
              }}
              className={selectCls + ' w-auto'}
            >
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* List */}
        {loading && !liveClasses.length ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-25" />
            ))}
          </div>
        ) : liveClasses.length > 0 ? (
          <div className="space-y-3">
            {liveClasses.map((lc) => (
              <div key={lc._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {lc.status === 'live' && <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" /></span>}
                      <h3 className="text-white font-semibold text-sm">{lc.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${sessionTypeBadge(lc.sessionType)}`}>{lc.sessionType}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusBadge(lc.status)}`}>{lc.status}</span>
                      {lc.isOwner === false && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Invited</span>}
                    </div>
                    {lc.description && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{lc.description}</p>}
                    {lc.isOwner === false && lc.instructor && (
                      <p className="text-gray-500 text-[11px] mt-1">Host: {lc.instructor.firstName} {lc.instructor.lastName}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                      {lc.course?.title && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {lc.course.title}</span>}
                      {lc.scheduledAt && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(lc.scheduledAt).toLocaleString()}</span>}
                      {lc.duration && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lc.duration} min</span>}
                      {lc.maxParticipants && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Max {lc.maxParticipants}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {lc.status === 'scheduled' && lc.isOwner !== false && (
                      <>
                        <button onClick={() => navigate(`/instructor/live-classes/${lc._id}/setup`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 border border-green-600/40 text-green-400 rounded-lg text-xs font-medium hover:bg-green-600/30 transition-colors">
                          <Play className="w-3.5 h-3.5" /> Go Live
                        </button>
                        <button onClick={() => setConfirmAction({ type: 'delete', id: lc._id, title: lc.title })} disabled={mutLoading} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {lc.status === 'scheduled' && lc.isOwner === false && (
                      <span className="text-xs text-gray-500">Waiting for host to go live...</span>
                    )}
                    {lc.status === 'live' && (
                      <>
                        <button onClick={() => navigate(`/instructor/live-classes/${lc._id}/room`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 border border-green-600/40 text-green-400 rounded-lg text-xs font-medium hover:bg-green-600/30 transition-colors">
                          <Radio className="w-3.5 h-3.5" /> {lc.isOwner === false ? 'Join Room' : 'Enter Room'}
                        </button>
                        {lc.isOwner !== false && (
                          <button onClick={() => setConfirmAction({ type: 'end', id: lc._id, title: lc.title })} disabled={mutLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-600/40 text-red-400 rounded-lg text-xs font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50">
                            <Square className="w-3.5 h-3.5" /> End
                          </button>
                        )}
                      </>
                    )}
                    {lc.status === 'completed' && lc.recordingAvailable && (
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Eye className="w-3.5 h-3.5" /> Recording</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Video className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No live classes found</h3>
            <p className="text-gray-500 text-sm">
              {statusFilter ? 'Try changing the filter' : 'Your scheduled live classes will appear here'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
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
      </div>

      {/* ═══════════════════════════════════════════════
          INSTANT LIVE MODAL — Multi-step
          ═══════════════════════════════════════════════ */}
      {showInstant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={resetInstantFlow}>
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" /> Instant Live
              </h2>
              <button onClick={resetInstantFlow} className="p-1 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* ── Step 1: Purpose Selection ── */}
            {instantStep === 'purpose' && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">What's the purpose of this session?</p>
                {INSTANT_PURPOSES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => handlePurposeSelect(p.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-${p.color}-500/40 hover:bg-${p.color}-500/5 transition-all text-left group`}
                  >
                    <div className={`p-2.5 rounded-lg bg-${p.color}-500/10`}>
                      <p.icon className={`w-5 h-5 text-${p.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white text-sm font-medium group-hover:text-white">{p.label}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{p.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {/* ── Step 2: Configure (Doubt) ── */}
            {instantStep === 'configure' && instantPurpose === 'doubt' && (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Select Course *</label>
                  <select value={selectedCourse} onChange={e => handleCourseSelect(e.target.value)} className={selectCls}>
                    <option value="">-- Choose a course --</option>
                    {liveCourses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                  {liveCourses.length === 0 && (
                    <p className="text-[11px] text-yellow-400 mt-1">No live batch courses available. Create a Live Batch course first.</p>
                  )}
                </div>

                {selectedCourse && (
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">
                      Invite Students {enrolledStudentsLoading && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
                    </label>
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className={inputCls + ' pl-9 text-xs'}
                        placeholder="Search students..."
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-800 rounded-lg p-2">
                      {filteredStudents.length > 0 ? filteredStudents.map(s => (
                        <label key={s._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(s._id)}
                            onChange={() => toggleStudent(s._id)}
                            className="rounded border-gray-600 bg-transparent text-green-500 focus:ring-0"
                          />
                          <span className="text-white text-xs flex-1 truncate">{s.name || s.email}</span>
                        </label>
                      )) : (
                        <p className="text-gray-600 text-xs text-center py-3">
                          {enrolledStudentsLoading ? 'Loading...' : 'No students found'}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-600 text-[10px] mt-1">
                      {selectedStudents.length > 0 ? `${selectedStudents.length} selected` : 'Leave empty to invite all enrolled students'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Title (optional)</label>
                  <input value={instantTitle} onChange={e => setInstantTitle(e.target.value)} className={inputCls} placeholder="Doubt session title..." />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setInstantStep('purpose')} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Back</button>
                  <button
                    onClick={handleInstantCreate}
                    disabled={mutLoading || !selectedCourse}
                    className="px-5 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    {mutLoading ? 'Creating...' : 'Create & Setup OBS'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Configure (Instructor Call) ── */}
            {instantStep === 'configure' && instantPurpose === 'instructor' && (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Select Instructors to Invite</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-800 rounded-lg p-2">
                    {availableInstructors.length > 0 ? availableInstructors.map(inst => (
                      <label key={inst._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInstructors.includes(inst._id)}
                          onChange={() => toggleInstructor(inst._id)}
                          className="rounded border-gray-600 bg-transparent text-cyan-500 focus:ring-0"
                        />
                        <span className="text-white text-xs flex-1 truncate">
                          {inst.firstName} {inst.lastName}
                          <span className="text-gray-500 ml-1">({inst.email})</span>
                        </span>
                      </label>
                    )) : (
                      <p className="text-gray-600 text-xs text-center py-3">No instructors available</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Title (optional)</label>
                  <input value={instantTitle} onChange={e => setInstantTitle(e.target.value)} className={inputCls} placeholder="Call title..." />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setInstantStep('purpose')} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Back</button>
                  <button
                    onClick={handleInstantCreate}
                    disabled={mutLoading || selectedInstructors.length === 0}
                    className="px-5 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
                  >
                    {mutLoading ? 'Creating...' : 'Create & Setup OBS'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Admin Business Call Request ── */}
            {instantStep === 'confirm' && instantPurpose === 'business' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  This will send a request to the admin. They will create and schedule the session.
                </p>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Subject</label>
                  <input value={instantTitle} onChange={e => setInstantTitle(e.target.value)} className={inputCls} placeholder="What's this about?" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Description</label>
                  <textarea value={instantDesc} onChange={e => setInstantDesc(e.target.value)} className={inputCls} rows={3} placeholder="Brief description..." />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => { setInstantStep('purpose'); setInstantPurpose(''); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Back</button>
                  <button
                    onClick={handleInstantCreate}
                    disabled={mutLoading}
                    className="px-5 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors disabled:opacity-50"
                  >
                    {mutLoading ? 'Sending...' : 'Send Request to Admin'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── Create Session Modal ───── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-white text-lg font-semibold">Create Live Session</h2>
            <div className="space-y-3">
              <div><label className="text-gray-400 text-xs mb-1 block">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Session title" /></div>
              <div><label className="text-gray-400 text-xs mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} rows={2} placeholder="Brief description..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Session Type</label><select value={form.sessionType} onChange={e => setForm(f => ({ ...f, sessionType: e.target.value }))} className={selectCls}>{SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Scheduled At</label><input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Duration (min)</label><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className={inputCls} min="15" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Max Participants</label><input type="number" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} className={inputCls} min="1" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={mutLoading || !form.title.trim()} className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
                {mutLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── OBS Setup Modal ───── */}
      {showObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowObs(false)}>
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-white text-lg font-semibold flex items-center gap-2"><Settings className="w-5 h-5" /> OBS / Stream Setup</h2>
            {streamCredsLoading || obsConfigLoading ? (
              <div className="py-8 text-center text-gray-500">Loading stream credentials...</div>
            ) : streamCreds ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs">RTMP Server URL</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={streamCreds.rtmpUrl || ''} className={inputCls + ' flex-1 text-xs font-mono'} />
                    <button onClick={() => copyText(streamCreds.rtmpUrl, 'rtmp')} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                      {copied === 'rtmp' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs">Stream Key</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={streamCreds.rtmpKey || ''} type="password" className={inputCls + ' flex-1 text-xs font-mono'} />
                    <button onClick={() => copyText(streamCreds.rtmpKey, 'key')} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                      {copied === 'key' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {streamCreds.srtUrl && (
                  <div className="space-y-2">
                    <label className="text-gray-400 text-xs">SRT URL (alternative)</label>
                    <div className="flex items-center gap-2">
                      <input readOnly value={streamCreds.srtUrl} className={inputCls + ' flex-1 text-xs font-mono'} />
                      <button onClick={() => copyText(streamCreds.srtUrl, 'srt')} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        {copied === 'srt' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {obsConfig?.obsSettings && (
                  <div className="p-3 bg-[#0d0d0d] rounded-lg border border-gray-800 space-y-2">
                    <h4 className="text-gray-300 text-xs font-semibold">OBS Quick Setup</h4>
                    <p className="text-gray-500 text-[11px]">In OBS, go to Settings → Stream, choose "Custom", and paste the Server URL and Stream Key above.</p>
                    <div className="text-[11px] text-gray-500 space-y-1">
                      <p>Service: <span className="text-gray-300">Custom</span></p>
                      <p>Server: <span className="text-gray-300 font-mono">{obsConfig.obsSettings.server}</span></p>
                      <p>Key: <span className="text-gray-300 font-mono">••••••</span></p>
                    </div>
                  </div>
                )}
                <p className="text-gray-600 text-[11px]">These credentials are permanent for your account. Use the same stream key for all sessions.</p>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">Could not load credentials. Try again.</div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowObs(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Confirm Action Modal ───── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-white text-lg font-semibold">
              {confirmAction.type === 'end' && 'End Stream?'}
              {confirmAction.type === 'delete' && 'Delete Session?'}
            </h2>
            <p className="text-gray-400 text-sm">
              {confirmAction.type === 'end' && `End the live stream for "${confirmAction.title}"? All viewers will be disconnected.`}
              {confirmAction.type === 'delete' && `Permanently delete "${confirmAction.title}"?`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleConfirm} disabled={mutLoading} className="px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-red-600 text-white hover:bg-red-700">
                {mutLoading ? 'Processing...' : confirmAction.type === 'end' ? 'End Stream' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </InstructorLayout>
  );
}
