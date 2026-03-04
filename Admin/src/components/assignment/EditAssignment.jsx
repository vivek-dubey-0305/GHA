import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Textarea, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateAssignment,
  deleteAssignment,
  selectUpdateAssignmentLoading,
  selectUpdateAssignmentError,
  selectDeleteAssignmentLoading,
} from '../../redux/slices/assignment.slice.js';


export function EditAssignment({ assignment, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateAssignmentLoading = useSelector(selectUpdateAssignmentLoading);
  const updateAssignmentError = useSelector(selectUpdateAssignmentError);
  const deleteAssignmentLoading = useSelector(selectDeleteAssignmentLoading);

  const [editedAssignment, setEditedAssignment] = useState({
    _id: assignment?._id,
    title: assignment?.title || '',
    description: assignment?.description || '',
    courseId: assignment?.courseId || '',
    instructorId: assignment?.instructorId || '',
    dueDate: assignment?.dueDate ? assignment.dueDate.slice(0, 10) : '',
    maxScore: assignment?.maxScore || 0,
    instructions: assignment?.instructions || '',
    createdAt: assignment?.createdAt,
    updatedAt: assignment?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!assignment) return null;

  const handleChange = (field, value) => {
    setEditedAssignment(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateAssignment({
        assignmentId: editedAssignment._id,
        assignmentData: editedAssignment,
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteAssignment(editedAssignment._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Assignment</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the assignment details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateAssignmentError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateAssignmentError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Assignment Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Assignment Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={editedAssignment.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={editedAssignment.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID</Label>
                <Input
                  id="courseId"
                  value={editedAssignment.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the course"
                />
              </div>

              <div>
                <Label htmlFor="instructorId" className="text-gray-300">Instructor ID</Label>
                <Input
                  id="instructorId"
                  value={editedAssignment.instructorId}
                  onChange={(e) => handleChange('instructorId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the instructor"
                />
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-gray-300">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={editedAssignment.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="maxScore" className="text-gray-300">Max Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  value={editedAssignment.maxScore}
                  onChange={(e) => handleChange('maxScore', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="instructions" className="text-gray-300">Assignment Instructions</Label>
                <Textarea
                  id="instructions"
                  value={editedAssignment.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Detailed instructions for students..."
                  rows={5}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedAssignment.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-gray-300 mt-1">{new Date(editedAssignment.createdAt).toLocaleString()}</p>
                </div>
                {editedAssignment.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedAssignment.updatedAt).toLocaleString()}</p>
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
                  <p className="text-white font-medium">Delete Assignment</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this assignment and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteAssignmentLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteAssignmentLoading ? 'Deleting...' : 'Delete'}
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
          disabled={updateAssignmentLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateAssignmentLoading ? (
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
        title="Delete Assignment"
        message={`Are you sure you want to delete "${editedAssignment.title}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
