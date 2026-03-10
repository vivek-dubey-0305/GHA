import React, { useState, useEffect, useCallback, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, Save, Trash2, FileText, Image as ImageIcon, Video,
  BookOpen, Layers, Award, AlertCircle, File, Plus, Loader2, RefreshCw
} from 'lucide-react';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { Button, Switch, Separator, useToast, WarningModal } from '../ui/index.js';
import { StrictModeDroppable } from '../ui/StrictModeDroppable.jsx';
import { FileUploadCard } from '../ui/FileUploadCard.jsx';
import { DynamicList } from '../ui/DynamicList.jsx';
import { TagsInput } from '../ui/TagsInput.jsx';
import { SectionTitle } from '../ui/SectionTitle.jsx';
import { SettingToggle } from '../ui/SettingToggle.jsx';
import { inputCls, selectCls, textareaCls } from '../ui/InputStyles.js';
import { ModuleItem } from './Methods/ModuleItem.jsx';
import { CATEGORIES, LEVELS, CURRENCIES } from '../../constants/course/index.js';
import {
  getFullCourse,
  updateFullCourse,
  deleteCourse,
  getInstructorsForSelect,
  selectFullCourse,
  selectFullCourseLoading,
  selectFullCourseError,
  selectUpdateFullCourseLoading,
  selectUpdateFullCourseError,
  selectUpdateFullCourseSuccess,
  selectDeleteCourseLoading,
  selectInstructorsForSelect,
  selectInstructorsForSelectLoading,
  resetUpdateFullCourseState,
  clearUpdateFullCourseError,
  resetFullCourseState,
} from '../../redux/slices/course.slice.js';
import {
  uid,
  formatDuration,
  calculateModuleDuration,
  calculateCourseDuration,
  createEmptyLesson,
} from '../../utils/course.utils.js';

const TABS = [
  { key: 'basic', label: 'Basic Info', icon: FileText },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'pricing', label: 'Pricing', icon: File },
  { key: 'details', label: 'Details', icon: BookOpen },
  { key: 'seo', label: 'SEO & Tags', icon: FileText },
  { key: 'modules', label: 'Modules & Lessons', icon: Layers },
  { key: 'certificates', label: 'Certificates', icon: Award },
  { key: 'settings', label: 'Settings', icon: AlertCircle },
];

