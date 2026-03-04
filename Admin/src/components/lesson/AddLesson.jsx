import { X, Plus } from 'lucide-react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Separator, Textarea } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createLesson,
  selectCreateLessonLoading,
  selectCreateLessonError,
} from '../../redux/slices/lesson.slice.js';


export function AddLesson({ onClose, onAdd }) {
  const dispatch = useDispatch();
  const createLessonLoading = useSelector(selectCreateLessonLoading);
  const createLessonError = useSelector(selectCreateLessonError);

  const [newLesson, setNewLesson] = useState({
    title: '',
    courseId: '',
    moduleId: '',
    type: 'video',
    content: '',
    videoUrl: '',
    duration: 0,
    order: 0,
    isPublished: false,
  });

  const handleChange = (field, value) => {
    setNewLesson(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createLesson(newLesson)).unwrap();
      onAdd();
    } catch (error) {
      console.error('Failed to create lesson:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Add Lesson</h2>
          <p className="text-sm text-gray-400 mt-1">Create a new lesson</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {createLessonError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{createLessonError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Lesson Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Lesson Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={newLesson.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Lesson title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID *</Label>
                <Input
                  id="courseId"
                  value={newLesson.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the course"
                  required
                />
              </div>

              <div>
                <Label htmlFor="moduleId" className="text-gray-300">Module ID *</Label>
                <Input
                  id="moduleId"
                  value={newLesson.moduleId}
                  onChange={(e) => handleChange('moduleId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the module"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-gray-300">Type *</Label>
                <Select value={newLesson.type} onValueChange={(value) => handleChange('type', value)} id="lesson-type">
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content" className="text-gray-300">Content</Label>
                <Textarea
                  id="content"
                  value={newLesson.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2 min-h-[100px]"
                  placeholder="Lesson content..."
                />
              </div>

              <div>
                <Label htmlFor="videoUrl" className="text-gray-300">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={newLesson.videoUrl}
                  onChange={(e) => handleChange('videoUrl', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="duration" className="text-gray-300">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newLesson.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="order" className="text-gray-300">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={newLesson.order}
                  onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Publishing */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Publishing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Published</Label>
                  <p className="text-sm text-gray-500">Make this lesson visible to students</p>
                </div>
                <Switch
                  checked={newLesson.isPublished}
                  onCheckedChange={(checked) => handleChange('isPublished', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-gray-400 hover:text-black hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createLessonLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {createLessonLoading ? (
            'Creating...'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
