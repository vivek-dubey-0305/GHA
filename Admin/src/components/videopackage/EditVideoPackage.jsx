import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateVideoPackage,
  deleteVideoPackage,
  selectUpdateVideoPackageLoading,
  selectUpdateVideoPackageError,
  selectDeleteVideoPackageLoading,
} from '../../redux/slices/videopackage.slice.js';


export function EditVideoPackage({ videoPackage, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateLoading = useSelector(selectUpdateVideoPackageLoading);
  const updateError = useSelector(selectUpdateVideoPackageError);
  const deleteLoading = useSelector(selectDeleteVideoPackageLoading);

  const [edited, setEdited] = useState({
    _id: videoPackage?._id,
    title: videoPackage?.title || '',
    description: videoPackage?.description || '',
    status: videoPackage?.status || 'draft',
    createdAt: videoPackage?.createdAt,
    updatedAt: videoPackage?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!videoPackage) return null;

  const handleChange = (field, value) => {
    setEdited(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateVideoPackage({
        videoPackageId: edited._id,
        videoPackageData: edited,
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update video package:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteVideoPackage(edited._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete video package:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Video Package</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the video package details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Video Package Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Video Package Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={edited.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <textarea
                  id="description"
                  value={edited.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-black rounded-md px-3 py-2 mt-2 focus:outline-none focus:border-gray-600 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-gray-300">Status</Label>
                <select
                  id="status"
                  value={edited.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-black rounded-md px-3 py-2 mt-2 focus:outline-none focus:border-gray-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {edited.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-gray-300 mt-1">{new Date(edited.createdAt).toLocaleString()}</p>
                </div>
                {edited.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(edited.updatedAt).toLocaleString()}</p>
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
                  <p className="text-black font-medium">Delete Video Package</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this video package and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteLoading ? 'Deleting...' : 'Delete'}
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
          disabled={updateLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateLoading ? (
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
        title="Delete Video Package"
        message={`Are you sure you want to delete "${edited.title}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
