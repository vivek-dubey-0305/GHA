import { X, Plus } from 'lucide-react';
import { Button, Input, Label, Switch, Separator } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createModule,
  selectCreateModuleLoading,
  selectCreateModuleError,
} from '../../redux/slices/module.slice.js';


export function AddModule({ onClose, onAdd }) {
  const dispatch = useDispatch();
  const createModuleLoading = useSelector(selectCreateModuleLoading);
  const createModuleError = useSelector(selectCreateModuleError);

  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    courseId: '',
    order: 0,
    isPublished: false,
  });

  const handleChange = (field, value) => {
    setNewModule(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createModule(newModule)).unwrap();
      onAdd();
    } catch (error) {
      console.error('Failed to create module:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Add Module</h2>
          <p className="text-sm text-gray-400 mt-1">Create a new course module</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {createModuleError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{createModuleError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Module Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Module Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={newModule.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  placeholder="Module title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Input
                  id="description"
                  value={newModule.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  placeholder="Brief description of the module..."
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID *</Label>
                <Input
                  id="courseId"
                  value={newModule.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  placeholder="MongoDB ObjectId of the course"
                  required
                />
              </div>

              <div>
                <Label htmlFor="order" className="text-gray-300">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={newModule.order}
                  onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Publishing */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Publishing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Published</Label>
                  <p className="text-sm text-gray-500">Make this module visible to students</p>
                </div>
                <Switch
                  checked={newModule.isPublished}
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
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createModuleLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {createModuleLoading ? (
            'Creating...'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
