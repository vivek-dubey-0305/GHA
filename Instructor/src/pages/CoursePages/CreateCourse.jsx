import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Upload, X, BookOpen, Video, FileText, AlertCircle, Loader2,
  Image as ImageIcon, Layers, Award, File, ChevronDown, ChevronUp,
  ChevronRight, Trash2, Radio, CheckCircle, Save, Send, GripVertical,
} from 'lucide-react';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { StrictModeDroppable } from '../../components/ui/StrictModeDroppable';
import {
  createFullCourse,
  createCourseDraft,
  updateCourseDraft,
  getMyCourses,
  selectCourses,
  selectCoursesLoading,
  selectCreateCourseLoading,
  selectCreateCourseError,
} from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import {
  CATEGORIES,
  CATEGORY_MAP,
  getSubCategoriesByCategory,
  LEVELS,
  CURRENCIES,
  LESSON_TYPES,
  MATERIAL_TYPES,
  SUBMISSION_TYPES,
} from '../../constants/course/index';
import {
  uid, formatDuration, calculateModuleDuration, calculateCourseDuration,
  createEmptyLesson, createEmptyModule, isValidVideoFile, isValidImageFile,
} from '../../utils/course.utils';

// ─── style constants ──────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600 transition-colors';
const selectCls = inputCls;
const textareaCls = `${inputCls} resize-none`;

const getFilePreviewKind = (fileName = '', mimeType = '', fileUrl = '') => {
  const type = (mimeType || '').toLowerCase();
  const name = (fileName || fileUrl || '').toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (name.match(/\.(png|jpe?g|gif|webp|svg)(\?|$)/)) return 'image';
  if (name.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/)) return 'video';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return 'other';
};

const TABS = [
  { key: 'drafts', label: 'Drafts', icon: Save },
  { key: 'basic', label: 'Basic Info', icon: FileText },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'pricing', label: 'Pricing', icon: File },
  { key: 'details', label: 'Details', icon: BookOpen },
  { key: 'seo', label: 'SEO & Tags', icon: FileText },
  { key: 'modules', label: 'Modules & Lessons', icon: Layers },
  { key: 'certificate', label: 'Certificate', icon: Award },
  { key: 'settings', label: 'Settings', icon: AlertCircle },
];

const DEFAULT_CATEGORY = CATEGORIES[0]?.value || '';
const DEFAULT_SUBCATEGORY = CATEGORY_MAP[DEFAULT_CATEGORY]?.[0] || '';

