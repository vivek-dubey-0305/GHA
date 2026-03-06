import React, { useState, useEffect, useCallback, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, Plus, ChevronDown, ChevronUp, Image as ImageIcon,
  Video, FileText, BookOpen, Save, Send, AlertCircle, Layers, File,
  Award, Upload, CheckCircle, Loader2
} from 'lucide-react';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { Button, Label, Switch, Separator, Badge, useToast } from '../ui/index.js';
import { StrictModeDroppable } from '../ui/StrictModeDroppable.jsx';
import { FileUploadCard } from '../ui/FileUploadCard.jsx';
import { DynamicList } from '../ui/DynamicList.jsx';
import { TagsInput } from '../ui/TagsInput.jsx';
import { SectionTitle } from '../ui/SectionTitle.jsx';
import { SettingToggle } from '../ui/SettingToggle.jsx';
import { inputCls, selectCls, textareaCls } from '../ui/InputStyles.js';
import { ModuleItem } from './methods/ModuleItem.jsx';
import { LessonItem } from './methods/LessonItem.jsx';
import {
  formatDuration,
  createEmptyModule,
  createEmptyLesson,
  calculateModuleDuration,
  uid,
} from '../../utils/course.utils.js';
import { CATEGORIES, LEVELS, CURRENCIES } from '../../constants/course/index.js';
import {
  createFullCourse,
  saveDraftCourse,
  selectCreateFullCourseLoading,
  selectCreateFullCourseError,
  selectCreateFullCourseSuccess,
  selectSaveDraftLoading,
  selectSaveDraftError,
  selectSaveDraftSuccess,
  resetCreateFullCourseState,
  resetSaveDraftState,
  clearCreateFullCourseError,
  clearSaveDraftError,
  getInstructorsForSelect,
  selectInstructorsForSelect,
  selectInstructorsForSelectLoading,
  selectCreationProgress,
  resetCreationProgress,
} from '../../redux/slices/course.slice.js';

const TAB_CONFIGS = [
  { key: 'basic', label: 'Basic Info', icon: FileText },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'pricing', label: 'Pricing', icon: File },
  { key: 'details', label: 'Details', icon: BookOpen },
  { key: 'seo', label: 'SEO & Tags', icon: FileText },
  { key: 'modules', label: 'Modules & Lessons', icon: Layers },
  { key: 'certificate', label: 'Certificate', icon: Award },
  { key: 'settings', label: 'Settings', icon: AlertCircle },
];

