import { X, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Switch, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateModule,
  deleteModule,
  selectUpdateModuleLoading,
  selectUpdateModuleError,
  selectDeleteModuleLoading,
} from '../../redux/slices/module.slice.js';


export function EditModule({ module, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateModuleLoading = useSelector(selectUpdateModuleLoading);
  const updateModuleError = useSelector(selectUpdateModuleError);
  const deleteModuleLoading = useSelector(selectDeleteModuleLoading);

  const [editedModule, setEditedModule] = useState({
    _id: module?._id,
    title: module?.title || '',
    description: module?.description || '',
    courseId: module?.courseId || '',
    order: module?.order || 0,
    isPublished: module?.isPublished !== undefined ? module.isPublished : false,
    createdAt: module?.createdAt,
    updatedAt: module?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!module) return null;

  const handleChange = (field, value) => {
    setEditedModule(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateModule({
        moduleId: editedModule._id,
        moduleData: editedModule,
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update module:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteModule(editedModule._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete module:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Module</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the module details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateModuleError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateModuleError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Module Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Module Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={editedModule.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Input
                  id="description"
                  value={editedModule.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID</Label>
                <Input
                  id="courseId"
                  value={editedModule.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the course"
                />
              </div>

              <div>
                <Label htmlFor="order" className="text-gray-300">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={editedModule.order}
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
                  <p className="text-sm text-gray-500">Make this module visible to students</p>
                </div>
                <Switch
                  checked={editedModule.isPublished}
                  onCheckedChange={(checked) => handleChange('isPublished', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedModule.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-gray-300 mt-1">{new Date(editedModule.createdAt).toLocaleString()}</p>
                </div>
                {editedModule.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedModule.updatedAt).toLocaleString()}</p>
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
                  <p className="text-black font-medium">Delete Module</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this module and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteModuleLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteModuleLoading ? 'Deleting...' : 'Delete'}
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
          disabled={updateModuleLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateModuleLoading ? (
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
        title="Delete Module"
        message={`Are you sure you want to delete "${editedModule.title}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
