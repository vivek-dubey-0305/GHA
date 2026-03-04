import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Separator, Textarea, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateCourse,
  deleteCourse,
  selectUpdateCourseLoading,
  selectUpdateCourseError,
  selectDeleteCourseLoading,
} from '../../redux/slices/course.slice.js';

export function EditCourse({ course, onClose, onSave }) {
  const dispatch = useDispatch();
  const updateCourseLoading = useSelector(selectUpdateCourseLoading);
  const updateCourseError = useSelector(selectUpdateCourseError);
  const deleteCourseLoading = useSelector(selectDeleteCourseLoading);

  const [editedCourse, setEditedCourse] = useState(course);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!course || !editedCourse) return null;

  const handleChange = (field, value) => {
    setEditedCourse(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateCourse({
        courseId: editedCourse._id,
        courseData: editedCourse,
      })).unwrap();
      onSave(editedCourse);
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteCourse(editedCourse._id)).unwrap();
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete course:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Course</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the course details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateCourseError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateCourseError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Course Title</Label>
                <Input
                  id="title"
                  value={editedCourse.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="shortDescription" className="text-gray-300">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={editedCourse.shortDescription}
                  onChange={(e) => handleChange('shortDescription', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Full Description</Label>
                <Textarea
                  id="description"
                  value={editedCourse.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-gray-300">Category</Label>
                  <Select value={editedCourse.category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800">
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level" className="text-gray-300">Level</Label>
                  <Select value={editedCourse.level} onValueChange={(value) => handleChange('level', value)}>
                    <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="language" className="text-gray-300">Language</Label>
                <Input
                  id="language"
                  value={editedCourse.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Pricing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Free Course</Label>
                  <p className="text-sm text-gray-500">Make this course free</p>
                </div>
                <Switch
                  checked={editedCourse.isFree}
                  onCheckedChange={(checked) => handleChange('isFree', checked)}
                />
              </div>

              {!editedCourse.isFree && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-gray-300">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        value={editedCourse.price}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                        className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountPrice" className="text-gray-300">Discount Price</Label>
                      <Input
                        id="discountPrice"
                        type="number"
                        value={editedCourse.discountPrice || ''}
                        onChange={(e) => handleChange('discountPrice', parseFloat(e.target.value))}
                        className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-gray-300">Currency</Label>
                    <Input
                      id="currency"
                      value={editedCourse.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Course Structure */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Course Structure</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalModules" className="text-gray-300">Modules</Label>
                  <Input
                    id="totalModules"
                    type="number"
                    value={editedCourse.totalModules}
                    onChange={(e) => handleChange('totalModules', parseInt(e.target.value))}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="totalLessons" className="text-gray-300">Lessons</Label>
                  <Input
                    id="totalLessons"
                    type="number"
                    value={editedCourse.totalLessons}
                    onChange={(e) => handleChange('totalLessons', parseInt(e.target.value))}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="totalDuration" className="text-gray-300">Duration (min)</Label>
                  <Input
                    id="totalDuration"
                    type="number"
                    value={editedCourse.totalDuration}
                    onChange={(e) => handleChange('totalDuration', parseInt(e.target.value))}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-300">Course Status</Label>
                <Select value={editedCourse.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Published</Label>
                  <p className="text-sm text-gray-500">Make course visible to students</p>
                </div>
                <Switch
                  checked={editedCourse.isPublished}
                  onCheckedChange={(checked) => handleChange('isPublished', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Certificate Enabled</Label>
                  <p className="text-sm text-gray-500">Issue certificates upon completion</p>
                </div>
                <Switch
                  checked={editedCourse.certificateEnabled}
                  onCheckedChange={(checked) => handleChange('certificateEnabled', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400">Enrolled Students</p>
                <p className="text-2xl font-bold text-white mt-2">{editedCourse.enrolledCount ?? 0}</p>
              </div>
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400">Rating</p>
                <p className="text-2xl font-bold text-white mt-2">{editedCourse.rating ?? 0} ⭐</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Course</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this course and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteCourseLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteCourseLoading ? 'Deleting...' : 'Delete'}
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
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateCourseLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateCourseLoading ? (
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
        title="Delete Course"
        message={`Are you sure you want to delete "${editedCourse.title}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
