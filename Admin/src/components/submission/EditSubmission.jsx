import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateSubmission,
  deleteSubmission,
  selectUpdateSubmissionLoading,
  selectUpdateSubmissionError,
  selectDeleteSubmissionLoading,
} from '../../redux/slices/submission.slice.js';


export function EditSubmission({ submission, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateSubmissionLoading = useSelector(selectUpdateSubmissionLoading);
  const updateSubmissionError = useSelector(selectUpdateSubmissionError);
  const deleteSubmissionLoading = useSelector(selectDeleteSubmissionLoading);

  const [editedSubmission, setEditedSubmission] = useState({
    _id: submission?._id,
    assignmentId: submission?.assignmentId || '',
    userId: submission?.userId || '',
    status: submission?.status || 'pending',
    score: submission?.score ?? '',
    feedback: submission?.feedback || '',
    submittedAt: submission?.submittedAt,
    createdAt: submission?.createdAt,
    updatedAt: submission?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!submission) return null;

  const handleChange = (field, value) => {
    setEditedSubmission(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateSubmission({
        submissionId: editedSubmission._id,
        submissionData: {
          status: editedSubmission.status,
          score: editedSubmission.score !== '' ? Number(editedSubmission.score) : undefined,
          feedback: editedSubmission.feedback,
        },
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update submission:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteSubmission(editedSubmission._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete submission:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Submission</h2>
          <p className="text-sm text-gray-400 mt-1">Grade and manage submission details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateSubmissionError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateSubmissionError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Read-only Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Submission Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Submission ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedSubmission._id}</p>
              </div>
              <div>
                <Label className="text-gray-400">Assignment ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedSubmission.assignmentId}</p>
              </div>
              <div>
                <Label className="text-gray-400">User ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedSubmission.userId}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Editable Fields */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Grading</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-300">Status</Label>
                <select
                  id="status"
                  value={editedSubmission.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-black rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-gray-600 transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                </select>
              </div>

              <div>
                <Label htmlFor="score" className="text-gray-300">Score</Label>
                <Input
                  id="score"
                  type="number"
                  value={editedSubmission.score}
                  onChange={(e) => handleChange('score', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Enter score"
                />
              </div>

              <div>
                <Label htmlFor="feedback" className="text-gray-300">Feedback</Label>
                <textarea
                  id="feedback"
                  value={editedSubmission.feedback}
                  onChange={(e) => handleChange('feedback', e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-black rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-gray-600 transition-colors min-h-[120px] resize-y"
                  placeholder="Provide feedback for the submission"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {(editedSubmission.submittedAt || editedSubmission.createdAt) && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {editedSubmission.submittedAt && (
                  <div>
                    <Label className="text-gray-400">Submitted At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedSubmission.submittedAt).toLocaleString()}</p>
                  </div>
                )}
                {editedSubmission.createdAt && (
                  <div>
                    <Label className="text-gray-400">Created At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedSubmission.createdAt).toLocaleString()}</p>
                  </div>
                )}
                {editedSubmission.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedSubmission.updatedAt).toLocaleString()}</p>
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
                  <p className="text-black font-medium">Delete Submission</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this submission and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteSubmissionLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteSubmissionLoading ? 'Deleting...' : 'Delete'}
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
          disabled={updateSubmissionLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateSubmissionLoading ? (
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
        title="Delete Submission"
        message={`Are you sure you want to delete this submission? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
