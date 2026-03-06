import React, { useRef, memo, useCallback } from 'react';
import {
  X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Image as ImageIcon,
  FileText, Layers
} from 'lucide-react';
import { Separator } from '../../ui/index.js';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { StrictModeDroppable } from '../../ui/StrictModeDroppable.jsx';
import { DynamicList } from '../../ui/DynamicList.jsx';
import { LessonItem } from './LessonItem.jsx';
import { formatDuration, createEmptyLesson, calculateModuleDuration, isValidImageFile } from '../../../utils/course.utils.js';
import { inputCls } from '../../ui/InputStyles.js';
import { useToast } from '../../ui/index.js';

/**
 * ModuleItem Component - Displays and manages individual module details
 * Includes lessons management with drag-drop support
 */
export const ModuleItem = memo(function ModuleItem({
  module,
  moduleIdx,
  onUpdate,
  onRemove,
  totalModules,
  allPreviewLessons,
  onPreviewChange,
  dragHandleProps,
}) {
  const thumbnailInputRef = useRef(null);
  const toast = useToast();

  const updateField = useCallback((field, value) => {
    onUpdate({ ...module, [field]: value });
  }, [module, onUpdate]);

  const toggleCollapsed = useCallback(() => updateField('collapsed', !module.collapsed), [module.collapsed, updateField]);

  const addLesson = useCallback(() => updateField('lessons', [...module.lessons, createEmptyLesson()]), [module.lessons, updateField]);
  
  const removeLesson = useCallback((idx) => updateField('lessons', module.lessons.filter((_, i) => i !== idx)), [module.lessons, updateField]);
  
  const updateLesson = useCallback((idx, lesson) => {
    const copy = [...module.lessons];
    copy[idx] = lesson;
    updateField('lessons', copy);
  }, [module.lessons, updateField]);

  const updateObjectives = useCallback((objectives) => updateField('objectives', objectives), [updateField]);

  const handleThumbnailChange = useCallback((file) => {
    if (file) {
      if (!isValidImageFile(file)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      onUpdate({
        ...module,
        thumbnailFile: file,
        thumbnailPreview: URL.createObjectURL(file),
      });
    }
  }, [module, onUpdate, toast]);

  const removeThumbnail = useCallback(() => {
    onUpdate({ ...module, thumbnailFile: null, thumbnailPreview: null });
  }, [module, onUpdate]);

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
      {/* Module Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#181818] border-b border-gray-800">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300">
          <GripVertical className="w-5 h-5" />
        </div>
        <Layers className="w-5 h-5 text-blue-400" />
        <div className="flex-1 min-w-0">
          <span className="text-white font-semibold text-sm truncate block">
            {module.title || `Module ${moduleIdx + 1}`}
          </span>
          <span className="text-gray-500 text-xs">
            {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''} • {formatDuration(moduleDuration)}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="text-gray-400 hover:text-gray-200 p-1.5 rounded-md hover:bg-gray-700/50"
        >
          {module.collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
        {totalModules > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Module Content */}
      {!module.collapsed && (
        <div className="p-4 space-y-4">
          {/* Module Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Module Title *</label>
              <input
                value={module.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={inputCls}
                placeholder="Enter module title"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <input
                value={module.description}
                onChange={(e) => updateField('description', e.target.value)}
                className={inputCls}
                placeholder="Brief module description"
              />
            </div>
          </div>

          {/* Module Thumbnail */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Module Thumbnail</label>
            {module.thumbnailPreview ? (
              <div className="relative group">
                <img src={module.thumbnailPreview} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg" />
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
                className="w-full h-32 flex items-center justify-center gap-2 bg-[#0f0f0f] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"
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

          {/* Learning Objectives */}
          <DynamicList
            items={module.objectives}
            onChange={updateObjectives}
            placeholder="Module objective..."
            label="Learning Objectives"
          />

          <Separator className="bg-gray-800" />

          {/* Lessons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-200 text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Lessons
              </h4>
              <button
                type="button"
                onClick={addLesson}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-md"
              >
                <Plus className="w-3 h-3" /> Add Lesson
              </button>
            </div>

            {/* Lessons Drag Drop Container */}
            <DragDropContext onDragEnd={onLessonDragEnd} nonce={module.lessons.length}>
              <StrictModeDroppable droppableId={`lessons-${module._uid}`} type="LESSON">
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

ModuleItem.displayName = 'ModuleItem';
