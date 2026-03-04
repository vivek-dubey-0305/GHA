import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from 'nanoid';
import {
  X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Image as ImageIcon,
  Video, FileText, BookOpen, Radio, Save, Send, AlertCircle, Layers, File, Download, FileUp, Eye, EyeOff,
  Award, Upload, Clock, Users, Link as LinkIcon, CheckCircle, Loader2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button, Label, Switch, Separator, Badge, useToast } from '../ui';
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

// 🔥 StrictMode safe DND wrapper (fixes droppable registry crash)
function StrictModeDroppable({ children, ...props }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(animation);
  }, []);

  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
}

// ============================================
// CONSTANTS & HELPERS
// ============================================
const CATEGORIES = [
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'photography', label: 'Photography' },
  { value: 'music', label: 'Music' },
  { value: 'language', label: 'Language' },
  { value: 'health', label: 'Health' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'other', label: 'Other' },
];
const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'];
const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'assignment', label: 'Assignment', icon: BookOpen },
  { value: 'live', label: 'Live Session', icon: Radio },
  { value: 'material', label: 'Material', icon: File },
];

const MATERIAL_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document (DOC/DOCX)' },
  { value: 'spreadsheet', label: 'Spreadsheet' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'code', label: 'Code' },
  { value: 'link', label: 'External Link' },
  { value: 'other', label: 'Other' },
];

const SUBMISSION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'URL' },
  { value: 'mixed', label: 'Mixed' },
];