// ─── helpers to hydrate state from API data ───────────────────────────────────
const hydrateModules = (rawModules = []) =>
  rawModules.map(m => ({
    _uid: uid(),
    _id: m._id,
    title: m.title || '',
    description: m.description || '',
    objectives: m.objectives || [],
    isPublished: m.isPublished ?? false,
    collapsed: true,
    thumbnailFile: null,
    thumbnailPreview: m.thumbnail?.secure_url || null,
    lessons: (m.lessons || []).map(l => ({
      _uid: uid(),
      _id: l._id,
      title: l.title || '',
      description: l.description || '',
      type: l.type || 'video',
      isFree: l.isFree || false,
      content: { articleContent: l.content?.articleContent || '' },
      videoPackage: l.details?.videoPackage
        ? {
            _id: l.details.videoPackage._id,
            packageName: l.details.videoPackage.packageName || '',
            description: l.details.videoPackage.description || '',
            videos: (l.details.videoPackage.videos || []).map(v => ({
              _uid: uid(),
              _id: v._id,
              id: v._id,
              title: v.title || '',
              description: v.description || '',
              duration: v.duration || 0,
              url: v.url || '',
              bunnyVideoId: v.bunnyVideoId || '',
              thumbnail: v.thumbnail || '',
              status: v.status || '',
              videoFile: null,
              thumbnailFile: null,
            })),
          }
        : { packageName: '', description: '', videos: [{ _uid: uid(), title: '', description: '', duration: 0, videoFile: null, thumbnailFile: null }] },
      assignment: l.details?.assignment
        ? {
            _id: l.details.assignment._id,
            title: l.details.assignment.title || '',
            description: l.details.assignment.description || '',
            instructions: l.details.assignment.instructions || '',
            maxScore: l.details.assignment.maxScore || 100,
            passingScore: l.details.assignment.passingScore || 40,
            dueDate: l.details.assignment.dueDate ? new Date(l.details.assignment.dueDate).toISOString().slice(0, 16) : '',
            type: l.details.assignment.type || 'text',
            allowLateSubmission: l.details.assignment.allowLateSubmission || false,
            lateSubmissionPenalty: l.details.assignment.lateSubmissionPenalty || 0,
            thumbnailFile: null,
            thumbnailPreview: l.details.assignment.thumbnail?.secure_url || null,
          }
        : { title: '', description: '', instructions: '', maxScore: 100, passingScore: 40, dueDate: '', type: 'text', allowLateSubmission: false, lateSubmissionPenalty: 0, thumbnailFile: null, thumbnailPreview: null },
      liveClass: l.details?.liveClass
        ? {
            _id: l.details.liveClass._id,
            title: l.details.liveClass.title || '',
            description: l.details.liveClass.description || '',
            scheduledAt: l.details.liveClass.scheduledAt ? new Date(l.details.liveClass.scheduledAt).toISOString().slice(0, 16) : '',
            duration: l.details.liveClass.duration || 60,
            timezone: l.details.liveClass.timezone || 'UTC',
            zoomMeetingId: l.details.liveClass.zoomMeetingId || '',
            zoomJoinUrl: l.details.liveClass.zoomJoinUrl || '',
            zoomPassword: l.details.liveClass.zoomPassword || '',
            maxParticipants: l.details.liveClass.maxParticipants || 100,
            notes: l.details.liveClass.notes || '',
          }
        : { title: '', description: '', scheduledAt: '', duration: 60, timezone: 'UTC', zoomMeetingId: '', zoomJoinUrl: '', zoomPassword: '', maxParticipants: 100, notes: '' },
      material: l.details?.material
        ? {
            _id: l.details.material._id,
            title: l.details.material.title || '',
            description: l.details.material.description || '',
            type: l.details.material.type || 'pdf',
            fileName: l.details.material.fileName || '',
            fileUrl: l.details.material.fileUrl || '',
            materialFile: null,
          }
        : { title: '', description: '', type: 'pdf', fileName: '', fileUrl: '', materialFile: null },
      materials: (l.materials || []).map(mat => ({
        _uid: uid(),
        _id: mat._id,
        id: mat._id,
        title: mat.title || '',
        description: mat.description || '',
        type: mat.type || 'pdf',
        fileName: mat.fileName || '',
        fileUrl: mat.fileUrl || '',
        materialFile: null,
      })),
      thumbnailFile: null,
      thumbnailPreview: l.thumbnail?.secure_url || null,
    })),
  }));

const hydrateCertificates = (certArray = []) =>
  certArray.map(cert => ({
    _uid: uid(),
    _id: cert._id,
    id: cert._id,
    title: cert.title || '',
    description: cert.description || '',
    certificateUrl: cert.certificateUrl || '',
    certificatePreview: cert.certificateUrl || null,
    expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().slice(0, 10) : '',
    skills: cert.skills || [],
    imageFile: null,
  }));

