import React, { useState, useRef, memo } from 'react';
import {
  X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Image as ImageIcon,
  Video, FileText, BookOpen, Radio, File, Upload, CheckCircle, Eye
} from 'lucide-react';
import { Badge, useToast } from '../../ui/index.js';
import { LESSON_TYPES, MATERIAL_TYPES, SUBMISSION_TYPES } from '../../../constants/course/index.js';
import { formatDuration, uid, isValidVideoFile, isValidImageFile } from '../../../utils/course.utils.js';
import { inputCls, selectCls, textareaCls } from '../../ui/InputStyles.js';

/**
 * LessonItem Component - Displays and manages individual lesson details
 * Supports multiple lesson types: video, article, assignment, live, material
 */
export const LessonItem = memo(function LessonItem({
  lesson,
  lessonIdx,
  onUpdate,
  onRemove,
  dragHandleProps,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const thumbnailInputRef = useRef(null);
  const toast = useToast();

  const updateField = (field, value) => onUpdate({ ...lesson, [field]: value });
  const updateContent = (field, value) => onUpdate({ ...lesson, content: { ...lesson.content, [field]: value } });
  const updateVideoPackage = (field, value) => onUpdate({ ...lesson, videoPackage: { ...lesson.videoPackage, [field]: value } });
  const updateAssignment = (field, value) => onUpdate({ ...lesson, assignment: { ...lesson.assignment, [field]: value } });
  const updateLiveClass = (field, value) => onUpdate({ ...lesson, liveClass: { ...lesson.liveClass, [field]: value } });
  const updateMaterial = (field, value) => onUpdate({ ...lesson, material: { ...lesson.material, [field]: value } });

  const handleThumbnailChange = (file) => {
    if (file) {
      if (!isValidImageFile(file)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      onUpdate({ ...lesson, thumbnailFile: file, thumbnailPreview: URL.createObjectURL(file) });
    }
  };

  const removeThumbnail = () => onUpdate({ ...lesson, thumbnailFile: null, thumbnailPreview: null });

  // Video management
  const addVideo = () => {
    const videos = [...(lesson.videoPackage?.videos || []), {
      _uid: uid(),
      title: '',
      description: '',
      duration: 0,
      videoFile: null,
      thumbnailFile: null,
    }];
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
      if (!isValidVideoFile(file)) {
        toast.error('Unsupported video format. Please use MP4, WebM, or other common video formats.');
        return;
      }
      updateVideo(vi, 'videoFile', file);
      toast.success(`Video file selected: ${file.name}`);
    }
  };

  const lessonTypeIcon = LESSON_TYPES.find(t => t.value === lesson.type)?.icon || FileText;
  const LTypeIcon = lessonTypeIcon;
  const totalVideoDuration = (lesson.videoPackage?.videos || []).reduce((s, v) => s + (parseInt(v.duration) || 0), 0);

  return (
    <div className="bg-[#111] border border-gray-800 rounded-lg overflow-hidden">
      {/* Lesson Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#161616]">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300">
          <GripVertical className="w-4 h-4" />
        </div>
        <LTypeIcon className="w-4 h-4 text-gray-400" />
        <span className="text-gray-200 text-sm font-medium flex-1 truncate">
          {lesson.title || `Lesson ${lessonIdx + 1}`}
        </span>
        <Badge className="text-[10px] bg-gray-700 text-gray-300 capitalize">{lesson.type}</Badge>
        {lesson.isFree && <Eye className="w-3.5 h-3.5 text-blue-400" title="Preview" />}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-200 p-1"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Lesson Content */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Basic Lesson Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Lesson Title *</label>
              <input
                value={lesson.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={inputCls}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Type</label>
              <select
                value={lesson.type}
                onChange={(e) => updateField('type', e.target.value)}
                className={selectCls}
              >
                {LESSON_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Description</label>
            <textarea
              value={lesson.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={textareaCls}
              rows={2}
              placeholder="Lesson description..."
            />
          </div>

          {/* VIDEO TYPE */}
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
                  <input
                    value={lesson.videoPackage?.packageName || ''}
                    onChange={(e) => updateVideoPackage('packageName', e.target.value)}
                    className={inputCls}
                    placeholder="e.g., Introduction Videos"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Category</label>
                  <select
                    value={lesson.videoPackage?.category || 'tutorial'}
                    onChange={(e) => updateVideoPackage('category', e.target.value)}
                    className={selectCls}
                  >
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
                <textarea
                  value={lesson.videoPackage?.description || ''}
                  onChange={(e) => updateVideoPackage('description', e.target.value)}
                  className={textareaCls}
                  rows={2}
                  placeholder="Video package description..."
                />
              </div>

              {/* Videos List */}
              <div className="space-y-2">
                {(lesson.videoPackage?.videos || []).map((video, vi) => (
                  <div key={video._uid || vi} className="p-3 bg-[#111] border border-gray-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[10px] font-medium">Video {vi + 1}</span>
                      {(lesson.videoPackage?.videos || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVideo(vi)}
                          className="text-red-400 hover:text-red-300 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-500 text-[10px] mb-0.5 block">Title</label>
                        <input
                          value={video.title}
                          onChange={(e) => updateVideo(vi, 'title', e.target.value)}
                          className={inputCls}
                          placeholder="Video title"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-[10px] mb-0.5 block">Duration (seconds) *</label>
                        <input
                          type="number"
                          value={video.duration}
                          onChange={(e) => updateVideo(vi, 'duration', e.target.value)}
                          className={inputCls}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-500 text-[10px] mb-0.5 block">Description</label>
                      <textarea
                        value={video.description}
                        onChange={(e) => updateVideo(vi, 'description', e.target.value)}
                        className={textareaCls}
                        rows={1}
                        placeholder="Video description"
                      />
                    </div>

                    <div>
                      <label className="text-gray-500 text-[10px] mb-0.5 block">Video File</label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors">
                          <Upload className="w-3 h-3" />
                          {video.videoFile ? video.videoFile.name : 'Choose file'}
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoFileChange(vi, e.target.files?.[0])}
                            className="hidden"
                          />
                        </label>
                        {video.videoFile && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVideo}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-md w-full justify-center"
                >
                  <Plus className="w-3 h-3" /> Add Video
                </button>
              </div>

              {/* Lesson Thumbnail */}
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Lesson Thumbnail</label>
                {lesson.thumbnailPreview ? (
                  <div className="relative group">
                    <img src={lesson.thumbnailPreview} alt="Thumbnail" className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-full h-24 flex items-center justify-center gap-2 bg-[#0f0f0f] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                  </button>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleThumbnailChange(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* ARTICLE TYPE */}
          {lesson.type === 'article' && (
            <div className="p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <label className="text-gray-400 text-xs mb-1 block">Article Content</label>
              <textarea
                value={lesson.content?.articleContent || ''}
                onChange={(e) => updateContent('articleContent', e.target.value)}
                className={textareaCls}
                rows={6}
                placeholder="Write article content here (Markdown supported)..."
              />
            </div>
          )}

          {/* ASSIGNMENT TYPE */}
          {lesson.type === 'assignment' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" /> Assignment Details
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Assignment Title *</label>
                  <input
                    value={lesson.assignment?.title || ''}
                    onChange={(e) => updateAssignment('title', e.target.value)}
                    className={inputCls}
                    placeholder="Assignment title"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Submission Type</label>
                  <select
                    value={lesson.assignment?.type || 'text'}
                    onChange={(e) => updateAssignment('type', e.target.value)}
                    className={selectCls}
                  >
                    {SUBMISSION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description * (min 10 chars)</label>
                <textarea
                  value={lesson.assignment?.description || ''}
                  onChange={(e) => updateAssignment('description', e.target.value)}
                  className={textareaCls}
                  rows={2}
                  placeholder="Assignment description (required, min 10 characters)..."
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Instructions</label>
                <textarea
                  value={lesson.assignment?.instructions || ''}
                  onChange={(e) => updateAssignment('instructions', e.target.value)}
                  className={textareaCls}
                  rows={3}
                  placeholder="Detailed instructions for students..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Max Score * (1–100)</label>
                  <input
                    type="number"
                    value={lesson.assignment?.maxScore ?? 100}
                    onChange={(e) => updateAssignment('maxScore', e.target.value)}
                    className={inputCls}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Passing Score</label>
                  <input
                    type="number"
                    value={lesson.assignment?.passingScore ?? 40}
                    onChange={(e) => updateAssignment('passingScore', e.target.value)}
                    className={inputCls}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Due Date *</label>
                  <input
                    type="datetime-local"
                    value={lesson.assignment?.dueDate || ''}
                    onChange={(e) => updateAssignment('dueDate', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lesson.assignment?.allowLateSubmission || false}
                      onChange={(e) => updateAssignment('allowLateSubmission', e.target.checked)}
                      className="accent-blue-500"
                    />
                    Allow Late Submission
                  </label>
                </div>
                {lesson.assignment?.allowLateSubmission && (
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Late Penalty (%)</label>
                    <input
                      type="number"
                      value={lesson.assignment?.lateSubmissionPenalty || 0}
                      onChange={(e) => updateAssignment('lateSubmissionPenalty', e.target.value)}
                      className={inputCls}
                      min="0"
                      max="100"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIVE TYPE */}
          {lesson.type === 'live' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400" /> Live Session Details
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Session Title *</label>
                  <input
                    value={lesson.liveClass?.title || ''}
                    onChange={(e) => updateLiveClass('title', e.target.value)}
                    className={inputCls}
                    placeholder="Live session title"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Scheduled At *</label>
                  <input
                    type="datetime-local"
                    value={lesson.liveClass?.scheduledAt || ''}
                    onChange={(e) => updateLiveClass('scheduledAt', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Zoom Join URL *</label>
                  <input
                    value={lesson.liveClass?.zoomJoinUrl || ''}
                    onChange={(e) => updateLiveClass('zoomJoinUrl', e.target.value)}
                    className={inputCls}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Zoom Meeting ID *</label>
                  <input
                    value={lesson.liveClass?.zoomMeetingId || ''}
                    onChange={(e) => updateLiveClass('zoomMeetingId', e.target.value)}
                    className={inputCls}
                    placeholder="e.g., 123-456-789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Zoom Password</label>
                  <input
                    value={lesson.liveClass?.zoomPassword || ''}
                    onChange={(e) => updateLiveClass('zoomPassword', e.target.value)}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={lesson.liveClass?.duration || 60}
                    onChange={(e) => updateLiveClass('duration', e.target.value)}
                    className={inputCls}
                    min="15"
                    max="480"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Timezone</label>
                  <input
                    value={lesson.liveClass?.timezone || 'UTC'}
                    onChange={(e) => updateLiveClass('timezone', e.target.value)}
                    className={inputCls}
                    placeholder="UTC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Max Participants</label>
                  <input
                    type="number"
                    value={lesson.liveClass?.maxParticipants || 100}
                    onChange={(e) => updateLiveClass('maxParticipants', e.target.value)}
                    className={inputCls}
                    min="1"
                    max="10000"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea
                  value={lesson.liveClass?.description || ''}
                  onChange={(e) => updateLiveClass('description', e.target.value)}
                  className={textareaCls}
                  rows={2}
                  placeholder="Session description..."
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Notes</label>
                <textarea
                  value={lesson.liveClass?.notes || ''}
                  onChange={(e) => updateLiveClass('notes', e.target.value)}
                  className={textareaCls}
                  rows={2}
                  placeholder="Additional notes for students..."
                />
              </div>
            </div>
          )}

          {/* MATERIAL TYPE */}
          {lesson.type === 'material' && (
            <div className="space-y-3 p-3 bg-[#0d0d0d] rounded-lg border border-gray-800">
              <h5 className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                <File className="w-3.5 h-3.5 text-green-400" /> Material Details
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Material Title *</label>
                  <input
                    value={lesson.material?.title || ''}
                    onChange={(e) => updateMaterial('title', e.target.value)}
                    className={inputCls}
                    placeholder="Material title"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Material Type *</label>
                  <select
                    value={lesson.material?.type || 'pdf'}
                    onChange={(e) => updateMaterial('type', e.target.value)}
                    className={selectCls}
                  >
                    {MATERIAL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea
                  value={lesson.material?.description || ''}
                  onChange={(e) => updateMaterial('description', e.target.value)}
                  className={textareaCls}
                  rows={2}
                  placeholder="Material description..."
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Upload File *</label>
                <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors w-fit">
                  <Upload className="w-3 h-3" />
                  {lesson.material?.materialFile ? lesson.material.materialFile.name : 'Choose file'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.json,.md,.mp4,.mp3,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        onUpdate({
                          ...lesson,
                          material: { ...lesson.material, materialFile: f, fileName: f.name },
                        });
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {lesson.material?.materialFile && (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <p className="text-green-400 text-[10px]">
                      {lesson.material.materialFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({ ...lesson, material: { ...lesson.material, materialFile: null, fileName: '' } })
                      }
                      className="text-red-400 hover:text-red-300 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Free/Preview toggle */}
          <div className="flex items-center gap-3 pt-1 px-2 py-2 bg-[#0f0f0f] rounded-lg border border-gray-800">
            <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={lesson.isFree}
                onChange={(e) => updateField('isFree', e.target.checked)}
                className="accent-blue-500"
              />
              Free preview lesson
            </label>
          </div>
        </div>
      )}
    </div>
  );
});

LessonItem.displayName = 'LessonItem';
