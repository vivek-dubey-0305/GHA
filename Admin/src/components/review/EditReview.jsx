import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateReview,
  deleteReview,
  selectUpdateReviewLoading,
  selectUpdateReviewError,
  selectDeleteReviewLoading,
} from '../../redux/slices/review.slice.js';


export function EditReview({ review, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateReviewLoading = useSelector(selectUpdateReviewLoading);
  const updateReviewError = useSelector(selectUpdateReviewError);
  const deleteReviewLoading = useSelector(selectDeleteReviewLoading);

  const [editedReview, setEditedReview] = useState({
    _id: review?._id,
    userId: review?.userId || '',
    courseId: review?.courseId || '',
    rating: review?.rating || 1,
    comment: review?.comment || '',
    createdAt: review?.createdAt,
    updatedAt: review?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!review) return null;

  const handleChange = (field, value) => {
    setEditedReview(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateReview({
        reviewId: editedReview._id,
        reviewData: {
          rating: editedReview.rating,
          comment: editedReview.comment,
        },
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update review:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteReview(editedReview._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete review:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Review</h2>
          <p className="text-sm text-gray-400 mt-1">Manage review details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateReviewError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateReviewError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Read-only Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Review Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">User ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedReview.userId}</p>
              </div>
              <div>
                <Label className="text-gray-400">Course ID</Label>
                <p className="text-gray-300 mt-1 text-sm font-mono">{editedReview.courseId}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Editable Fields */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Review Content</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rating" className="text-gray-300">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min={1}
                  max={5}
                  value={editedReview.rating}
                  onChange={(e) => handleChange('rating', Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>

              <div>
                <Label htmlFor="comment" className="text-gray-300">Comment</Label>
                <textarea
                  id="comment"
                  value={editedReview.comment}
                  onChange={(e) => handleChange('comment', e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2 mt-2 focus:outline-none focus:border-gray-600 transition-colors min-h-[120px] resize-y"
                  placeholder="Review comment"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedReview.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-gray-300 mt-1">{new Date(editedReview.createdAt).toLocaleString()}</p>
                </div>
                {editedReview.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedReview.updatedAt).toLocaleString()}</p>
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
                  <p className="text-white font-medium">Delete Review</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this review</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteReviewLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteReviewLoading ? 'Deleting...' : 'Delete'}
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
          disabled={updateReviewLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateReviewLoading ? (
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
        title="Delete Review"
        message={`Are you sure you want to delete this review? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
