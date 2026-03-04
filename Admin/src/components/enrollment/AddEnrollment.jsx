import { X, Plus } from 'lucide-react';
import { Button, Input, Label, Separator } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createEnrollment,
  selectCreateEnrollmentLoading,
  selectCreateEnrollmentError,
} from '../../redux/slices/enrollment.slice.js';


export function AddEnrollment({ onClose, onAdd }) {
  const dispatch = useDispatch();
  const createEnrollmentLoading = useSelector(selectCreateEnrollmentLoading);
  const createEnrollmentError = useSelector(selectCreateEnrollmentError);

  const [newEnrollment, setNewEnrollment] = useState({
    userId: '',
    courseId: '',
    status: 'active',
  });

  const handleChange = (field, value) => {
    setNewEnrollment(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createEnrollment(newEnrollment)).unwrap();
      onAdd();
    } catch (error) {
      console.error('Failed to create enrollment:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Add Enrollment</h2>
          <p className="text-sm text-gray-400 mt-1">Create a new student enrollment</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {createEnrollmentError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{createEnrollmentError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Enrollment Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Enrollment Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId" className="text-gray-300">User ID *</Label>
                <Input
                  id="userId"
                  value={newEnrollment.userId}
                  onChange={(e) => handleChange('userId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the user"
                  required
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID *</Label>
                <Input
                  id="courseId"
                  value={newEnrollment.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the course"
                  required
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-300">Enrollment Status</Label>
                <select
                  id="status"
                  value={newEnrollment.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-black mt-2 rounded-md px-3 py-2 focus:outline-none focus:border-gray-600 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
                </select>
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
          disabled={createEnrollmentLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {createEnrollmentLoading ? (
            'Creating...'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Enrollment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