// ============================================
// MAIN: AddCourse Modal
// ============================================
export function AddCourse({ onClose, onAdd, draftCourse }) {
  const dispatch = useDispatch();
  const toast = useToast();

  const createFullCourseLoading = useSelector(selectCreateFullCourseLoading);
  const createFullCourseError = useSelector(selectCreateFullCourseError);
  const createFullCourseSuccess = useSelector(selectCreateFullCourseSuccess);
  const saveDraftLoading = useSelector(selectSaveDraftLoading);
  const saveDraftError = useSelector(selectSaveDraftError);
  const saveDraftSuccess = useSelector(selectSaveDraftSuccess);
  const instructors = useSelector(selectInstructorsForSelect);
  const instructorsLoading = useSelector(selectInstructorsForSelectLoading);
  const creationProgress = useSelector(selectCreationProgress);

  const [activeTab, setActiveTab] = useState('basic');
  const [course, setCourse] = useState({
    title: '',
    description: '',
    shortDescription: '',
    instructor: '',
    category: 'programming',
    level: 'beginner',
    language: 'English',
    price: 0,
    currency: 'USD',
    discountPrice: '',
    discountValidUntil: '',
    isFree: false,
    status: 'draft',
    certificateEnabled: true,
    allowPreview: true,
    maxStudents: '',
    learningOutcomes: [],
    prerequisites: [],
    targetAudience: [],
    tags: [],
    seoTitle: '',
    seoDescription: '',
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);
  const [trailerPreview, setTrailerPreview] = useState(null);
  const [modules, setModules] = useState([createEmptyModule()]);
  const [previewLessons, setPreviewLessons] = useState([]);
  const [certificate, setCertificate] = useState({
    title: '',
    description: '',
    certificateImage: null,
    certificatePreview: null,
    expiryDate: '',
    skills: [],
  });

  useEffect(() => {
    if (draftCourse) {
      // Load draft data...
      startTransition(() => {
        setCourse({
          title: draftCourse.title || '',
          description: draftCourse.description || '',
          shortDescription: draftCourse.shortDescription || '',
          instructor: draftCourse.instructor?._id || draftCourse.instructor || '',
          category: draftCourse.category || 'programming',
          level: draftCourse.level || 'beginner',
          language: draftCourse.language || 'English',
          price: draftCourse.price || 0,
          currency: draftCourse.currency || 'USD',
          discountPrice: draftCourse.discountPrice || '',
          discountValidUntil: draftCourse.discountValidUntil ? new Date(draftCourse.discountValidUntil).toISOString().slice(0, 10) : '',
          isFree: draftCourse.isFree || false,
          status: draftCourse.status || 'draft',
          certificateEnabled: draftCourse.certificateEnabled ?? true,
          allowPreview: draftCourse.allowPreview ?? true,
          maxStudents: draftCourse.maxStudents || '',
          learningOutcomes: draftCourse.learningOutcomes || [],
          prerequisites: draftCourse.prerequisites || [],
          targetAudience: draftCourse.targetAudience || [],
          tags: draftCourse.tags || [],
          seoTitle: draftCourse.seoTitle || '',
          seoDescription: draftCourse.seoDescription || '',
        });
        if (draftCourse.thumbnail?.secure_url) setThumbnailPreview(draftCourse.thumbnail.secure_url);
        if (draftCourse.previewLessons?.length) setPreviewLessons(draftCourse.previewLessons);
        if (draftCourse.modules?.length) {
          setModules(draftCourse.modules.map((m) => ({
            _uid: uid(),
            _id: m._id,
            title: m.title || '',
            description: m.description || '',
            objectives: m.objectives || [],
            collapsed: false,
            thumbnailFile: null,
            thumbnailPreview: m.thumbnail?.secure_url || null,
            lessons: m.lessons?.length ? m.lessons.map((l) => ({
              _uid: uid(),
              _id: l._id,
              title: l.title || '',
              description: l.description || '',
              type: l.type || 'video',
              isFree: l.isFree || false,
              content: { articleContent: l.content?.articleContent || '' },
              videoPackage: l.videoPackageId ? {
                packageName: l.videoPackageId.packageName || '',
                videos: (l.videoPackageId.videos || []).map(v => ({
                  _uid: uid(), title: v.title || '', description: v.description || '',
                  duration: v.duration || 0, videoFile: null, thumbnailFile: null,
                })),
              } : { packageName: '', videos: [{ _uid: uid(), title: '', description: '', duration: 0, videoFile: null, thumbnailFile: null }] },
              assignment: l.assignmentId ? {
                title: l.assignmentId.title || '', description: l.assignmentId.description || '',
                totalMarks: l.assignmentId.totalMarks || 100, passingMarks: l.assignmentId.passingMarks || 40,
                dueDate: l.assignmentId.dueDate ? new Date(l.assignmentId.dueDate).toISOString().slice(0, 16) : '',
                submissionType: l.assignmentId.submissionType || 'file', instructions: l.assignmentId.instructions || '',
                thumbnailFile: null, thumbnailPreview: l.assignmentId.thumbnail?.secure_url || null,
              } : { title: '', description: '', totalMarks: 100, passingMarks: 40, dueDate: '', submissionType: 'file', instructions: '', thumbnailFile: null, thumbnailPreview: null },
              liveClass: l.liveClassId ? {
                title: l.liveClassId.title || '', platform: l.liveClassId.platform || 'zoom',
                meetingUrl: l.liveClassId.meetingUrl || '', meetingId: l.liveClassId.meetingId || '',
                scheduledAt: l.liveClassId.scheduledAt ? new Date(l.liveClassId.scheduledAt).toISOString().slice(0, 16) : '',
                duration: l.liveClassId.duration || 60, maxParticipants: l.liveClassId.maxParticipants || 100,
                description: l.liveClassId.description || '',
              } : { title: '', platform: 'zoom', meetingUrl: '', meetingId: '', scheduledAt: '', duration: 60, maxParticipants: 100, description: '' },
              material: l.materialId ? {
                title: l.materialId.title || '', description: l.materialId.description || '',
                type: l.materialId.type || 'document', materialFile: null, fileName: l.materialId.fileName || '',
              } : { title: '', description: '', type: 'document', materialFile: null, fileName: '' },
              thumbnailFile: null,
              thumbnailPreview: l.thumbnail?.secure_url || null,
            })) : [createEmptyLesson()],
          })));
        }
        // Load certificate template from course
        if (draftCourse.certificateTemplate) {
          setCertificate({
            title: draftCourse.certificateTemplate.title || '',
            description: draftCourse.certificateTemplate.description || '',
            certificateImage: null,
            certificatePreview: draftCourse.certificateTemplate.imageUrl || null,
            expiryDate: '',
            skills: [],
          });
        }
      });
    }
  }, [draftCourse]);

  useEffect(() => {
    dispatch(getInstructorsForSelect());
  }, [dispatch]);

  useEffect(() => {
    if (createFullCourseSuccess) {
      toast.success('Course created successfully!');
      dispatch(resetCreateFullCourseState());
      dispatch(resetCreationProgress());
      onAdd?.();
    }
  }, [createFullCourseSuccess, dispatch, onAdd, toast]);

  useEffect(() => {
    if (saveDraftSuccess) {
      toast.success('Draft saved successfully!');
      dispatch(resetSaveDraftState());
    }
  }, [saveDraftSuccess, dispatch, toast]);

  useEffect(() => {
    return () => {
      dispatch(clearCreateFullCourseError());
      dispatch(clearSaveDraftError());
      dispatch(resetCreationProgress());
    };
  }, [dispatch]);

  const handleCourseChange = (field, value) => {
    setCourse(prev => ({ ...prev, [field]: value }));
  };

  const handleThumbnailChange = (file) => {
    if (file) { setThumbnailFile(file); setThumbnailPreview(URL.createObjectURL(file)); }
  };
  const handleTrailerChange = (file) => {
    if (file) { setTrailerFile(file); setTrailerPreview(URL.createObjectURL(file)); }
  };
  const removeThumbnail = () => { setThumbnailFile(null); setThumbnailPreview(null); };
  const removeTrailer = () => { setTrailerFile(null); setTrailerPreview(null); };

  const addModule = () => setModules(prev => [...prev, createEmptyModule()]);
  const removeModule = (idx) => setModules(prev => prev.filter((_, i) => i !== idx));
  const updateModule = (idx, mod) => { const copy = [...modules]; copy[idx] = mod; setModules(copy); };

  const onDragEnd = useCallback((result) => {
    if (!result.destination || result.type !== 'MODULE') return;
    const items = Array.from(modules);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setModules(items);
  }, [modules]);

  const calculateCourseDuration = () => {
    return modules.reduce((sum, m) => sum + calculateModuleDuration(m.lessons), 0);
  };

  const buildFormData = (status) => {
    const fd = new FormData();

    const data = {
      ...course,
      status,
      price: Number(course.price) || 0,
      discountPrice: course.discountPrice ? Number(course.discountPrice) : undefined,
      discountValidUntil: course.discountValidUntil || undefined,
      maxStudents: course.maxStudents ? Number(course.maxStudents) : undefined,
      totalDuration: Math.ceil(calculateCourseDuration() / 60),
      modules: modules.map((m, mi) => {
        if (m.thumbnailFile) fd.append(`module_${mi}_thumbnail`, m.thumbnailFile);

        return {
          title: m.title,
          description: m.description,
          objectives: m.objectives.filter(Boolean),
          order: mi + 1,
          lessons: m.lessons.map((l, li) => {
            if (l.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_thumbnail`, l.thumbnailFile);

            const lessonPayload = {
              title: l.title,
              description: l.description,
              type: l.type,
              isFree: l.isFree,
              order: li + 1,
            };

            // Type-specific data
            if (l.type === 'video' && l.videoPackage) {
              lessonPayload.videoPackage = {
                packageName: l.videoPackage.packageName || l.title,
                description: l.videoPackage.description || '',
                category: l.videoPackage.category || 'tutorial',
                videos: (l.videoPackage.videos || []).map((v, vi) => {
                  if (v.videoFile) fd.append(`module_${mi}_lesson_${li}_video_${vi}`, v.videoFile);
                  if (v.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_video_${vi}_thumb`, v.thumbnailFile);
                  return {
                    title: v.title || `Video ${vi + 1}`,
                    description: v.description || '',
                    duration: parseInt(v.duration) || 0,
                  };
                }),
              };
            }

            if (l.type === 'article') {
              lessonPayload.content = { articleContent: l.content?.articleContent || '' };
            }

            if (l.type === 'assignment' && l.assignment) {
              if (l.assignment.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_assignment_thumb`, l.assignment.thumbnailFile);
              lessonPayload.assignment = {
                title: l.assignment.title || l.title,
                description: l.assignment.description || l.assignment.instructions || 'No description',
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
              if (l.material.materialFile) fd.append(`module_${mi}_lesson_${li}_material_file`, l.material.materialFile);
              lessonPayload.material = {
                title: l.material.title || l.title,
                description: l.material.description || '',
                type: l.material.type || 'pdf',
                fileName: l.material.fileName || '',
              };
            }

            return lessonPayload;
          }),
        };
      }),
    };

    // Certificate data
    if (course.certificateEnabled && certificate.title) {
      data.certificate = {
        title: certificate.title,
        description: certificate.description,
        expiryDate: certificate.expiryDate || undefined,
        skills: certificate.skills || [],
      };
      if (certificate.certificateImage) fd.append('certificateImage', certificate.certificateImage);
    }

    if (data.learningOutcomes.length === 0) delete data.learningOutcomes;
    if (data.prerequisites.length === 0) delete data.prerequisites;
    if (data.targetAudience.length === 0) delete data.targetAudience;
    if (data.tags.length === 0) delete data.tags;
    if (!data.seoTitle) delete data.seoTitle;
    if (!data.seoDescription) delete data.seoDescription;

    fd.append('data', JSON.stringify(data));
    if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
    if (trailerFile) fd.append('trailerVideo', trailerFile);

    return fd;
  };

  const handleSubmit = async (status = 'published') => {
    if (!course.title.trim()) { toast.error('Course title is required'); setActiveTab('basic'); return; }
    if (!course.description.trim()) { toast.error('Course description is required'); setActiveTab('basic'); return; }
    if (!course.instructor) { toast.error('Please select an instructor'); setActiveTab('basic'); return; }

    const fd = buildFormData(status);

    if (draftCourse?._id) {
      dispatch(saveDraftCourse({ courseId: draftCourse._id, formData: fd }));
    } else {
      dispatch(createFullCourse(fd));
    }
  };

  const handleSaveDraft = () => {
    if (!course.title.trim()) { toast.error('At least a course title is required to save draft'); setActiveTab('basic'); return; }
    handleSubmit('draft');
  };

  const isSubmitting = createFullCourseLoading || saveDraftLoading;
  const error = createFullCourseError || saveDraftError;

  const tabs = [
    { key: 'basic', label: 'Basic Info', icon: FileText },
    { key: 'media', label: 'Media', icon: ImageIcon },
    { key: 'pricing', label: 'Pricing', icon: File },
    { key: 'details', label: 'Details', icon: BookOpen },
    { key: 'seo', label: 'SEO & Tags', icon: FileText },
    { key: 'modules', label: 'Modules & Lessons', icon: Layers },
    { key: 'certificate', label: 'Certificate', icon: Award },
    { key: 'settings', label: 'Settings', icon: AlertCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full h-full max-w-7xl mx-auto my-auto bg-[#1a1a1a] rounded-2xl border border-gray-800 flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{draftCourse ? 'Resume Draft Course' : 'Create New Course'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Fill in all the details to create a course with modules and lessons</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveDraft} disabled={isSubmitting} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2">
              <Save className="w-4 h-4 mr-1.5" />
              {saveDraftLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={() => handleSubmit('published')} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2">
              <Send className="w-4 h-4 mr-1.5" />
              {createFullCourseLoading ? 'Publishing...' : 'Publish Course'}
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg ml-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm font-medium">{typeof error === 'object' ? error.message : error}</p>
            </div>
            {typeof error === 'object' && error.errors?.length > 0 && (
              <ul className="mt-2 ml-6 space-y-0.5">
                {error.errors.map((err, i) => (
                  <li key={i} className="text-red-300/80 text-xs list-disc">{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CREATION PROGRESS OVERLAY */}
        {creationProgress.step !== 'idle' && creationProgress.step !== 'error' && (
          <div className="mx-6 mt-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {creationProgress.step === 'done' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              )}
              <span className="text-gray-200 text-sm font-medium">{creationProgress.message}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${creationProgress.step === 'done' ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${creationProgress.percent}%` }}
              />
            </div>
            <p className="text-gray-500 text-[10px] mt-1 text-right">{creationProgress.percent}%</p>
          </div>
        )}

        {/* TAB BAR */}
        <div className="px-6 pt-3 border-b border-gray-800 shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {tabs.map(tab => {
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
          {/* BASIC INFO TAB */}
          {activeTab === 'basic' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Basic Course Information" />
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Course Title *</label>
                <input value={course.title} onChange={(e) => handleCourseChange('title', e.target.value)} className={inputCls} placeholder="e.g., Advanced React Development" maxLength={100} />
                <p className="text-gray-600 text-xs mt-1">{course.title.length}/100</p>
              </div>

              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Short Description</label>
                <input value={course.shortDescription} onChange={(e) => handleCourseChange('shortDescription', e.target.value)} className={inputCls} placeholder="Brief one-liner about the course" maxLength={300} />
                <p className="text-gray-600 text-xs mt-1">{course.shortDescription.length}/300</p>
              </div>

              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Full Description *</label>
                <textarea value={course.description} onChange={(e) => handleCourseChange('description', e.target.value)} className={textareaCls} rows={5} placeholder="Detailed course description..." maxLength={2000} />
                <p className="text-gray-600 text-xs mt-1">{course.description.length}/2000</p>
              </div>

              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Instructor *</label>
                <select value={course.instructor} onChange={(e) => handleCourseChange('instructor', e.target.value)} className={selectCls}>
                  <option value="">Select an instructor</option>
                  {instructorsLoading && <option disabled>Loading...</option>}
                  {instructors.map(inst => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name || inst.firstName ? `${inst.firstName || ''} ${inst.lastName || ''}`.trim() : inst.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Category *</label>
                  <select value={course.category} onChange={(e) => handleCourseChange('category', e.target.value)} className={selectCls}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Level *</label>
                  <select value={course.level} onChange={(e) => handleCourseChange('level', e.target.value)} className={selectCls}>
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Language</label>
                  <input value={course.language} onChange={(e) => handleCourseChange('language', e.target.value)} className={inputCls} placeholder="English" />
                </div>
              </div>
            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === 'media' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Media Assets" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadCard
                  label="Course Thumbnail"
                  accept="image/*"
                  file={thumbnailFile}
                  preview={thumbnailPreview}
                  onFileChange={handleThumbnailChange}
                  onRemove={removeThumbnail}
                  icon={ImageIcon}
                />
                <FileUploadCard
                  label="Trailer Video"
                  accept="video/*"
                  file={trailerFile}
                  preview={trailerPreview}
                  onFileChange={handleTrailerChange}
                  onRemove={removeTrailer}
                  icon={Video}
                />
              </div>
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Pricing & Enrollment" />
              <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
                <div>
                  <span className="text-gray-200 text-sm font-medium">Free Course</span>
                  <p className="text-gray-500 text-xs mt-0.5">Make this course available for free</p>
                </div>
                <Switch checked={course.isFree} onCheckedChange={(v) => handleCourseChange('isFree', v)} />
              </div>

              {!course.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Price *</label>
                    <input type="number" value={course.price} onChange={(e) => handleCourseChange('price', e.target.value)} className={inputCls} placeholder="99.99" min="0" max="10000" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Discount Price</label>
                    <input type="number" value={course.discountPrice} onChange={(e) => handleCourseChange('discountPrice', e.target.value)} className={inputCls} placeholder="79.99" min="0" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Currency</label>
                    <select value={course.currency} onChange={(e) => handleCourseChange('currency', e.target.value)} className={selectCls}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {!course.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Discount Valid Until</label>
                    <input type="date" value={course.discountValidUntil} onChange={(e) => handleCourseChange('discountValidUntil', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Max Students</label>
                    <input type="number" value={course.maxStudents} onChange={(e) => handleCourseChange('maxStudents', e.target.value)} className={inputCls} placeholder="e.g., 500" min="1" max="10000" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Course Details" />
              <DynamicList items={course.learningOutcomes} onChange={(v) => handleCourseChange('learningOutcomes', v)} placeholder="e.g., Build full-stack React apps" label="Learning Outcomes" />
              <Separator className="bg-gray-800" />
              <DynamicList items={course.prerequisites} onChange={(v) => handleCourseChange('prerequisites', v)} placeholder="e.g., Basic JavaScript knowledge" label="Prerequisites" />
              <Separator className="bg-gray-800" />
              <DynamicList items={course.targetAudience} onChange={(v) => handleCourseChange('targetAudience', v)} placeholder="e.g., Aspiring web developers" label="Target Audience" />
            </div>
          )}

          {/* SEO TAB */}
          {activeTab === 'seo' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="SEO & Tags" />
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">SEO Title</label>
                <input value={course.seoTitle} onChange={(e) => handleCourseChange('seoTitle', e.target.value)} className={inputCls} placeholder="SEO-optimized title (max 60 chars)" maxLength={60} />
                <p className="text-gray-600 text-xs mt-1">{course.seoTitle.length}/60</p>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">SEO Description</label>
                <textarea value={course.seoDescription} onChange={(e) => handleCourseChange('seoDescription', e.target.value)} className={textareaCls} rows={3} placeholder="Meta description for search engines (max 160 chars)" maxLength={160} />
                <p className="text-gray-600 text-xs mt-1">{course.seoDescription.length}/160</p>
              </div>
              <Separator className="bg-gray-800" />
              <TagsInput tags={course.tags} onChange={(v) => handleCourseChange('tags', v)} />
            </div>
          )}

          {/* MODULES & LESSONS TAB */}
          {activeTab === 'modules' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <SectionTitle title="Modules & Lessons" />
                  <p className="text-gray-500 text-xs mb-3">Drag modules/lessons to reorder. Duration calculates automatically.</p>
                </div>
                <button type="button" onClick={addModule} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </div>

              <DragDropContext onDragEnd={onDragEnd} nonce={modules.length}>
                <StrictModeDroppable droppableId="modules-list" type="MODULE" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
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
                              className={`${snapshot.isDragging ? 'opacity-50 shadow-lg' : ''}`}
                            >
                              <ModuleItem
                                module={mod}
                                moduleIdx={idx}
                                onUpdate={(m) => updateModule(idx, m)}
                                onRemove={() => removeModule(idx)}
                                totalModules={modules.length}
                                allPreviewLessons={previewLessons}
                                onPreviewChange={setPreviewLessons}
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
                  <p className="text-sm">No modules yet. Click &quot;Add Module&quot; to start building your course structure.</p>
                </div>
              )}
            </div>
          )}

          {/* CERTIFICATE TAB */}
          {activeTab === 'certificate' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Certificate Template" subtitle="Configure the certificate issued on course completion" />

              {!course.certificateEnabled ? (
                <div className="text-center py-12 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                  <Award className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                  <p className="text-sm">Certificates are disabled. Enable them in the Settings tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Certificate Title</label>
                    <input
                      value={certificate.title}
                      onChange={(e) => setCertificate(prev => ({ ...prev, title: e.target.value }))}
                      className={inputCls}
                      placeholder={`e.g., ${course.title || 'Course'} Completion Certificate`}
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Description</label>
                    <textarea
                      value={certificate.description}
                      onChange={(e) => setCertificate(prev => ({ ...prev, description: e.target.value }))}
                      className={textareaCls}
                      rows={3}
                      placeholder="Certificate description..."
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Certificate Template Image</label>
                    {certificate.certificatePreview ? (
                      <div className="relative group">
                        <img src={certificate.certificatePreview} alt="Certificate" className="w-full max-h-52 object-contain rounded-lg border border-gray-800" />
                        <button
                          type="button"
                          onClick={() => setCertificate(prev => ({ ...prev, certificateImage: null, certificatePreview: null }))}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2.5 rounded-lg cursor-pointer transition-colors w-fit">
                        <Upload className="w-4 h-4" />
                        Upload certificate image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setCertificate(prev => ({
                                ...prev,
                                certificateImage: f,
                                certificatePreview: URL.createObjectURL(f),
                              }));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={certificate.expiryDate}
                      onChange={(e) => setCertificate(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className={inputCls}
                      placeholder="Select expiry date"
                    />
                  </div>
                  <DynamicList
                    items={certificate.skills}
                    onChange={(skills) => setCertificate(prev => ({ ...prev, skills }))}
                    placeholder="e.g., React Development"
                    label="Skills Earned"
                  />
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <SectionTitle title="Course Settings" />

              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Course Status</label>
                <select value={course.status} onChange={(e) => handleCourseChange('status', e.target.value)} className={selectCls}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-3">
                <SettingToggle
                  label="Certificate Enabled"
                  description="Issue certificates upon course completion"
                  checked={course.certificateEnabled}
                  onChange={(v) => handleCourseChange('certificateEnabled', v)}
                />
                <SettingToggle
                  label="Allow Preview"
                  description="Let users preview free lessons before enrolling"
                  checked={course.allowPreview}
                  onChange={(v) => handleCourseChange('allowPreview', v)}
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
            <span>&bull;</span>
            <span>{modules.reduce((s, m) => s + m.lessons.length, 0)} lesson{modules.reduce((s, m) => s + m.lessons.length, 0) !== 1 ? 's' : ''}</span>
            <span>&bull;</span>
            <span className="font-medium text-blue-400">Total: {formatDuration(calculateCourseDuration())}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} disabled={isSubmitting} className="bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm px-4 py-2">
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={isSubmitting} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2">
              <Save className="w-4 h-4 mr-1.5" />
              {saveDraftLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={() => handleSubmit('published')} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2">
              <Send className="w-4 h-4 mr-1.5" />
              {createFullCourseLoading ? 'Publishing...' : 'Publish Course'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