// ─── build FormData for updateFullCourse ─────────────────────────────────────
const buildUpdateFormData = (courseData, modules, certificates, thumbnailFile, trailerFile) => {
  const fd = new FormData();

  const coursePayload = {
    title: courseData.title,
    shortDescription: courseData.shortDescription || '',
    description: courseData.description || '',
    instructor: courseData.instructor?._id || courseData.instructor,
    category: courseData.category,
    level: courseData.level,
    language: courseData.language || 'English',
    price: Number(courseData.price) || 0,
    currency: courseData.currency || 'USD',
    discountPrice: courseData.discountPrice ? Number(courseData.discountPrice) : undefined,
    discountValidUntil: courseData.discountValidUntil || undefined,
    isFree: courseData.isFree,
    status: courseData.status,
    certificateEnabled: courseData.certificateEnabled,
    allowPreview: courseData.allowPreview,
    maxStudents: courseData.maxStudents ? Number(courseData.maxStudents) : undefined,
    learningOutcomes: courseData.learningOutcomes || [],
    prerequisites: courseData.prerequisites || [],
    targetAudience: courseData.targetAudience || [],
    tags: courseData.tags || [],
    seoTitle: courseData.seoTitle || undefined,
    seoDescription: courseData.seoDescription || undefined,
  };

  const modulesPayload = (modules || []).map((m, mIdx) => {
    if (m.thumbnailFile) fd.append(`module.${mIdx}.thumbnail`, m.thumbnailFile);
    return {
      id: m._id,
      title: m.title,
      description: m.description || '',
      objectives: (m.objectives || []).filter(Boolean),
      order: mIdx + 1,
      isPublished: m.isPublished,
      lessons: (m.lessons || []).map((l, lIdx) => {
        if (l.thumbnailFile) fd.append(`lesson.${mIdx}.${lIdx}.thumbnail`, l.thumbnailFile);
        const lessonPayload = {
          id: l._id,
          title: l.title,
          description: l.description || '',
          type: l.type,
          isFree: l.isFree,
          order: lIdx + 1,
        };
        if (l.type === 'video' && l.videoPackage) {
          lessonPayload.videoPackage = {
            packageName: l.videoPackage.packageName || l.title,
            description: l.videoPackage.description || '',
            videos: (l.videoPackage.videos || []).map((v, vIdx) => {
              if (v.videoFile) fd.append(`video.${mIdx}.${lIdx}.${vIdx}`, v.videoFile);
              if (v.thumbnailFile) fd.append(`video.${mIdx}.${lIdx}.${vIdx}.thumb`, v.thumbnailFile);
              return { id: v._id || v.id, title: v.title || `Video ${vIdx + 1}`, description: v.description || '' };
            }),
          };
        }
        if (l.type === 'article') {
          lessonPayload.content = { articleContent: l.content?.articleContent || '' };
        }
        if (l.type === 'assignment' && l.assignment) {
          if (l.assignment.thumbnailFile) fd.append(`lesson.${mIdx}.${lIdx}.assignment_thumb`, l.assignment.thumbnailFile);
          lessonPayload.assignment = {
            title: l.assignment.title || l.title,
            description: l.assignment.description || '',
            instructions: l.assignment.instructions || '',
            maxScore: parseInt(l.assignment.maxScore) || 100,
            passingScore: parseInt(l.assignment.passingScore) || 40,
            dueDate: l.assignment.dueDate || undefined,
            type: l.assignment.type || 'text',
            allowLateSubmission: l.assignment.allowLateSubmission || false,
            lateSubmissionPenalty: parseInt(l.assignment.lateSubmissionPenalty) || 0,
          };
        }
        if (l.type === 'live' && l.liveClass) {
          lessonPayload.liveClass = {
            title: l.liveClass.title || l.title,
            description: l.liveClass.description || '',
            scheduledAt: l.liveClass.scheduledAt || undefined,
            duration: parseInt(l.liveClass.duration) || 60,
            timezone: l.liveClass.timezone || 'UTC',
            zoomMeetingId: l.liveClass.zoomMeetingId || '',
            zoomJoinUrl: l.liveClass.zoomJoinUrl || '',
            zoomPassword: l.liveClass.zoomPassword || undefined,
            maxParticipants: parseInt(l.liveClass.maxParticipants) || 100,
            notes: l.liveClass.notes || undefined,
          };
        }
        if (l.type === 'material' && l.material) {
          if (l.material.materialFile) fd.append(`material.${mIdx}.${lIdx}.0`, l.material.materialFile);
          lessonPayload.material = {
            title: l.material.title || l.title,
            description: l.material.description || '',
            type: l.material.type || 'pdf',
            fileName: l.material.fileName || '',
          };
        }
        if (l.materials?.length) {
          lessonPayload.materials = l.materials.map((mat, matIdx) => {
            if (mat.materialFile) fd.append(`material.${mIdx}.${lIdx}.${matIdx}`, mat.materialFile);
            return { id: mat._id || mat.id, title: mat.title, description: mat.description || '', type: mat.type || 'pdf' };
          });
        }
        return lessonPayload;
      }),
    };
  });

  const certPayload = (certificates || []).map((cert, certIdx) => {
    if (cert.imageFile) fd.append(`certificate.${certIdx}`, cert.imageFile);
    return {
      id: cert._id || cert.id,
      title: cert.title,
      description: cert.description || '',
      expiryDate: cert.expiryDate || undefined,
      skills: cert.skills || [],
    };
  });

  fd.append('data', JSON.stringify({ course: coursePayload, modules: modulesPayload, certificates: certPayload }));
  if (thumbnailFile) fd.append('course.thumbnail', thumbnailFile);
  if (trailerFile) fd.append('course.trailerVideo', trailerFile);

  return fd;
};

