import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Separator, Textarea, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateLesson,
  deleteLesson,
  selectUpdateLessonLoading,
  selectUpdateLessonError,
  selectDeleteLessonLoading,
} from '../../redux/slices/lesson.slice.js';


export function EditLesson({ lesson, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateLessonLoading = useSelector(selectUpdateLessonLoading);
  const updateLessonError = useSelector(selectUpdateLessonError);
  const deleteLessonLoading = useSelector(selectDeleteLessonLoading);

  const [editedLesson, setEditedLesson] = useState({
    _id: lesson?._id,
    title: lesson?.title || '',
    courseId: lesson?.courseId || '',
    moduleId: lesson?.moduleId || '',
    type: lesson?.type || 'video',
    content: lesson?.content || '',
    videoUrl: lesson?.videoUrl || '',
    duration: lesson?.duration || 0,
    order: lesson?.order || 0,
    isPublished: lesson?.isPublished !== undefined ? lesson.isPublished : false,
    createdAt: lesson?.createdAt,
    updatedAt: lesson?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!lesson) return null;

  const handleChange = (field, value) => {
    setEditedLesson(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateLesson({
        lessonId: editedLesson._id,
        lessonData: editedLesson,
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update lesson:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteLesson(editedLesson._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Lesson</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the lesson details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateLessonError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateLessonError}</p>
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
                <Label htmlFor="title" className="text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={editedLesson.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID</Label>
                <Input
                  id="courseId"
                  value={editedLesson.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the course"
                />
              </div>

              <div>
                <Label htmlFor="moduleId" className="text-gray-300">Module ID</Label>
                <Input
                  id="moduleId"
                  value={editedLesson.moduleId}
                  onChange={(e) => handleChange('moduleId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the module"
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-gray-300">Type</Label>
                <Select value={editedLesson.type} onValueChange={(value) => handleChange('type', value)}>
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
                  value={editedLesson.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2 min-h-[100px]"
                  placeholder="Lesson content..."
                />
              </div>

              <div>
                <Label htmlFor="videoUrl" className="text-gray-300">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={editedLesson.videoUrl}
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
                  value={editedLesson.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="order" className="text-gray-300">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={editedLesson.order}
                  onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
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
                  checked={editedLesson.isPublished}
                  onCheckedChange={(checked) => handleChange('isPublished', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedLesson.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-gray-300 mt-1">{new Date(editedLesson.createdAt).toLocaleString()}</p>
                </div>
                {editedLesson.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedLesson.updatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="bg-gray-800" />

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Delete Lesson</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this lesson and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteLessonLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteLessonLoading ? 'Deleting...' : 'Delete'}
                </Button>
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
          onClick={handleSave}
          disabled={updateLessonLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateLessonLoading ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Delete Warning Modal */}
      <WarningModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${editedLesson.title}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
