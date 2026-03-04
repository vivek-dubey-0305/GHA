import { X, Plus } from 'lucide-react';
import { Button, Input, Label, Textarea, Separator } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createAssignment,
  selectCreateAssignmentLoading,
  selectCreateAssignmentError,
} from '../../redux/slices/assignment.slice.js';


export function AddAssignment({ onClose, onAdd }) {
  const dispatch = useDispatch();
  const createAssignmentLoading = useSelector(selectCreateAssignmentLoading);
  const createAssignmentError = useSelector(selectCreateAssignmentError);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    courseId: '',
    instructorId: '',
    dueDate: '',
    maxScore: 0,
    instructions: '',
  });

  const handleChange = (field, value) => {
    setNewAssignment(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createAssignment(newAssignment)).unwrap();
      onAdd();
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Add Assignment</h2>
          <p className="text-sm text-gray-400 mt-1">Create a new assignment</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {createAssignmentError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{createAssignmentError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Assignment Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Assignment Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Assignment title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Brief description of the assignment..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID *</Label>
                <Input
                  id="courseId"
                  value={newAssignment.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the course"
                  required
                />
              </div>

              <div>
                <Label htmlFor="instructorId" className="text-gray-300">Instructor ID *</Label>
                <Input
                  id="instructorId"
                  value={newAssignment.instructorId}
                  onChange={(e) => handleChange('instructorId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the instructor"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-gray-300">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="maxScore" className="text-gray-300">Max Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  value={newAssignment.maxScore}
                  onChange={(e) => handleChange('maxScore', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Instructions</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="instructions" className="text-gray-300">Assignment Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newAssignment.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Detailed instructions for students..."
                  rows={5}
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
          className="text-gray-400 hover:text-black hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createAssignmentLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {createAssignmentLoading ? (
            'Creating...'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
