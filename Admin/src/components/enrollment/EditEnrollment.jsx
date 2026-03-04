import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateEnrollment,
  deleteEnrollment,
  selectUpdateEnrollmentLoading,
  selectUpdateEnrollmentError,
  selectDeleteEnrollmentLoading,
} from '../../redux/slices/enrollment.slice.js';


export function EditEnrollment({ enrollment, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateEnrollmentLoading = useSelector(selectUpdateEnrollmentLoading);
  const updateEnrollmentError = useSelector(selectUpdateEnrollmentError);
  const deleteEnrollmentLoading = useSelector(selectDeleteEnrollmentLoading);

  const [editedEnrollment, setEditedEnrollment] = useState({
    _id: enrollment?._id,
    userId: enrollment?.userId || '',
    courseId: enrollment?.courseId || '',
    status: enrollment?.status || 'active',
    completedAt: enrollment?.completedAt
      ? new Date(enrollment.completedAt).toISOString().split('T')[0]
      : '',
    enrolledAt: enrollment?.enrolledAt,
    createdAt: enrollment?.createdAt,
    updatedAt: enrollment?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!enrollment) return null;

  const handleChange = (field, value) => {
    setEditedEnrollment(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      const enrollmentData = {
        status: editedEnrollment.status,
        completedAt: editedEnrollment.completedAt || null,
      };
      await dispatch(updateEnrollment({
        enrollmentId: editedEnrollment._id,
        enrollmentData,
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update enrollment:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteEnrollment(editedEnrollment._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete enrollment:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Enrollment</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the enrollment details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateEnrollmentError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateEnrollmentError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Enrollment Information (read-only) */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Enrollment Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">User ID</Label>
                <p className="text-xs font-mono text-gray-500 mt-1">{editedEnrollment.userId}</p>
              </div>

              <div>
                <Label className="text-gray-300">Course ID</Label>
                <p className="text-xs font-mono text-gray-500 mt-1">{editedEnrollment.courseId}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Editable Fields */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Status & Completion</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-300">Status</Label>
                <select
                  id="status"
                  value={editedEnrollment.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-black mt-2 rounded-md px-3 py-2 focus:outline-none focus:border-gray-600 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <Label htmlFor="completedAt" className="text-gray-300">Completed At</Label>
                <Input
                  id="completedAt"
                  type="date"
                  value={editedEnrollment.completedAt}
                  onChange={(e) => handleChange('completedAt', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedEnrollment.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Enrolled At</Label>
                  <p className="text-gray-300 mt-1">
                    {editedEnrollment.enrolledAt
                      ? new Date(editedEnrollment.enrolledAt).toLocaleString()
                      : editedEnrollment.createdAt
                        ? new Date(editedEnrollment.createdAt).toLocaleString()
                        : '—'}
                  </p>
                </div>
                {editedEnrollment.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedEnrollment.updatedAt).toLocaleString()}</p>
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
                  <p className="text-white font-medium">Delete Enrollment</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this enrollment and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteEnrollmentLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteEnrollmentLoading ? 'Deleting...' : 'Delete'}
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
          disabled={updateEnrollmentLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateEnrollmentLoading ? (
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
        title="Delete Enrollment"
        message={`Are you sure you want to delete this enrollment? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