// Duration utilities (in seconds)
const formatDuration = (seconds) => {
  if (!seconds) return '00:00:00';
  const s = parseInt(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const calculateModuleDuration = (lessons) => {
  return lessons.reduce((sum, l) => {
    if (l.type === 'video') {
      return sum + (l.videoPackage?.videos || []).reduce((vs, v) => vs + (parseInt(v.duration) || 0), 0);
    }
    if (l.type === 'live') return sum + ((parseInt(l.liveClass?.duration) || 0) * 60);
    return sum;
  }, 0);
};

let idCounter = 0;
const uid = () => nanoid();

const createEmptyLesson = () => ({
  _uid: uid(),
  title: '',
  description: '',
  type: 'video',
  isFree: false,
  content: { articleContent: '' },
  // Type-specific model data
  videoPackage: {
    packageName: '', description: '', category: 'tutorial',
    videos: [{ _uid: uid(), title: '', description: '', duration: 0, videoFile: null, thumbnailFile: null, durationLoading: false }],
  },
  assignment: {
    title: '', description: '', instructions: '',
    type: 'text', maxScore: 100, passingScore: 40,
    dueDate: '', allowLateSubmission: false, lateSubmissionPenalty: 0,
    thumbnailFile: null, thumbnailPreview: null,
  },
  liveClass: {
    title: '', description: '',
    scheduledAt: '', duration: 60, timezone: 'UTC',
    zoomMeetingId: '', zoomJoinUrl: '', zoomPassword: '',
    maxParticipants: 100, notes: '',
  },
  material: {
    title: '', description: '', type: 'pdf',
    materialFile: null, fileName: '',
  },
  thumbnailFile: null,
  thumbnailPreview: null,
});

const createEmptyModule = () => ({
  _uid: uid(),
  title: '',
  description: '',
  objectives: [],
  collapsed: false,
  thumbnailFile: null,
  thumbnailPreview: null,
  lessons: [createEmptyLesson()],
});

const inputCls = 'w-full px-3 py-2.5 bg-[#0f0f0f] border border-gray-700 rounded-lg text-black placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors';
const selectCls = 'w-full px-3 py-2.5 bg-[#0f0f0f] border border-gray-700 rounded-lg text-black placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer';
const textareaCls = 'w-full px-3 py-2.5 bg-[#0f0f0f] border border-gray-700 rounded-lg text-black placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors resize-none';

// ============================================
// SUB: File Upload Card
// ============================================
function FileUploadCard({ label, accept, file, preview, onFileChange, onRemove, icon: Icon }) {
  const inputRef = useRef(null);

  return (
    <div className="border border-dashed border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
      <Label className="text-gray-300 text-sm font-medium mb-2 block">{label}</Label>
      {preview ? (
        <div className="relative group">
          {accept?.includes('video') ? (
            <video src={preview} className="w-full h-36 object-cover rounded-lg" controls />
          ) : (
            <img src={preview} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
          )}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 flex flex-col items-center justify-center gap-2 bg-[#0f0f0f] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"
        >
          <Icon className="w-8 h-8 text-gray-500" />
          <span className="text-gray-500 text-sm">Click to upload</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onFileChange(e.target.files?.[0])}
        className="hidden"
      />
    </div>
  );
}

// ============================================
// SUB: Dynamic List
// ============================================
function DynamicList({ items, onChange, placeholder, label }) {
  const addItem = () => onChange([...items, '']);
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx, val) => { const copy = [...items]; copy[idx] = val; onChange(copy); };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-gray-300 text-sm font-medium">{label}</Label>
        <button type="button" onClick={addItem} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input value={item} onChange={(e) => updateItem(idx, e.target.value)} className={inputCls} placeholder={placeholder} />
            <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-600 text-xs italic">No items added yet</p>}
      </div>
    </div>
  );
}

// ============================================
// SUB: Tags Input
// ============================================
function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) { onChange([...tags, tag]); setInput(''); }
  };
  const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));
  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } };

  return (
    <div>
      <Label className="text-gray-300 text-sm font-medium">Tags</Label>
      <div className="flex flex-wrap gap-2 mt-2 mb-2">
        {tags.map((tag, idx) => (
          <span key={idx} className="flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs">
            {tag}
            <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-300"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} className={inputCls} placeholder="Type a tag and press Enter" />
        <Button type="button" onClick={addTag} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 shrink-0">Add</Button>
      </div>
    </div>
  );
}

// ============================================
// SUB: Lesson Item (modular – type-specific refs)
// ============================================
const LessonItem = memo(function LessonItem({ lesson, moduleIdx, lessonIdx, onUpdate, onRemove, dragHandleProps, allLessons, onTogglePreview }) {
  const [collapsed, setCollapsed] = useState(false);
  const thumbnailInputRef = useRef(null);

  const updateField = (field, value) => onUpdate({ ...lesson, [field]: value });
  const updateContent = (field, value) => onUpdate({ ...lesson, content: { ...lesson.content, [field]: value } });
  const updateVideoPackage = (field, value) => onUpdate({ ...lesson, videoPackage: { ...lesson.videoPackage, [field]: value } });
  const updateAssignment = (field, value) => onUpdate({ ...lesson, assignment: { ...lesson.assignment, [field]: value } });
  const updateLiveClass = (field, value) => onUpdate({ ...lesson, liveClass: { ...lesson.liveClass, [field]: value } });
  const updateMaterial = (field, value) => onUpdate({ ...lesson, material: { ...lesson.material, [field]: value } });

  const toast = useToast();

  const handleThumbnailChange = (file) => {
    if (file) onUpdate({ ...lesson, thumbnailFile: file, thumbnailPreview: URL.createObjectURL(file) });
  };
  const removeThumbnail = () => onUpdate({ ...lesson, thumbnailFile: null, thumbnailPreview: null });

  // Video package helpers
  const addVideo = () => {
    const videos = [...(lesson.videoPackage?.videos || []), { _uid: uid(), title: '', description: '', duration: 0, videoFile: null, thumbnailFile: null, durationLoading: false }];
    updateVideoPackage('videos', videos);
  };
  const removeVideo = (vi) => {
    updateVideoPackage('videos', (lesson.videoPackage?.videos || []).filter((_, i) => i !== vi));
  };
  const updateVideo = (vi, field, value) => {
    const videos = [...(lesson.videoPackage?.videos || [])];
    videos[vi] = { ...videos[vi], [field]: value };
    updateVideoPackage('videos', videos);
  };
  const handleVideoFileChange = (vi, file) => {
    if (file) {
      console.log(`[Video Upload] Processing video file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv'];
      if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
        console.warn(`[Video Upload] Unsupported file type: ${file.type}`);
        toast.error(`Unsupported video format. Please use MP4, WebM, or other common video formats.`);
        return;
      }

      // First, update the videoFile in state immediately
      updateVideo(vi, 'videoFile', file);
      updateVideo(vi, 'durationLoading', true);

      // Auto-detect duration from video file with proper cleanup
      const video = document.createElement('video');
      video.preload = 'metadata';
      // Remove crossOrigin for local files - it can cause issues with blob URLs
      // video.crossOrigin = 'anonymous';
      video.muted = true; // Prevent autoplay issues
      video.playsInline = true; // Better mobile support

      const objectUrl = URL.createObjectURL(file);
      let cleaned = false;

      console.log(`[Video Upload] Created object URL: ${objectUrl.substring(0, 50)}... for duration detection`);

      const cleanup = () => {
        if (!cleaned) {
          cleaned = true;
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (e) {
            console.warn('[Video Upload] Error revoking object URL:', e);
          }
          video.src = '';
          video.load(); // Reset video element
          updateVideo(vi, 'durationLoading', false); // Clear loading state
          console.log(`[Video Upload] Cleaned up video element and object URL`);
        }
      };

      // Set timeout to ensure cleanup happens (increased for large files)
      const timeoutId = setTimeout(() => {
        console.warn(`[Video Upload] Duration detection timed out for ${file.name}`);
        updateVideo(vi, 'durationLoading', false);
        toast.warning('Video duration detection timed out. Video will still upload, but please set duration manually if needed.');
        cleanup();
      }, 120000); // 2 minutes for very large files

      video.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        try {
          const duration = Math.round(video.duration);
          console.log(`[Video Upload] Successfully detected duration: ${duration} seconds for ${file.name}`);

          if (duration > 0 && isFinite(duration) && duration < 86400) { // Max 24 hours
            updateVideo(vi, 'duration', duration);
            updateVideo(vi, 'durationLoading', false);
            toast.success(`Video duration detected: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
          } else {
            console.warn(`[Video Upload] Invalid duration detected: ${duration}`);
            updateVideo(vi, 'durationLoading', false);
            toast.warning('Could not detect valid video duration. Video will still upload - set duration manually if needed.');
          }
        } catch (e) {
          console.error('[Video Upload] Error reading video duration:', e);
          updateVideo(vi, 'durationLoading', false);
          toast.warning('Failed to read video duration. Video will still upload - set duration manually if needed.');
        }
        cleanup();
      };

      video.onerror = (e) => {
        clearTimeout(timeoutId);
        console.error(`[Video Upload] Error loading video for duration detection: ${file.name}`, {
          error: e,
          fileType: file.type,
          fileSize: file.size,
          videoError: video.error,
          networkState: video.networkState,
          readyState: video.readyState,
          src: video.src
        });

        updateVideo(vi, 'durationLoading', false);

        // Provide more specific error messages
        let errorMessage = 'Video duration detection failed. Video will still upload - set duration manually if needed.';
        if (video.error) {
          switch (video.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Video loading was aborted. The file might be corrupted. Video will still upload.';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading video. Video will still upload.';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Video format not supported by browser. Try converting to MP4. Video will still upload.';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Video source not supported. The file might be corrupted or in an unsupported format. Video will still upload.';
              break;
            default:
              errorMessage = `Video error: ${video.error.message || 'Unknown error'}. Video will still upload.`;
          }
        }

        toast.warning(errorMessage);
        cleanup();
      };

      video.onabort = () => {
        clearTimeout(timeoutId);
        console.warn(`[Video Upload] Video loading aborted for ${file.name}`);
        updateVideo(vi, 'durationLoading', false);
        toast.warning('Video duration detection was cancelled. Video will still upload.');
        cleanup();
      };

      video.onloadstart = () => {
        console.log(`[Video Upload] Started loading video metadata for ${file.name}`);
      };

      video.onprogress = () => {
        console.log(`[Video Upload] Loading video progress for ${file.name}`);
      };

      video.oncanplay = () => {
        console.log(`[Video Upload] Video can play: ${file.name}`);
      };

      // Set the source after all event handlers are attached
      console.log(`[Video Upload] Setting video src for ${file.name}`);
      video.src = objectUrl;
      console.log(`[Video Upload] Video src set successfully for ${file.name}`);
    }
  };

  const lessonTypeIcon = LESSON_TYPES.find(t => t.value === lesson.type)?.icon || FileText;
  const LTypeIcon = lessonTypeIcon;
  const totalVideoDuration = (lesson.videoPackage?.videos || []).reduce((s, v) => s + (parseInt(v.duration) || 0), 0);

  return (
    <div className="bg-[#111] border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#161616]">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300">
          <GripVertical className="w-4 h-4" />
        </div>
        <LTypeIcon className="w-4 h-4 text-gray-400" />
        <span className="text-gray-200 text-sm font-medium flex-1 truncate">{lesson.title || `Lesson ${lessonIdx + 1}`}</span>
        <Badge className="text-[10px] bg-gray-700 text-gray-300 capitalize">{lesson.type}</Badge>
        {lesson.isFree && <Eye className="w-3.5 h-3.5 text-blue-400" title="Preview" />}
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-gray-200 p-1">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Lesson Title *</label>
              <input value={lesson.title} onChange={(e) => updateField('title', e.target.value)} className={inputCls} placeholder="Enter lesson title" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Type</label>
              <select value={lesson.type} onChange={(e) => updateField('type', e.target.value)} className={selectCls}>
                {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Description</label>
            <textarea value={lesson.description} onChange={(e) => updateField('description', e.target.value)} className={textareaCls} rows={2} placeholder="Lesson description..." />
          </div>

          {/* ── VIDEO TYPE: VideoPackage fields ── */}
          {lesson.type === 'video' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <div className="flex items-center justify-between">
                <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-400" /> Video Package
                </h5>
                <span className="text-gray-500 text-[10px]">Total: {formatDuration(totalVideoDuration)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Package Name</label>
                  <input value={lesson.videoPackage?.packageName || ''} onChange={(e) => updateVideoPackage('packageName', e.target.value)} className={inputCls} placeholder="e.g., Introduction Videos" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Category</label>
                  <select value={lesson.videoPackage?.category || 'tutorial'} onChange={(e) => updateVideoPackage('category', e.target.value)} className={selectCls}>
                    <option value="lecture">Lecture</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="workshop">Workshop</option>
                    <option value="demo">Demo</option>
                    <option value="interview">Interview</option>
                    <option value="webinar">Webinar</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea value={lesson.videoPackage?.description || ''} onChange={(e) => updateVideoPackage('description', e.target.value)} className={textareaCls} rows={2} placeholder="Video package description..." />
              </div>

              {/* Videos list */}
              <div className="space-y-2">
                {(lesson.videoPackage?.videos || []).map((video, vi) => (
                  <div key={video._uid || vi} className="p-3 bg-[#111] border border-gray-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[10px] font-medium">Video {vi + 1}</span>
                      {(lesson.videoPackage?.videos || []).length > 1 && (
                        <button type="button" onClick={() => removeVideo(vi)} className="text-red-400 hover:text-red-300 p-0.5"><Trash2 className="w-3 h-3" /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-500 text-[10px] mb-0.5 block">Title</label>
                        <input value={video.title} onChange={(e) => updateVideo(vi, 'title', e.target.value)} className={inputCls} placeholder="Video title" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-[10px] mb-0.5 block">Duration {video.durationLoading ? '(detecting...)' : '(auto-detected)'}</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={video.duration} onChange={(e) => updateVideo(vi, 'duration', e.target.value)} className={inputCls} placeholder="0" min="0" disabled={video.durationLoading} />
                          <span className="text-gray-600 text-[10px] whitespace-nowrap">{formatDuration(video.duration)}</span>
                          {video.durationLoading && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-500 text-[10px] mb-0.5 block">Video File</label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors">
                          <Upload className="w-3 h-3" />
                          {video.videoFile ? video.videoFile.name : 'Choose file'}
                          <input type="file" accept="video/*" onChange={(e) => handleVideoFileChange(vi, e.target.files?.[0])} className="hidden" />
                        </label>
                        {video.videoFile && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addVideo} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-md w-full justify-center">
                  <Plus className="w-3 h-3" /> Add Video
                </button>
              </div>

              {/* Lesson Thumbnail */}
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Lesson Thumbnail</label>
                {lesson.thumbnailPreview ? (
                  <div className="relative group">
                    <img src={lesson.thumbnailPreview} alt="Thumbnail" className="w-full h-24 object-cover rounded-lg" />
                    <button type="button" onClick={removeThumbnail} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="w-full h-24 flex items-center justify-center gap-2 bg-[#0f0f0f] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                  </button>
                )}
                <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={(e) => handleThumbnailChange(e.target.files?.[0])} className="hidden" />
              </div>
            </div>
          )}

          {/* ── ARTICLE TYPE ── */}
          {lesson.type === 'article' && (
            <div className="p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <label className="text-gray-400 text-xs mb-1 block">Article Content</label>
              <textarea value={lesson.content?.articleContent || ''} onChange={(e) => updateContent('articleContent', e.target.value)} className={textareaCls} rows={6} placeholder="Write article content here (Markdown supported)..." />
            </div>
          )}

          {/* ── ASSIGNMENT TYPE: Assignment model fields ── */}
          {lesson.type === 'assignment' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" /> Assignment Details
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Assignment Title *</label>
                  <input value={lesson.assignment?.title || ''} onChange={(e) => updateAssignment('title', e.target.value)} className={inputCls} placeholder="Assignment title" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Submission Type</label>
                  <select value={lesson.assignment?.type || 'text'} onChange={(e) => updateAssignment('type', e.target.value)} className={selectCls}>
                    {SUBMISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description * (min 10 chars)</label>
                <textarea value={lesson.assignment?.description || ''} onChange={(e) => updateAssignment('description', e.target.value)} className={textareaCls} rows={2} placeholder="Assignment description (required, min 10 characters)..." />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Instructions</label>
                <textarea value={lesson.assignment?.instructions || ''} onChange={(e) => updateAssignment('instructions', e.target.value)} className={textareaCls} rows={3} placeholder="Detailed instructions for students..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Max Score * (1–100)</label>
                  <input type="number" value={lesson.assignment?.maxScore ?? 100} onChange={(e) => updateAssignment('maxScore', e.target.value)} className={inputCls} min="1" max="100" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Passing Score</label>
                  <input type="number" value={lesson.assignment?.passingScore ?? 40} onChange={(e) => updateAssignment('passingScore', e.target.value)} className={inputCls} min="0" max="100" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Due Date *</label>
                  <input type="datetime-local" value={lesson.assignment?.dueDate || ''} onChange={(e) => updateAssignment('dueDate', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer">
                    <input type="checkbox" checked={lesson.assignment?.allowLateSubmission || false} onChange={(e) => updateAssignment('allowLateSubmission', e.target.checked)} className="accent-blue-500" />
                    Allow Late Submission
                  </label>
                </div>
                {lesson.assignment?.allowLateSubmission && (
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Late Penalty (%)</label>
                    <input type="number" value={lesson.assignment?.lateSubmissionPenalty || 0} onChange={(e) => updateAssignment('lateSubmissionPenalty', e.target.value)} className={inputCls} min="0" max="100" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Assignment Thumbnail</label>
                <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors w-fit">
                  <Upload className="w-3 h-3" />
                  {lesson.assignment?.thumbnailFile ? lesson.assignment.thumbnailFile.name : 'Upload thumbnail'}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) updateAssignment('thumbnailFile', f);
                  }} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* ── LIVE TYPE: LiveClass model fields ── */}
          {lesson.type === 'live' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400" /> Live Session Details
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Session Title *</label>
                  <input value={lesson.liveClass?.title || ''} onChange={(e) => updateLiveClass('title', e.target.value)} className={inputCls} placeholder="Live session title" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Scheduled At *</label>
                  <input type="datetime-local" value={lesson.liveClass?.scheduledAt || ''} onChange={(e) => updateLiveClass('scheduledAt', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Zoom Join URL *</label>
                  <input value={lesson.liveClass?.zoomJoinUrl || ''} onChange={(e) => updateLiveClass('zoomJoinUrl', e.target.value)} className={inputCls} placeholder="https://zoom.us/j/..." />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Zoom Meeting ID *</label>
                  <input value={lesson.liveClass?.zoomMeetingId || ''} onChange={(e) => updateLiveClass('zoomMeetingId', e.target.value)} className={inputCls} placeholder="e.g., 123-456-789" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Zoom Password</label>
                  <input value={lesson.liveClass?.zoomPassword || ''} onChange={(e) => updateLiveClass('zoomPassword', e.target.value)} className={inputCls} placeholder="Optional" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Duration (minutes) *</label>
                  <input type="number" value={lesson.liveClass?.duration || 60} onChange={(e) => updateLiveClass('duration', e.target.value)} className={inputCls} min="15" max="480" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Timezone</label>
                  <input value={lesson.liveClass?.timezone || 'UTC'} onChange={(e) => updateLiveClass('timezone', e.target.value)} className={inputCls} placeholder="UTC" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Max Participants</label>
                  <input type="number" value={lesson.liveClass?.maxParticipants || 100} onChange={(e) => updateLiveClass('maxParticipants', e.target.value)} className={inputCls} min="1" max="10000" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea value={lesson.liveClass?.description || ''} onChange={(e) => updateLiveClass('description', e.target.value)} className={textareaCls} rows={2} placeholder="Session description..." />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Notes</label>
                <textarea value={lesson.liveClass?.notes || ''} onChange={(e) => updateLiveClass('notes', e.target.value)} className={textareaCls} rows={2} placeholder="Additional notes for students..." />
              </div>
            </div>
          )}

          {/* ── MATERIAL TYPE: Material model fields ── */}
          {lesson.type === 'material' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                <File className="w-3.5 h-3.5 text-green-400" /> Material Details
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Material Title *</label>
                  <input value={lesson.material?.title || ''} onChange={(e) => updateMaterial('title', e.target.value)} className={inputCls} placeholder="Material title" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Material Type *</label>
                  <select value={lesson.material?.type || 'pdf'} onChange={(e) => updateMaterial('type', e.target.value)} className={selectCls}>
                    {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea value={lesson.material?.description || ''} onChange={(e) => updateMaterial('description', e.target.value)} className={textareaCls} rows={2} placeholder="Material description..." />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Upload File *</label>
                <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors w-fit">
                  <Upload className="w-3 h-3" />
                  {lesson.material?.materialFile ? lesson.material.materialFile.name : 'Choose file'}
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.json,.md,.mp4,.mp3,.png,.jpg,.jpeg,.webp" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      onUpdate({ ...lesson, material: { ...lesson.material, materialFile: f, fileName: f.name } });
                    }
                  }} className="hidden" />
                </label>
                {lesson.material?.materialFile && (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <p className="text-green-400 text-[10px]">
                      {lesson.material.materialFile.name} — {(lesson.material.materialFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button type="button" onClick={() => onUpdate({ ...lesson, material: { ...lesson.material, materialFile: null, fileName: '' } })} className="text-red-400 hover:text-red-300 p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Free/Preview toggle */}
          <div className="flex items-center gap-3 pt-1 px-2 py-2 bg-[#0f0f0f] rounded-lg border border-gray-800">
            <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer flex-1">
              <input type="checkbox" checked={lesson.isFree} onChange={(e) => updateField('isFree', e.target.checked)} className="accent-blue-500" />
              Free preview lesson
            </label>
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================
// SUB: Module Item
// ============================================
const ModuleItem = memo(function ModuleItem({ module, moduleIdx, onUpdate, onRemove, totalModules, allPreviewLessons, onPreviewChange, dragHandleProps }) {
  const updateField = (field, value) => {
    onUpdate({ ...module, [field]: value });
  };
  const toggleCollapsed = () => updateField('collapsed', !module.collapsed);
  const thumbnailInputRef = useRef(null);

  const addLesson = () => updateField('lessons', [...module.lessons, createEmptyLesson()]);
  const removeLesson = (idx) => updateField('lessons', module.lessons.filter((_, i) => i !== idx));
  const updateLesson = (idx, lesson) => {
    const copy = [...module.lessons];
    copy[idx] = lesson;
    updateField('lessons', copy);
  };
  const updateObjectives = (objectives) => updateField('objectives', objectives);

  const handleThumbnailChange = (file) => {
    if (file) {
      onUpdate({
        ...module,
        thumbnailFile: file,
        thumbnailPreview: URL.createObjectURL(file),
      });
    }
  };
  const removeThumbnail = () => {
    onUpdate({ ...module, thumbnailFile: null, thumbnailPreview: null });
  };

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
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 module-drag-handle">
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
        {totalModules > 1 && (
          <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10"><Trash2 className="w-5 h-5" /></button>
        )}
      </div>

      {!module.collapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Module Title *</label>
              <input value={module.title} onChange={(e) => updateField('title', e.target.value)} className={inputCls} placeholder="Enter module title" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <input value={module.description} onChange={(e) => updateField('description', e.target.value)} className={inputCls} placeholder="Brief module description" />
            </div>
          </div>

          {/* Module Thumbnail */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Module Thumbnail</label>
            {module.thumbnailPreview ? (
              <div className="relative group">
                <img src={module.thumbnailPreview} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg" />
                <button type="button" onClick={removeThumbnail} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full h-32 flex items-center justify-center gap-2 bg-[#0f0f0f] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-gray-500" />
              </button>
            )}
            <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={(e) => handleThumbnailChange(e.target.files?.[0])} className="hidden" />
          </div>

          <DynamicList items={module.objectives} onChange={updateObjectives} placeholder="Module objective..." label="Learning Objectives" />

          <Separator className="bg-gray-800" />

          {/* Lessons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-200 text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Lessons
              </h4>
              <button type="button" onClick={addLesson} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-md">
                <Plus className="w-3 h-3" /> Add Lesson
              </button>
            </div>

            <DragDropContext onDragEnd={onLessonDragEnd} nonce={module.lessons.length}>
              <StrictModeDroppable droppableId={`lessons-${module._uid}`} type="LESSON" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 p-2 rounded-lg ${snapshot.isDraggingOver ? 'bg-blue-500/5 border border-blue-500/30' : ''}`}
                  >
                    {module.lessons.map((lesson, lessonIdx) => (
                      <Draggable key={lesson._uid} draggableId={lesson._uid} index={lessonIdx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? 'opacity-50 shadow-lg' : ''}`}
                          >
                            <LessonItem
                              lesson={lesson}
                              moduleIdx={moduleIdx}
                              lessonIdx={lessonIdx}
                              onUpdate={(l) => updateLesson(lessonIdx, l)}
                              onRemove={() => removeLesson(lessonIdx)}
                              dragHandleProps={provided.dragHandleProps}
                              allLessons={allPreviewLessons}
                              onTogglePreview={onPreviewChange}
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

            {module.lessons.length === 0 && (
              <div className="text-center py-6 text-gray-600 text-sm border border-dashed border-gray-800 rounded-lg">
                No lessons yet. Click &quot;Add Lesson&quot; to start.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

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
  }, [createFullCourseSuccess]);

  useEffect(() => {
    if (saveDraftSuccess) {
      toast.success('Draft saved successfully!');
      dispatch(resetSaveDraftState());
    }
  }, [saveDraftSuccess]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full h-full max-w-[1400px] max-h-[95vh] mx-auto my-auto bg-[#1a1a1a] rounded-2xl border border-gray-800 flex flex-col shadow-2xl overflow-hidden">
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

// ============================================
// HELPERS
// ============================================
function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-1">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
      <div>
        <span className="text-gray-200 text-sm font-medium">{label}</span>
        {description && <p className="text-gray-500 text-xs mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
