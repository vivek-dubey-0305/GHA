import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Separator,
  Badge,
  WarningModal,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useToast,
} from '../ui';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateProgress,
  deleteProgress,
  selectProgressLoading,
  selectProgressError,
  selectUpdateProgressSuccess,
  selectDeleteProgressSuccess,
  clearProgressError,
  resetUpdateProgressState,
  resetDeleteProgressState,
} from '../../redux/slices/progress.slice.js';


export function EditProgress({ progressRecord, onBack }) {
  const dispatch = useDispatch();
  const progressLoading = useSelector(selectProgressLoading);
  const progressError = useSelector(selectProgressError);
  const updateProgressSuccess = useSelector(selectUpdateProgressSuccess);
  const deleteProgressSuccess = useSelector(selectDeleteProgressSuccess);
  const toast = useToast();

  const [formData, setFormData] = useState({
    status: progressRecord?.status || 'not-started',
    progressPercentage: progressRecord?.progressPercentage || 0,
    completedAt: progressRecord?.completedAt
      ? new Date(progressRecord.completedAt).toISOString().split('T')[0]
      : '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearProgressError());
      dispatch(resetUpdateProgressState());
      dispatch(resetDeleteProgressState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (updateProgressSuccess) {
      toast.success('Progress updated successfully!');
      dispatch(resetUpdateProgressState());
      onBack();
    }
  }, [updateProgressSuccess, toast, dispatch, onBack]);

  useEffect(() => {
    if (deleteProgressSuccess) {
      toast.success('Progress deleted successfully!');
      dispatch(resetDeleteProgressState());
      onBack();
    }
  }, [deleteProgressSuccess, toast, dispatch, onBack]);

  if (!progressRecord) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const progressData = {
        status: formData.status,
        progressPercentage: Number(formData.progressPercentage),
        ...(formData.completedAt && { completedAt: new Date(formData.completedAt).toISOString() }),
      };
      await dispatch(updateProgress({
        progressId: progressRecord._id,
        progressData,
      })).unwrap();
    } catch (error) {
      toast.error(error?.message || 'Failed to update progress');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteProgress(progressRecord._id)).unwrap();
    } catch (error) {
      toast.error(error?.message || 'Failed to delete progress');
    }
    setShowDeleteModal(false);
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Progress</h1>
          <p className="text-sm text-gray-400 mt-1">Update progress record details</p>
        </div>
      </div>

      {/* Error Display */}
      {progressError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{progressError}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Read-only Information */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Progress Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">User</Label>
              <p className="text-gray-300 mt-1 text-sm">{progressRecord.user?.name || '—'}</p>
              <p className="text-gray-500 text-xs">{progressRecord.user?.email || ''}</p>
            </div>
            <div>
              <Label className="text-gray-400">Course</Label>
              <p className="text-gray-300 mt-1 text-sm">{progressRecord.course?.title || '—'}</p>
            </div>
            <div>
              <Label className="text-gray-400">Lesson</Label>
              <p className="text-gray-300 mt-1 text-sm">{progressRecord.lesson?.title || '—'}</p>
            </div>
            <div>
              <Label className="text-gray-400">Time Spent</Label>
              <p className="text-gray-300 mt-1 text-sm">{formatTimeSpent(progressRecord.timeSpent)}</p>
            </div>
            <div>
              <Label className="text-gray-400">Last Accessed</Label>
              <p className="text-gray-300 mt-1 text-sm">
                {progressRecord.lastAccessedAt ? new Date(progressRecord.lastAccessedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        {/* Assignment Information */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Assignment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Assignment Submitted</Label>
              <div className="mt-1">
                <Badge
                  variant="default"
                  className={progressRecord.assignmentSubmitted ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}
                >
                  {progressRecord.assignmentSubmitted ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Assignment Score</Label>
              <p className="text-gray-300 mt-1 text-sm">
                {progressRecord.assignmentScore !== undefined && progressRecord.assignmentScore !== null
                  ? `${progressRecord.assignmentScore}/100`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        {/* Editable Fields */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Progress</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)} id="progress-status">
                <SelectTrigger className="w-full bg-[#0f0f0f] border-gray-800 text-white mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="progressPercentage" className="text-gray-300">Progress Percentage</Label>
              <Input
                id="progressPercentage"
                type="number"
                min={0}
                max={100}
                value={formData.progressPercentage}
                onChange={(e) => handleChange('progressPercentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="completedAt" className="text-gray-300">Completed At</Label>
              <Input
                id="completedAt"
                type="date"
                value={formData.completedAt}
                onChange={(e) => handleChange('completedAt', e.target.value)}
                className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
              />
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={progressLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {progressLoading ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Separator className="bg-gray-800" />

        {/* Danger Zone */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Delete Progress Record</p>
                <p className="text-sm text-gray-400 mt-1">Permanently remove this progress record</p>
              </div>
              <Button
                onClick={() => setShowDeleteModal(true)}
                disabled={progressLoading}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Warning Modal */}
      <WarningModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Progress"
        message="Are you sure you want to delete this progress record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