// ─── buildFormData ────────────────────────────────────────────────
const buildFormData = (course, modules, thumbnailFile, trailerFile, certificate, status) => {
  const fd = new FormData();
  const normalizedProjects = (course.projects || [])
    .map((project) => ({
      title: (project?.title || '').trim(),
      description: (project?.description || '').trim(),
    }))
    .filter((project) => project.title && project.description);

  const data = {
    ...course, status, price: Number(course.price) || 0,
    discountPrice: course.discountPrice ? Number(course.discountPrice) : undefined,
    discountValidUntil: course.discountValidUntil || undefined,
    maxStudents: course.maxStudents ? Number(course.maxStudents) : undefined,
    projects: course.projectBased ? normalizedProjects : [],
    totalDuration: calculateCourseDuration(modules),
    modules: modules.map((m, mi) => {
      if (m.thumbnailFile) fd.append(`module_${mi}_thumbnail`, m.thumbnailFile);
      return {
        title: m.title, description: m.description, objectives: m.objectives.filter(Boolean), order: mi + 1,
        lessons: m.lessons.map((l, li) => {
          if (l.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_thumbnail`, l.thumbnailFile);
          const lp = { title: l.title, description: l.description, type: l.type, isFree: l.isFree, order: li + 1 };
          if (l.type === 'video' && l.videoPackage) {
            lp.videoPackage = {
              packageName: l.videoPackage.packageName || l.title, description: l.videoPackage.description || '',
              category: l.videoPackage.category || 'tutorial',
              videos: (l.videoPackage.videos || []).map((v, vi) => {
                if (v.videoFile) fd.append(`module_${mi}_lesson_${li}_video_${vi}`, v.videoFile);
                if (v.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_video_${vi}_thumb`, v.thumbnailFile);
                return { title: v.title || `Video ${vi + 1}`, description: v.description || '', duration: parseInt(v.duration) || 0 };
              }),
            };
          }
          if (l.type === 'article') lp.content = { articleContent: l.content?.articleContent || '' };
          if (l.type === 'assignment' && l.assignment) {
            if (l.assignment.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_assignment_thumb`, l.assignment.thumbnailFile);
            lp.assignment = {
              title: l.assignment.title || l.title, description: l.assignment.description || l.assignment.instructions || 'No description',
              instructions: l.assignment.instructions || '', maxScore: parseInt(l.assignment.maxScore) || 100,
              passingScore: parseInt(l.assignment.passingScore) || 40, dueDate: l.assignment.dueDate || undefined,
              type: l.assignment.type || 'text', allowLateSubmission: l.assignment.allowLateSubmission || false,
              lateSubmissionPenalty: parseInt(l.assignment.lateSubmissionPenalty) || 0,
            };
          }
          if (l.type === 'live' && l.liveClass) {
            lp.liveClass = {
              title: l.liveClass.title || l.title, description: l.liveClass.description || '',
              scheduledAt: l.liveClass.scheduledAt || undefined, duration: parseInt(l.liveClass.duration) || 60,
              timezone: l.liveClass.timezone || 'UTC',
              maxParticipants: parseInt(l.liveClass.maxParticipants) || 100, notes: l.liveClass.notes || undefined,
            };
          }
          if (l.type === 'material' && l.material) {
            if (l.material.materialFile) fd.append(`module_${mi}_lesson_${li}_material_file`, l.material.materialFile);
            lp.material = {
              title: l.material.title || l.title, description: l.material.description || '',
              type: l.material.type || 'pdf', fileName: l.material.fileName || '',
            };
          }
          return lp;
        }),
      };
    }),
  };
  if (course.certificateEnabled && certificate.title) {
    data.certificate = { title: certificate.title, description: certificate.description, expiryDate: certificate.expiryDate || undefined, skills: certificate.skills || [] };
    if (certificate.certificateImage) fd.append('certificateImage', certificate.certificateImage);
  }
  if (data.learningOutcomes?.length === 0) delete data.learningOutcomes;
  if (data.prerequisites?.length === 0) delete data.prerequisites;
  if (data.targetAudience?.length === 0) delete data.targetAudience;
  if (data.tags?.length === 0) delete data.tags;
  if (!data.seoTitle) delete data.seoTitle;
  if (!data.seoDescription) delete data.seoDescription;
  fd.append('data', JSON.stringify(data));
  if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
  if (trailerFile) fd.append('trailerVideo', trailerFile);
  return fd;
};

// ─── DynamicList ──────────────────────────────────────────────────
function DynamicList({ items, onChange, placeholder, label }) {
  const add = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, v) => { const copy = [...items]; copy[i] = v; onChange(copy); };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-gray-300 text-sm font-medium">{label}</label>
        <button type="button" onClick={add} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"><Plus className="w-3 h-3" /> Add</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={e => update(i, e.target.value)} className={inputCls} placeholder={placeholder} />
          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 p-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-600 text-xs italic">No items yet.</p>}
    </div>
  );
}

// ─── ProjectsBuilder ─────────────────────────────────────────────
function ProjectsBuilder({ projects, onChange }) {
  const addProject = () => onChange([...projects, { title: '', description: '', _uid: uid() }]);
  const removeProject = (idx) => onChange(projects.filter((_, index) => index !== idx));
  const updateProject = (idx, field, value) => {
    const copy = [...projects];
    copy[idx] = { ...copy[idx], [field]: value };
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-gray-300 text-sm font-medium">Projects</label>
        <button
          type="button"
          onClick={addProject}
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-md"
        >
          <Plus className="w-3 h-3" /> Add Project
        </button>
      </div>

      {projects.length === 0 && (
        <p className="text-gray-600 text-xs italic">No projects yet. Click Add Project to create one.</p>
      )}

      {projects.map((project, idx) => (
        <div key={project._uid || idx} className="p-3 bg-[#0d0d0d] rounded-lg border border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-medium">Project {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeProject(idx)}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Project Title</label>
            <input
              value={project.title || ''}
              onChange={(e) => updateProject(idx, 'title', e.target.value)}
              className={inputCls}
              maxLength={200}
              placeholder="Enter project title"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Project Description</label>
            <textarea
              value={project.description || ''}
              onChange={(e) => updateProject(idx, 'description', e.target.value)}
              className={textareaCls}
              rows={3}
              maxLength={700}
              placeholder="Describe this project"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TagsInput ────────────────────────────────────────────────────
function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState('');
  const add = () => { const t = input.trim(); if (t && !tags.includes(t)) { onChange([...tags, t]); setInput(''); } };
  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <label className="text-gray-300 text-sm font-medium">Tags</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t, i) => (
          <span key={i} className="flex items-center gap-1 bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-md">
            {t} <button type="button" onClick={() => remove(i)} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} className={inputCls} placeholder="Add a tag and press Enter" />
        <button type="button" onClick={add} className="px-3 py-2 bg-white/10 text-gray-300 text-sm rounded-lg hover:bg-white/20 transition-colors">Add</button>
      </div>
    </div>
  );
}

// ─── LessonItem ───────────────────────────────────────────────────
function LessonItem({ lesson, lessonIdx, onUpdate, onRemove, dragHandleProps }) {
  const [collapsed, setCollapsed] = useState(false);
  const updateField = (field, value) => onUpdate({ ...lesson, [field]: value });
  const updateVideoPackage = (field, value) => onUpdate({ ...lesson, videoPackage: { ...lesson.videoPackage, [field]: value } });
  const updateAssignment = (field, value) => onUpdate({ ...lesson, assignment: { ...lesson.assignment, [field]: value } });
  const updateLiveClass = (field, value) => onUpdate({ ...lesson, liveClass: { ...lesson.liveClass, [field]: value } });
  const updateMaterial = (field, value) => onUpdate({ ...lesson, material: { ...lesson.material, [field]: value } });
  const addVideo = () => { updateVideoPackage('videos', [...(lesson.videoPackage?.videos || []), { _uid: uid(), title: '', description: '', duration: 0, videoFile: null, thumbnailFile: null }]); };
  const removeVideo = (vi) => { updateVideoPackage('videos', (lesson.videoPackage?.videos || []).filter((_, i) => i !== vi)); };
  const updateVideo = (vi, field, value) => { const vids = [...(lesson.videoPackage?.videos || [])]; vids[vi] = { ...vids[vi], [field]: value }; updateVideoPackage('videos', vids); };  
  const typeInfo = LESSON_TYPES.find(t => t.value === lesson.type);
  const LIcon = typeInfo?.icon || FileText;

  return (
    <div className="bg-[#111] border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#161616]">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-0.5">
          <GripVertical className="w-4 h-4" />
        </div>
        <LIcon className="w-4 h-4 text-gray-400" />
        <span className="text-gray-200 text-sm font-medium flex-1 truncate">{lesson.title || `Lesson ${lessonIdx + 1}`}</span>
        <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded capitalize">{lesson.type}</span>
        {lesson.isFree && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Free</span>}
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-gray-200 p-1">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
      </div>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-gray-400 text-xs mb-1 block">Lesson Title *</label><input value={lesson.title} onChange={e => updateField('title', e.target.value)} className={inputCls} placeholder="Enter lesson title" /></div>
            <div><label className="text-gray-400 text-xs mb-1 block">Type</label><select value={lesson.type} onChange={e => updateField('type', e.target.value)} className={selectCls}>{LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          </div>
          <div><label className="text-gray-400 text-xs mb-1 block">Description</label><textarea value={lesson.description} onChange={e => updateField('description', e.target.value)} className={textareaCls} rows={2} placeholder="Lesson description..." /></div>

          {/* VIDEO */}
          {lesson.type === 'video' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-blue-400" /> Video Package</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Package Name</label><input value={lesson.videoPackage?.packageName || ''} onChange={e => updateVideoPackage('packageName', e.target.value)} className={inputCls} placeholder="e.g. Introduction Videos" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Description</label><input value={lesson.videoPackage?.description || ''} onChange={e => updateVideoPackage('description', e.target.value)} className={inputCls} placeholder="Package description" /></div>
              </div>
              <div className="space-y-2">
                {(lesson.videoPackage?.videos || []).map((video, vi) => (
                  <div key={video._uid || vi} className="p-3 bg-[#111] border border-gray-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[10px] font-medium">Video {vi + 1}</span>
                      {(lesson.videoPackage?.videos || []).length > 1 && <button type="button" onClick={() => removeVideo(vi)} className="text-red-400 hover:text-red-300 p-0.5"><Trash2 className="w-3 h-3" /></button>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><label className="text-gray-500 text-[10px] mb-0.5 block">Title</label><input value={video.title} onChange={e => updateVideo(vi, 'title', e.target.value)} className={inputCls} placeholder="Video title" /></div>
                      <div><label className="text-gray-500 text-[10px] mb-0.5 block">Duration (seconds)</label><input type="number" value={video.duration} onChange={e => updateVideo(vi, 'duration', e.target.value)} className={inputCls} min="0" /></div>
                    </div>
                    <div><label className="text-gray-500 text-[10px] mb-0.5 block">Video File</label>
                      <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors w-fit">
                        <Upload className="w-3 h-3" /> {video.videoFile ? video.videoFile.name : 'Choose file'}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f && isValidVideoFile(f)) {
                              updateVideo(vi, 'videoFile', f);
                              updateVideo(vi, 'videoPreviewUrl', URL.createObjectURL(f));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {video.videoFile && <CheckCircle className="w-3.5 h-3.5 text-green-500 inline ml-2" />}
                    </div>

                    {video.videoPreviewUrl && (
                      <div>
                        <label className="text-gray-500 text-[10px] mb-1 block">Video Preview</label>
                        <video controls className="w-full rounded-md border border-gray-800 bg-black" src={video.videoPreviewUrl} />
                      </div>
                    )}

                    <div>
                      <label className="text-gray-500 text-[10px] mb-0.5 block">Video Thumbnail</label>
                      <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors w-fit">
                        <Upload className="w-3 h-3" /> {video.thumbnailFile ? video.thumbnailFile.name : 'Choose image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f && isValidImageFile(f)) {
                              updateVideo(vi, 'thumbnailFile', f);
                              updateVideo(vi, 'thumbnailPreviewUrl', URL.createObjectURL(f));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {video.thumbnailPreviewUrl && (
                      <div>
                        <label className="text-gray-500 text-[10px] mb-1 block">Thumbnail Preview</label>
                        <img src={video.thumbnailPreviewUrl} alt="Video thumbnail preview" className="w-full h-28 object-cover rounded-md border border-gray-800" />
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addVideo} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-md w-full justify-center"><Plus className="w-3 h-3" /> Add Video</button>
              </div>
            </div>
          )}

          {/* ARTICLE */}
          {lesson.type === 'article' && (
            <div className="p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <label className="text-gray-400 text-xs mb-1 block">Article Content</label>
              <textarea value={lesson.content?.articleContent || ''} onChange={e => onUpdate({ ...lesson, content: { ...lesson.content, articleContent: e.target.value } })} className={textareaCls} rows={6} placeholder="Write article content (Markdown supported)..." />
            </div>
          )}

          {/* ASSIGNMENT */}
          {lesson.type === 'assignment' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-orange-400" /> Assignment</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Title</label><input value={lesson.assignment?.title || ''} onChange={e => updateAssignment('title', e.target.value)} className={inputCls} placeholder="Assignment title" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Submission Type</label><select value={lesson.assignment?.type || 'text'} onChange={e => updateAssignment('type', e.target.value)} className={selectCls}>{SUBMISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              </div>
              <div><label className="text-gray-400 text-xs mb-1 block">Description</label><textarea value={lesson.assignment?.description || ''} onChange={e => updateAssignment('description', e.target.value)} className={textareaCls} rows={2} placeholder="Assignment description..." /></div>
              <div><label className="text-gray-400 text-xs mb-1 block">Instructions</label><textarea value={lesson.assignment?.instructions || ''} onChange={e => updateAssignment('instructions', e.target.value)} className={textareaCls} rows={3} placeholder="Detailed instructions..." /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Max Score</label><input type="number" value={lesson.assignment?.maxScore ?? 100} onChange={e => updateAssignment('maxScore', e.target.value)} className={inputCls} min="1" max="100" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Passing Score</label><input type="number" value={lesson.assignment?.passingScore ?? 40} onChange={e => updateAssignment('passingScore', e.target.value)} className={inputCls} min="0" max="100" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Due Date</label><input type="datetime-local" value={lesson.assignment?.dueDate || ''} onChange={e => updateAssignment('dueDate', e.target.value)} className={inputCls} /></div>
              </div>
              <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer"><input type="checkbox" checked={lesson.assignment?.allowLateSubmission || false} onChange={e => updateAssignment('allowLateSubmission', e.target.checked)} className="accent-blue-500" /> Allow Late Submission</label>
              {lesson.assignment?.allowLateSubmission && <div><label className="text-gray-400 text-xs mb-1 block">Late Penalty (%)</label><input type="number" value={lesson.assignment?.lateSubmissionPenalty || 0} onChange={e => updateAssignment('lateSubmissionPenalty', e.target.value)} className={inputCls} min="0" max="100" /></div>}
            </div>
          )}

          {/* LIVE */}
          {lesson.type === 'live' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-red-400" /> Live Session</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Title</label><input value={lesson.liveClass?.title || ''} onChange={e => updateLiveClass('title', e.target.value)} className={inputCls} placeholder="Live session title" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Scheduled At</label><input type="datetime-local" value={lesson.liveClass?.scheduledAt || ''} onChange={e => updateLiveClass('scheduledAt', e.target.value)} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Duration (min)</label><input type="number" value={lesson.liveClass?.duration || 60} onChange={e => updateLiveClass('duration', e.target.value)} className={inputCls} min="15" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Max Participants</label><input type="number" value={lesson.liveClass?.maxParticipants || 100} onChange={e => updateLiveClass('maxParticipants', e.target.value)} className={inputCls} min="1" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Timezone</label><input value={lesson.liveClass?.timezone || 'UTC'} onChange={e => updateLiveClass('timezone', e.target.value)} className={inputCls} /></div>
              </div>
              <p className="text-gray-600 text-[10px]">Stream via Cloudflare Stream. Manage OBS credentials from the Live Classes page.</p>
              <div><label className="text-gray-400 text-xs mb-1 block">Description</label><textarea value={lesson.liveClass?.description || ''} onChange={e => updateLiveClass('description', e.target.value)} className={textareaCls} rows={2} placeholder="Session description..." /></div>
              <div><label className="text-gray-400 text-xs mb-1 block">Notes</label><textarea value={lesson.liveClass?.notes || ''} onChange={e => updateLiveClass('notes', e.target.value)} className={textareaCls} rows={2} placeholder="Notes for students..." /></div>
            </div>
          )}

          {/* MATERIAL */}
          {lesson.type === 'material' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5"><File className="w-3.5 h-3.5 text-green-400" /> Material</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-gray-400 text-xs mb-1 block">Title</label><input value={lesson.material?.title || ''} onChange={e => updateMaterial('title', e.target.value)} className={inputCls} placeholder="Material title" /></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Type</label><select value={lesson.material?.type || 'pdf'} onChange={e => updateMaterial('type', e.target.value)} className={selectCls}>{MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              </div>
              <div><label className="text-gray-400 text-xs mb-1 block">Description</label><textarea value={lesson.material?.description || ''} onChange={e => updateMaterial('description', e.target.value)} className={textareaCls} rows={2} placeholder="Material description..." /></div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Upload File</label>
                <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors w-fit">
                  <Upload className="w-3 h-3" /> {lesson.material?.materialFile ? lesson.material.materialFile.name : 'Choose file'}
                  <input
                    type="file"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        onUpdate({
                          ...lesson,
                          material: {
                            ...lesson.material,
                            materialFile: f,
                            fileName: f.name,
                            materialPreviewUrl: URL.createObjectURL(f),
                            mimeType: f.type,
                          }
                        });
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {lesson.material?.materialFile && <div className="flex items-center gap-2 mt-1"><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-green-400 text-[10px]">{lesson.material.materialFile.name}</span></div>}
              </div>

              {lesson.material?.materialPreviewUrl && (
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Material Preview</label>
                  {getFilePreviewKind(lesson.material.fileName, lesson.material.mimeType) === 'image' && (
                    <img src={lesson.material.materialPreviewUrl} alt="Material preview" className="w-full max-h-48 object-contain rounded-md border border-gray-800 bg-black" />
                  )}
                  {getFilePreviewKind(lesson.material.fileName, lesson.material.mimeType) === 'video' && (
                    <video controls src={lesson.material.materialPreviewUrl} className="w-full rounded-md border border-gray-800 bg-black" />
                  )}
                  {getFilePreviewKind(lesson.material.fileName, lesson.material.mimeType) === 'pdf' && (
                    <iframe title="Material PDF preview" src={lesson.material.materialPreviewUrl} className="w-full h-64 rounded-md border border-gray-800 bg-black" />
                  )}
                  {getFilePreviewKind(lesson.material.fileName, lesson.material.mimeType) === 'other' && (
                    <p className="text-gray-500 text-xs">Preview is unavailable for this file type.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free Toggle */}
          <div className="flex items-center gap-3 px-2 py-2 bg-[#0f0f0f] rounded-lg border border-gray-800">
            <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer"><input type="checkbox" checked={lesson.isFree} onChange={e => updateField('isFree', e.target.checked)} className="accent-blue-500" /> Free preview lesson</label>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ModuleItem ───────────────────────────────────────────────────
function ModuleItem({ module, moduleIdx, onUpdate, onRemove, totalModules, dragHandleProps }) {
  const thumbnailInputRef = useRef(null);
  const updateField = useCallback((field, value) => { onUpdate({ ...module, [field]: value }); }, [module, onUpdate]);
  const toggleCollapsed = () => updateField('collapsed', !module.collapsed);
  const addLesson = () => updateField('lessons', [...module.lessons, createEmptyLesson()]);
  const removeLesson = (idx) => updateField('lessons', module.lessons.filter((_, i) => i !== idx));
  const updateLesson = (idx, lesson) => { const copy = [...module.lessons]; copy[idx] = lesson; updateField('lessons', copy); };
  const onLessonDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const items = Array.from(module.lessons);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    updateField('lessons', items);
  }, [module.lessons, updateField]);
  const moduleDuration = calculateModuleDuration(module.lessons);

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#181818] border-b border-gray-800">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300">
          <GripVertical className="w-5 h-5" />
        </div>
        <Layers className="w-5 h-5 text-blue-400" />
        <div className="flex-1 min-w-0">
          <span className="text-white font-semibold text-sm truncate block">{module.title || `Module ${moduleIdx + 1}`}</span>
          <span className="text-gray-500 text-xs">{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''} • {formatDuration(moduleDuration)}</span>
        </div>
        <button type="button" onClick={toggleCollapsed} className="text-gray-400 hover:text-gray-200 p-1.5 rounded-md hover:bg-gray-700/50">
          {module.collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
        {totalModules > 1 && <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10"><Trash2 className="w-5 h-5" /></button>}
      </div>
      {!module.collapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-gray-400 text-xs mb-1 block">Module Title *</label><input value={module.title} onChange={e => updateField('title', e.target.value)} className={inputCls} placeholder="Enter module title" /></div>
            <div><label className="text-gray-400 text-xs mb-1 block">Description</label><input value={module.description} onChange={e => updateField('description', e.target.value)} className={inputCls} placeholder="Brief module description" /></div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Module Thumbnail</label>
            {module.thumbnailPreview ? (
              <div className="relative group">
                <img src={module.thumbnailPreview} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg" />
                <button type="button" onClick={() => onUpdate({ ...module, thumbnailFile: null, thumbnailPreview: null })} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="w-full h-32 flex items-center justify-center gap-2 bg-[#0f0f0f] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"><ImageIcon className="w-6 h-6 text-gray-500" /></button>
            )}
            <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f && isValidImageFile(f)) onUpdate({ ...module, thumbnailFile: f, thumbnailPreview: URL.createObjectURL(f) }); }} className="hidden" />
          </div>
          <DynamicList items={module.objectives} onChange={v => updateField('objectives', v)} placeholder="Module objective..." label="Learning Objectives" />
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-200 text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Lessons</h4>
              <button type="button" onClick={addLesson} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-md"><Plus className="w-3 h-3" /> Add Lesson</button>
            </div>
            <DragDropContext onDragEnd={onLessonDragEnd} nonce={module.lessons.length}>
              <StrictModeDroppable droppableId={`lessons-${module._uid}`} type="LESSON">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 p-2 rounded-lg ${snapshot.isDraggingOver ? 'bg-blue-500/5 border border-blue-500/30' : ''}`}
                  >
                    {module.lessons.map((lesson, li) => (
                      <Draggable key={lesson._uid} draggableId={lesson._uid} index={li}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? 'opacity-50 shadow-lg' : ''}
                          >
                            <LessonItem
                              lesson={lesson}
                              lessonIdx={li}
                              onUpdate={l => updateLesson(li, l)}
                              onRemove={() => removeLesson(li)}
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
            {module.lessons.length === 0 && <div className="text-center py-6 text-gray-600 text-sm border border-dashed border-gray-800 rounded-lg">No lessons yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main CreateCourse Page ───────────────────────────────────────
export default function CreateCourse() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const createLoading = useSelector(selectCreateCourseLoading);
  const createError = useSelector(selectCreateCourseError);
  const draftCourses = useSelector(selectCourses);
  const draftCoursesLoading = useSelector(selectCoursesLoading);

  const [activeTab, setActiveTab] = useState('basic');
  const [course, setCourse] = useState({
    title: '', description: '', shortDescription: '', category: DEFAULT_CATEGORY,
    subCategory: DEFAULT_SUBCATEGORY,
    level: 'beginner', language: 'English', price: 0, currency: 'INR',
    discountPrice: '', discountValidUntil: '', isFree: false, status: 'draft',
    certificateEnabled: true, allowPreview: true, maxStudents: '',
    isInternshipEligible: false,
    projectBased: false,
    projects: [],
    learningOutcomes: [], prerequisites: [], targetAudience: [],
    tags: [], seoTitle: '', seoDescription: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);
  const [trailerPreview, setTrailerPreview] = useState(null);
  const [modules, setModules] = useState([createEmptyModule()]);
  const [certificate, setCertificate] = useState({ title: '', description: '', certificateImage: null, certificatePreview: null, expiryDate: '', skills: [] });
  const [toast, setToast] = useState(null);
  const [draftCourseId, setDraftCourseId] = useState(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const showToast = useCallback((message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); }, []);

  const handleCourseChange = useCallback((field, value) => { setCourse(prev => ({ ...prev, [field]: value })); }, []);
  const handleCategoryChange = useCallback((categoryValue) => {
    const nextSubCategory = CATEGORY_MAP[categoryValue]?.[0] || '';
    setCourse(prev => ({ ...prev, category: categoryValue, subCategory: nextSubCategory }));
  }, []);

  const subCategoryOptions = getSubCategoriesByCategory(course.category);

  useEffect(() => {
    if (activeTab === 'drafts') {
      dispatch(getMyCourses({ status: 'draft', page: 1, limit: 50 }));
    }
  }, [activeTab, dispatch]);

  const addModule = useCallback(() => { setModules(prev => [...prev, createEmptyModule()]); }, []);
  const removeModule = useCallback((idx) => setModules(prev => prev.filter((_, i) => i !== idx)), []);
  const updateModule = useCallback((idx, mod) => { setModules(prev => { const copy = [...prev]; copy[idx] = mod; return copy; }); }, []);
  const onDragEnd = useCallback((result) => {
    if (!result.destination || result.type !== 'MODULE') return;
    const items = Array.from(modules);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setModules(items);
  }, [modules]);

  const handlePublish = async () => {
    if (!course.title?.trim()) { showToast('Course title is required', 'error'); setActiveTab('basic'); return; }
    if (!course.description?.trim()) { showToast('Description is required', 'error'); setActiveTab('basic'); return; }
    if (!course.category) { showToast('Category is required', 'error'); setActiveTab('basic'); return; }
    if (!course.subCategory) { showToast('Subcategory is required', 'error'); setActiveTab('basic'); return; }
    setIsSavingCourse(true);
    const fd = buildFormData(course, modules, thumbnailFile, trailerFile, certificate, 'published');
    const result = await dispatch(createFullCourse(fd));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Course published!');
      navigate('/instructor/courses');
    } else {
      showToast(result.payload || 'Failed to create course', 'error');
    }
    setIsSavingCourse(false);
  };

  const handleSaveDraft = async () => {
    setIsSavingCourse(true);
    const fd = buildFormData(course, modules, thumbnailFile, trailerFile, certificate, 'draft');
    const result = draftCourseId
      ? await dispatch(updateCourseDraft({ courseId: draftCourseId, formData: fd }))
      : await dispatch(createCourseDraft(fd));

    if (result.meta.requestStatus === 'fulfilled') {
      const savedId = result.payload?.data?._id || result.payload?.data?.course?._id || draftCourseId;
      if (savedId) setDraftCourseId(savedId);
      showToast('Draft saved successfully!');
      setActiveTab('drafts');
      dispatch(getMyCourses({ status: 'draft', page: 1, limit: 50 }));
    } else {
      showToast(result.payload || 'Failed to save draft', 'error');
    }
    setIsSavingCourse(false);
  };

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
            {toast.message}
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/instructor/courses" className="hover:text-white transition-colors">My Courses</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white">Create Course</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><Plus className="w-5 h-5 text-green-400" /></div>
            <div>
              <h1 className="text-xl font-bold text-white">Create Course</h1>
              <p className="text-xs text-gray-500 mt-0.5">Build your complete course with modules, lessons & more</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} disabled={createLoading || isSavingCourse} className="flex items-center gap-2 px-4 py-2.5 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg text-sm transition-colors disabled:opacity-50">
              {isSavingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isSavingCourse ? 'Saving…' : 'Save Draft'}
            </button>
            <button onClick={handlePublish} disabled={createLoading || isSavingCourse} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors">
              {(createLoading || isSavingCourse) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {(createLoading || isSavingCourse) ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {createError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{typeof createError === 'object' ? createError.message : createError}</p>
          </div>
        )}

        {/* Tab Bar */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {TABS.map(tab => {
              const TIcon = tab.icon;
              return (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-[#222] text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
                  <TIcon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="pb-24">
          {/* DRAFTS */}
          {activeTab === 'drafts' && (
            <div className="max-w-5xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold text-lg">Saved Draft Courses</h2>
                  <p className="text-gray-500 text-xs">Continue updating your saved drafts from where you left off</p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(getMyCourses({ status: 'draft', page: 1, limit: 50 }))}
                  className="px-3 py-2 bg-white/10 text-gray-300 text-xs rounded-lg hover:bg-white/20 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {draftCoursesLoading && (
                <div className="text-gray-400 text-sm">Loading draft courses...</div>
              )}

              {!draftCoursesLoading && draftCourses.length === 0 && (
                <div className="bg-[#111] border border-gray-800 rounded-xl p-6 text-center">
                  <p className="text-gray-400 text-sm">No draft courses found yet.</p>
                  <p className="text-gray-600 text-xs mt-1">Use Save Draft to store in-progress courses.</p>
                </div>
              )}

              {!draftCoursesLoading && draftCourses.length > 0 && (
                <div className="space-y-3">
                  {draftCourses.map((draft) => (
                    <div key={draft._id} className="bg-[#111] border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{draft.title || 'Untitled Draft'}</p>
                        <p className="text-gray-500 text-xs mt-1 truncate">
                          Last updated: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : 'Just now'}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">Status: {draft.status || 'draft'}</p>
                      </div>
                      <Link
                        to={`/instructor/courses/${draft._id}/edit`}
                        className="shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                      >
                        Continue Draft
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="max-w-4xl space-y-5">
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Course Title *</label>
                <input value={course.title} onChange={e => handleCourseChange('title', e.target.value)} className={inputCls} placeholder="e.g. Complete React Masterclass" maxLength={100} />
                <p className="text-gray-600 text-xs mt-1">{course.title.length}/100</p>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Short Description</label>
                <input value={course.shortDescription} onChange={e => handleCourseChange('shortDescription', e.target.value)} className={inputCls} placeholder="Brief one-liner" maxLength={300} />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Full Description *</label>
                <textarea value={course.description} onChange={e => handleCourseChange('description', e.target.value)} className={textareaCls} rows={5} maxLength={2000} placeholder="Detailed course description..." />
                <p className="text-gray-600 text-xs mt-1">{course.description.length}/2000</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Category</label>
                  <select value={course.category} onChange={e => handleCategoryChange(e.target.value)} className={selectCls}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">Subcategory</label>
                  <select value={course.subCategory} onChange={e => handleCourseChange('subCategory', e.target.value)} className={selectCls}>
                    {subCategoryOptions.map(sc => <option key={sc.value} value={sc.value}>{sc.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          )}

          {/* MEDIA */}
          {activeTab === 'media' && (
            <div className="max-w-4xl space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
                  <label className="text-gray-300 text-sm font-medium mb-3 block flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Course Thumbnail</label>
                  {thumbnailPreview ? (
                    <div className="relative group">
                      <img src={thumbnailPreview} alt="Thumbnail" className="w-full aspect-video object-cover rounded-lg" />
                      <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center bg-[#0a0a0a] rounded-lg border border-dashed border-gray-700"><ImageIcon className="w-8 h-8 text-gray-600" /></div>
                  )}
                  <label className="mt-3 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2.5 rounded-lg cursor-pointer transition-colors w-fit">
                    <Upload className="w-4 h-4" /> {thumbnailPreview ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)); } }} className="hidden" />
                  </label>
                </div>
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
                  <label className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-2"><Video className="w-4 h-4" /> Trailer Video</label>
                  {trailerPreview ? (
                    <div className="space-y-2 mb-3">
                      <video controls src={trailerPreview} className="w-full rounded-lg border border-gray-800 bg-black aspect-video" />
                      {trailerFile && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-400 text-sm truncate">{trailerFile.name}</span><button type="button" onClick={() => { setTrailerFile(null); setTrailerPreview(null); }} className="text-gray-500 hover:text-red-400 p-1"><X className="w-3.5 h-3.5" /></button></div>}
                    </div>
                  ) : <div className="w-full aspect-video flex items-center justify-center bg-[#0a0a0a] rounded-lg border border-dashed border-gray-700 mb-3"><Video className="w-8 h-8 text-gray-600" /></div>}
                  <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2.5 rounded-lg cursor-pointer transition-colors w-fit">
                    <Upload className="w-4 h-4" /> {trailerFile ? 'Replace' : 'Upload'}
                    <input type="file" accept="video/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setTrailerFile(f); setTrailerPreview(URL.createObjectURL(f)); } }} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PRICING */}
          {activeTab === 'pricing' && (
            <div className="max-w-4xl space-y-5">
              <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
                <div><span className="text-gray-200 text-sm font-medium">Free Course</span><p className="text-gray-500 text-xs mt-0.5">Make this course available for free</p></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={course.isFree} onChange={e => handleCourseChange('isFree', e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
              {!course.isFree && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Price</label><input type="number" value={course.price} onChange={e => handleCourseChange('price', e.target.value)} className={inputCls} min="0" /></div>
                    <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Discount Price</label><input type="number" value={course.discountPrice} onChange={e => handleCourseChange('discountPrice', e.target.value)} className={inputCls} min="0" /></div>
                    <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Currency</label><select value={course.currency} onChange={e => handleCourseChange('currency', e.target.value)} className={selectCls}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Discount Valid Until</label><input type="date" value={course.discountValidUntil} onChange={e => handleCourseChange('discountValidUntil', e.target.value)} className={inputCls} /></div>
                    <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Max Students</label><input type="number" value={course.maxStudents} onChange={e => handleCourseChange('maxStudents', e.target.value)} className={inputCls} /></div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* DETAILS */}
          {activeTab === 'details' && (
            <div className="max-w-4xl space-y-5">
              <DynamicList items={course.learningOutcomes} onChange={v => handleCourseChange('learningOutcomes', v)} placeholder="e.g. Build full-stack React apps" label="Learning Outcomes" />
              <div className="border-t border-gray-800" />
              <DynamicList items={course.prerequisites} onChange={v => handleCourseChange('prerequisites', v)} placeholder="e.g. Basic JavaScript knowledge" label="Prerequisites" />
              <div className="border-t border-gray-800" />
              <DynamicList items={course.targetAudience} onChange={v => handleCourseChange('targetAudience', v)} placeholder="e.g. Aspiring web developers" label="Target Audience" />
            </div>
          )}

          {/* SEO & TAGS */}
          {activeTab === 'seo' && (
            <div className="max-w-4xl space-y-5">
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
              <div className="border-t border-gray-800" />
              <TagsInput tags={course.tags} onChange={v => handleCourseChange('tags', v)} />
            </div>
          )}

          {/* MODULES & LESSONS */}
          {activeTab === 'modules' && (
            <div className="max-w-5xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold text-lg">Modules & Lessons</h2>
                  <p className="text-gray-500 text-xs">Build your course structure with modules and lessons</p>
                </div>
                <button type="button" onClick={addModule} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors"><Plus className="w-4 h-4" /> Add Module</button>
              </div>
              <div className="space-y-3">
                <DragDropContext onDragEnd={onDragEnd} nonce={modules.length}>
                  <StrictModeDroppable droppableId="modules" type="MODULE">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 p-2 rounded-lg ${snapshot.isDraggingOver ? 'bg-blue-500/5 border border-blue-500/20' : ''}`}
                      >
                        {modules.map((mod, idx) => (
                          <Draggable key={mod._uid} draggableId={mod._uid} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={snapshot.isDragging ? 'opacity-80 shadow-xl' : ''}
                              >
                                <ModuleItem
                                  module={mod}
                                  moduleIdx={idx}
                                  onUpdate={m => updateModule(idx, m)}
                                  onRemove={() => removeModule(idx)}
                                  totalModules={modules.length}
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
              </div>
              {modules.length === 0 && (
                <div className="text-center py-12 text-gray-600 border border-dashed border-gray-800 rounded-xl"><Layers className="w-10 h-10 mx-auto mb-3 text-gray-700" /><p className="text-sm">No modules yet.</p></div>
              )}
            </div>
          )}

          {/* CERTIFICATE */}
          {activeTab === 'certificate' && (
            <div className="max-w-4xl space-y-5">
              <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
                <div><span className="text-gray-200 text-sm font-medium">Enable Certificate</span><p className="text-gray-500 text-xs mt-0.5">Issue certificates on completion</p></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={course.certificateEnabled} onChange={e => handleCourseChange('certificateEnabled', e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
              {course.certificateEnabled && (
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5 space-y-4">
                  <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Certificate Title</label><input value={certificate.title} onChange={e => setCertificate(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="e.g. Course Completion Certificate" /></div>
                  <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Description</label><textarea value={certificate.description} onChange={e => setCertificate(p => ({ ...p, description: e.target.value }))} className={textareaCls} rows={2} placeholder="Certificate description..." /></div>
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Certificate Image</label>
                    {certificate.certificatePreview && <img src={certificate.certificatePreview} alt="Certificate" className="w-full max-h-40 object-contain rounded-lg border border-gray-800 mb-2" />}
                    <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2.5 rounded-lg cursor-pointer transition-colors w-fit">
                      <ImageIcon className="w-4 h-4" /> {certificate.certificatePreview ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setCertificate(p => ({ ...p, certificateImage: f, certificatePreview: URL.createObjectURL(f) })); }} />
                    </label>
                  </div>
                  <div><label className="text-gray-300 text-sm font-medium mb-1.5 block">Expiry Date</label><input type="date" value={certificate.expiryDate} onChange={e => setCertificate(p => ({ ...p, expiryDate: e.target.value }))} className={inputCls} /></div>
                  <DynamicList items={certificate.skills} onChange={skills => setCertificate(p => ({ ...p, skills }))} placeholder="e.g. React Development" label="Skills Earned" />
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-5">
              <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
                <div><span className="text-gray-200 text-sm font-medium">Allow Preview</span><p className="text-gray-500 text-xs mt-0.5">Let users preview free lessons</p></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={course.allowPreview} onChange={e => handleCourseChange('allowPreview', e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
                <div>
                  <span className="text-gray-200 text-sm font-medium">Internship Eligible</span>
                  <p className="text-gray-500 text-xs mt-0.5">Mark this course as eligible for internship opportunities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={course.isInternshipEligible} onChange={e => handleCourseChange('isInternshipEligible', e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
                <div>
                  <span className="text-gray-200 text-sm font-medium">Project Based</span>
                  <p className="text-gray-500 text-xs mt-0.5">Enable this if the course includes practical projects</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={course.projectBased} onChange={e => handleCourseChange('projectBased', e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {course.projectBased && (
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
                  <ProjectsBuilder
                    projects={course.projects}
                    onChange={(projects) => handleCourseChange('projects', projects)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur border-t border-gray-800 px-6 py-3 flex items-center justify-between z-40">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span className="font-medium text-blue-400">Total: {formatDuration(modules.reduce((s, m) => s + calculateModuleDuration(m.lessons), 0))}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/instructor/courses" className="px-4 py-2 bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm rounded-lg transition-colors">Cancel</Link>
            <button onClick={handleSaveDraft} disabled={createLoading || isSavingCourse} className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm rounded-lg transition-colors disabled:opacity-50">
              {isSavingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isSavingCourse ? 'Saving…' : 'Draft'}
            </button>
            <button onClick={handlePublish} disabled={createLoading || isSavingCourse} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-semibold disabled:opacity-50 transition-colors">
              {(createLoading || isSavingCourse) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {(createLoading || isSavingCourse) ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