// ─── Main Component ──────────────────────────────────────────────────────────
export function EditCourse({ course: courseProp, onClose, onSave }) {
  const dispatch = useDispatch();
  const toast = useToast();

  const fullCourse = useSelector(selectFullCourse);
  const fullCourseLoading = useSelector(selectFullCourseLoading);
  const fullCourseError = useSelector(selectFullCourseError);
  const updateLoading = useSelector(selectUpdateFullCourseLoading);
  const updateError = useSelector(selectUpdateFullCourseError);
  const updateSuccess = useSelector(selectUpdateFullCourseSuccess);
  const deleteCourseLoading = useSelector(selectDeleteCourseLoading);
  const instructors = useSelector(selectInstructorsForSelect);
  const instructorsLoading = useSelector(selectInstructorsForSelectLoading);

  const [activeTab, setActiveTab] = useState('basic');
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);
  const [trailerPreview, setTrailerPreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch full course on mount
  useEffect(() => {
    if (courseProp?._id) {
      dispatch(getFullCourse(courseProp._id));
      dispatch(getInstructorsForSelect());
    }
  }, [courseProp?._id, dispatch]);

  // Hydrate local state from full course
  useEffect(() => {
    if (fullCourse && !initialized) {
      startTransition(() => {
        const c = fullCourse.course;
        setCourse({
          _id: c._id,
          title: c.title || '',
          shortDescription: c.shortDescription || '',
          description: c.description || '',
          instructor: c.instructor?._id || c.instructor || '',
          category: c.category || 'programming',
          level: c.level || 'beginner',
          language: c.language || 'English',
          price: c.price || 0,
          currency: c.currency || 'USD',
          discountPrice: c.discountPrice || '',
          discountValidUntil: c.discountValidUntil ? new Date(c.discountValidUntil).toISOString().slice(0, 10) : '',
          isFree: c.isFree || false,
          status: c.status || 'draft',
          isPublished: c.isPublished || false,
          certificateEnabled: c.certificateEnabled ?? true,
          allowPreview: c.allowPreview ?? true,
          maxStudents: c.maxStudents || '',
          learningOutcomes: c.learningOutcomes || [],
          prerequisites: c.prerequisites || [],
          targetAudience: c.targetAudience || [],
          tags: c.tags || [],
          seoTitle: c.seoTitle || '',
          seoDescription: c.seoDescription || '',
          rating: c.rating,
          enrolledCount: c.enrolledCount,
          totalModules: c.totalModules,
          totalLessons: c.totalLessons,
          totalDuration: c.totalDuration,
        });
        setThumbnailPreview(c.thumbnail?.secure_url || null);
        setTrailerPreview(c.trailerVideo || null);
        setModules(hydrateModules(fullCourse.modules));
        setCertificates(hydrateCertificates(c.certificates));
        setInitialized(true);
      });
    }
  }, [fullCourse, initialized]);

  // Reset when prop changes (new course selected)
  useEffect(() => {
    setInitialized(false);
    setCourse(null);
    setModules([]);
    setCertificates([]);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setTrailerFile(null);
    setTrailerPreview(null);
  }, [courseProp?._id]);

  // Handle update success
  useEffect(() => {
    if (updateSuccess) {
      toast.success('Course updated successfully!');
      dispatch(resetUpdateFullCourseState());
      dispatch(getFullCourse(courseProp._id)); // refresh
      onSave?.();
    }
  }, [updateSuccess, dispatch, toast, courseProp?._id, onSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearUpdateFullCourseError());
      dispatch(resetFullCourseState());
    };
  }, [dispatch]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCourseChange = useCallback((field, value) => {
    setCourse(prev => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const addModule = useCallback(() => {
    setModules(prev => [...prev, {
      _uid: uid(), title: '', description: '', objectives: [], isPublished: false,
      collapsed: false, thumbnailFile: null, thumbnailPreview: null,
      lessons: [createEmptyLesson()],
    }]);
  }, []);
  const removeModule = useCallback((idx) => setModules(prev => prev.filter((_, i) => i !== idx)), []);
  const updateModule = useCallback((idx, mod) => { setModules(prev => { const copy = [...prev]; copy[idx] = mod; return copy; }); }, []);

  const onDragEnd = useCallback((result) => {
    if (!result.destination || result.type !== 'MODULE') return;
    const items = Array.from(modules);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setModules(items);
  }, [modules]);

  const handleSave = async () => {
    if (!course?.title?.trim()) { toast.error('Course title is required'); setActiveTab('basic'); return; }
    if (!course?.description?.trim()) { toast.error('Course description is required'); setActiveTab('basic'); return; }
    const fd = buildUpdateFormData(course, modules, certificates, thumbnailFile, trailerFile);
    dispatch(updateFullCourse({ courseId: course._id, formData: fd }));
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteCourse(course._id)).unwrap();
      setShowDeleteModal(false);
      onClose();
    } catch (err) {
      toast.error('Failed to delete course');
      setShowDeleteModal(false);
    }
  };

  // ─── Loading / Error states ──────────────────────────────────────────────────
  if (fullCourseLoading || !initialized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-gray-300 text-sm">Loading full course structure…</p>
        </div>
      </div>
    );
  }

  if (fullCourseError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-10 flex flex-col items-center gap-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-red-400 text-center">{fullCourseError}</p>
          <div className="flex gap-3">
            <Button onClick={() => dispatch(getFullCourse(courseProp._id))} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
            <Button onClick={onClose} variant="ghost" className="text-gray-400 hover:text-white">Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full h-full max-w-7xl mx-auto my-auto bg-[#1a1a1a] rounded-2xl border border-gray-800 flex flex-col shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Course</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{course.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={updateLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {updateLoading ? 'Saving…' : 'Save Changes'}
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg ml-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {updateError && (
          <div className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{typeof updateError === 'object' ? updateError.message : updateError}</p>
          </div>
        )}

        {/* TAB BAR */}
        <div className="px-6 pt-3 border-b border-gray-800 shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {TABS.map(tab => {
              const TIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap
                    ${activeTab === tab.key
                      ? 'bg-[#222] text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                >
                  <TIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── BASIC INFO ─────────────────────────────────────────────────── */}
          {activeTab === 'basic' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Basic Course Information" />
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Course Title *</label>
                <input value={course.title} onChange={e => handleCourseChange('title', e.target.value)} className={inputCls} placeholder="Course title" maxLength={100} />
                <p className="text-gray-600 text-xs mt-1">{course.title.length}/100</p>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Short Description</label>
                <input value={course.shortDescription} onChange={e => handleCourseChange('shortDescription', e.target.value)} className={inputCls} placeholder="Brief one-liner" maxLength={300} />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Full Description *</label>
                <textarea value={course.description} onChange={e => handleCourseChange('description', e.target.value)} className={textareaCls} rows={5} maxLength={2000} />
                <p className="text-gray-600 text-xs mt-1">{course.description.length}/2000</p>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Instructor</label>
                <select value={course.instructor} onChange={e => handleCourseChange('instructor', e.target.value)} className={selectCls}>
                  <option value="">Select an instructor</option>
                  {instructorsLoading && <option disabled>Loading…</option>}
                  {instructors.map(inst => (
                    <option key={inst._id} value={inst._id}>
                      {`${inst.firstName || ''} ${inst.lastName || ''}`.trim() || inst.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Category</label>
                  <select value={course.category} onChange={e => handleCourseChange('category', e.target.value)} className={selectCls}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Level</label>
                  <select value={course.level} onChange={e => handleCourseChange('level', e.target.value)} className={selectCls}>
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Language</label>
                  <input value={course.language} onChange={e => handleCourseChange('language', e.target.value)} className={inputCls} placeholder="English" />
                </div>
              </div>
              {/* Stats (read-only) */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#111] p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Enrolled Students</p>
                  <p className="text-2xl font-bold text-white mt-1">{course.enrolledCount ?? 0}</p>
                </div>
                <div className="bg-[#111] p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Rating</p>
                  <p className="text-2xl font-bold text-white mt-1">{course.rating?.toFixed(1) ?? '—'} ⭐</p>
                </div>
              </div>
            </div>
          )}

          {/* ── MEDIA ──────────────────────────────────────────────────────── */}
          {activeTab === 'media' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Media Assets" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadCard
                  label="Course Thumbnail"
                  accept="image/*"
                  file={thumbnailFile}
                  preview={thumbnailPreview}
                  onFileChange={f => { if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)); } }}
                  onRemove={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                  icon={ImageIcon}
                />
                <FileUploadCard
                  label="Trailer Video (Bunny CDN)"
                  accept="video/*"
                  file={trailerFile}
                  preview={trailerPreview}
                  onFileChange={f => { if (f) { setTrailerFile(f); setTrailerPreview(URL.createObjectURL(f)); } }}
                  onRemove={() => { setTrailerFile(null); setTrailerPreview(null); }}
                  icon={Video}
                />
              </div>
              {thumbnailPreview && !thumbnailFile && (
                <p className="text-xs text-gray-500">Current thumbnail shown above. Upload a new file to replace it (stored on R2).</p>
              )}
              {trailerPreview && !trailerFile && (
                <p className="text-xs text-gray-500">Current trailer URL: <span className="text-blue-400 break-all">{trailerPreview}</span> (stored on Bunny CDN). Upload a new file to replace it.</p>
              )}
            </div>
          )}

          {/* ── PRICING ────────────────────────────────────────────────────── */}
          {activeTab === 'pricing' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Pricing & Enrollment" />
              <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
                <div>
                  <span className="text-gray-200 text-sm font-medium">Free Course</span>
                  <p className="text-gray-500 text-xs mt-0.5">Make this course available for free</p>
                </div>
                <Switch checked={course.isFree} onCheckedChange={v => handleCourseChange('isFree', v)} />
              </div>
              {!course.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Price</label>
                    <input type="number" value={course.price} onChange={e => handleCourseChange('price', e.target.value)} className={inputCls} min="0" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Discount Price</label>
                    <input type="number" value={course.discountPrice} onChange={e => handleCourseChange('discountPrice', e.target.value)} className={inputCls} min="0" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Currency</label>
                    <select value={course.currency} onChange={e => handleCourseChange('currency', e.target.value)} className={selectCls}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {!course.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Discount Valid Until</label>
                    <input type="date" value={course.discountValidUntil} onChange={e => handleCourseChange('discountValidUntil', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Max Students</label>
                    <input type="number" value={course.maxStudents} onChange={e => handleCourseChange('maxStudents', e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DETAILS ────────────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Course Details" />
              <DynamicList items={course.learningOutcomes} onChange={v => handleCourseChange('learningOutcomes', v)} placeholder="e.g., Build full-stack React apps" label="Learning Outcomes" />
              <Separator className="bg-gray-800" />
              <DynamicList items={course.prerequisites} onChange={v => handleCourseChange('prerequisites', v)} placeholder="e.g., Basic JavaScript knowledge" label="Prerequisites" />
              <Separator className="bg-gray-800" />
              <DynamicList items={course.targetAudience} onChange={v => handleCourseChange('targetAudience', v)} placeholder="e.g., Aspiring web developers" label="Target Audience" />
            </div>
          )}

          {/* ── SEO ────────────────────────────────────────────────────────── */}
          {activeTab === 'seo' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="SEO & Tags" />
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">SEO Title</label>
                <input value={course.seoTitle} onChange={e => handleCourseChange('seoTitle', e.target.value)} className={inputCls} maxLength={60} />
                <p className="text-gray-600 text-xs mt-1">{course.seoTitle.length}/60</p>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">SEO Description</label>
                <textarea value={course.seoDescription} onChange={e => handleCourseChange('seoDescription', e.target.value)} className={textareaCls} rows={3} maxLength={160} />
                <p className="text-gray-600 text-xs mt-1">{course.seoDescription.length}/160</p>
              </div>
              <Separator className="bg-gray-800" />
              <TagsInput tags={course.tags} onChange={v => handleCourseChange('tags', v)} />
            </div>
          )}

          {/* ── MODULES & LESSONS ─────────────────────────────────────────── */}
          {activeTab === 'modules' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <SectionTitle title="Modules & Lessons" />
                  <p className="text-gray-500 text-xs mb-3">Drag modules to reorder. Upload new video files to replace existing Bunny CDN videos; upload material files to replace R2 assets.</p>
                </div>
                <button type="button" onClick={addModule} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <StrictModeDroppable droppableId="edit-modules-list" type="MODULE" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 p-2 rounded-lg ${snapshot.isDraggingOver ? 'bg-blue-500/5 border border-blue-500/30' : ''}`}
                    >
                      {modules.map((mod, idx) => (
                        <Draggable key={mod._uid} draggableId={mod._uid} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={snapshot.isDragging ? 'opacity-50 shadow-lg' : ''}
                            >
                              <ModuleItem
                                module={mod}
                                moduleIdx={idx}
                                onUpdate={m => updateModule(idx, m)}
                                onRemove={() => removeModule(idx)}
                                totalModules={modules.length}
                                allPreviewLessons={[]}
                                onPreviewChange={() => {}}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </StrictModeDroppable>
              </DragDropContext>
              {modules.length === 0 && (
                <div className="text-center py-12 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                  <Layers className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                  <p className="text-sm">No modules yet. Click &quot;Add Module&quot; to add one.</p>
                </div>
              )}
            </div>
          )}

          {/* ── CERTIFICATES ──────────────────────────────────────────────── */}
          {activeTab === 'certificates' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Certificates" subtitle="Edit certificates issued on course completion" />
              {certificates.length === 0 ? (
                <div className="text-center py-12 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                  <Award className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                  <p className="text-sm">No certificates found for this course.</p>
                </div>
              ) : (
                certificates.map((cert, cIdx) => (
                  <div key={cert._uid || cert._id} className="bg-[#111] border border-gray-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-semibold text-sm">Certificate #{cIdx + 1}</h4>
                      {cert._id && <span className="text-gray-600 text-xs font-mono">{cert._id}</span>}
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-1.5 block">Title</label>
                      <input
                        value={cert.title}
                        onChange={e => {
                          const updated = [...certificates];
                          updated[cIdx] = { ...cert, title: e.target.value };
                          setCertificates(updated);
                        }}
                        className={inputCls}
                        placeholder="Certificate title"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-1.5 block">Description</label>
                      <textarea
                        value={cert.description}
                        onChange={e => {
                          const updated = [...certificates];
                          updated[cIdx] = { ...cert, description: e.target.value };
                          setCertificates(updated);
                        }}
                        className={textareaCls}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-1.5 block">Certificate Image (R2)</label>
                      {cert.certificatePreview ? (
                        <div className="relative group">
                          <img src={cert.certificatePreview} alt="Certificate" className="w-full max-h-40 object-contain rounded-lg border border-gray-800" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...certificates];
                              updated[cIdx] = { ...cert, imageFile: null, certificatePreview: cert.certificateUrl || null };
                              setCertificates(updated);
                            }}
                            className="absolute top-2 right-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null}
                      <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2.5 rounded-lg cursor-pointer transition-colors w-fit mt-2">
                        <ImageIcon className="w-4 h-4" />
                        {cert.certificatePreview ? 'Replace image' : 'Upload image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const updated = [...certificates];
                              updated[cIdx] = { ...cert, imageFile: f, certificatePreview: URL.createObjectURL(f) };
                              setCertificates(updated);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-300 text-sm font-medium mb-1.5 block">Expiry Date</label>
                        <input
                          type="date"
                          value={cert.expiryDate}
                          onChange={e => {
                            const updated = [...certificates];
                            updated[cIdx] = { ...cert, expiryDate: e.target.value };
                            setCertificates(updated);
                          }}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <DynamicList
                      items={cert.skills}
                      onChange={skills => {
                        const updated = [...certificates];
                        updated[cIdx] = { ...cert, skills };
                        setCertificates(updated);
                      }}
                      placeholder="e.g., React Development"
                      label="Skills Earned"
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── SETTINGS ───────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Course Settings" />
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Course Status</label>
                <select value={course.status} onChange={e => handleCourseChange('status', e.target.value)} className={selectCls}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-3">
                <SettingToggle label="Published" description="Make course visible to students" checked={course.isPublished} onChange={v => handleCourseChange('isPublished', v)} />
                <SettingToggle label="Certificate Enabled" description="Issue certificates upon course completion" checked={course.certificateEnabled} onChange={v => handleCourseChange('certificateEnabled', v)} />
                <SettingToggle label="Allow Preview" description="Let users preview free lessons before enrolling" checked={course.allowPreview} onChange={v => handleCourseChange('allowPreview', v)} />
              </div>

              <Separator className="bg-gray-800" />

              {/* Danger Zone */}
              <div>
                <h3 className="text-base font-semibold text-red-400 mb-3">Danger Zone</h3>
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">Delete Course</p>
                    <p className="text-xs text-gray-400 mt-0.5">Permanently remove this course and all associated data</p>
                  </div>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleteCourseLoading}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 shrink-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteCourseLoading ? 'Deleting…' : 'Delete Course'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
            <span>&bull;</span>
            <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
            <span>&bull;</span>
            <span>{certificates.length} certificate{certificates.length !== 1 ? 's' : ''}</span>
            <span>&bull;</span>
            <span className="font-medium text-blue-400">
              Total: {formatDuration(modules.reduce((s, m) => s + calculateModuleDuration(m.lessons), 0))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} disabled={updateLoading} className="bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm px-4 py-2">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateLoading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2">
              <Save className="w-4 h-4 mr-1.5" />
              {updateLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Warning Modal */}
      <WarningModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Course"
        message={`Are you sure you want to delete "${course.title}"? This action cannot be undone and will permanently remove all modules, lessons, media, and associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
