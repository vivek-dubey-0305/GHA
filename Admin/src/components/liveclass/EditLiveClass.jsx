import { X, Save, Trash2, StopCircle, Ban, Play, Users, Copy, Check } from 'lucide-react';
import { Button, Input, Label, Separator, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateLiveClass,
  deleteLiveClass,
  endLiveClass,
  cancelLiveClass,
  joinLiveClassAdmin,
  selectUpdateLiveClassLoading,
  selectUpdateLiveClassError,
  selectDeleteLiveClassLoading,
  selectSignedPlayback,
} from '../../redux/slices/liveclass.slice.js';


export function EditLiveClass({ liveClass, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateLoading = useSelector(selectUpdateLiveClassLoading);
  const updateError = useSelector(selectUpdateLiveClassError);
  const deleteLoading = useSelector(selectDeleteLiveClassLoading);
  const signedPlayback = useSelector(selectSignedPlayback);

  const [edited, setEdited] = useState({
    _id: liveClass?._id,
    title: liveClass?.title || '',
    description: liveClass?.description || '',
    sessionType: liveClass?.sessionType || 'lecture',
    status: liveClass?.status || 'scheduled',
    scheduledAt: liveClass?.scheduledAt
      ? new Date(liveClass.scheduledAt).toISOString().slice(0, 16)
      : '',
    duration: liveClass?.duration || '',
    maxParticipants: liveClass?.maxParticipants || 500,
    isPublic: liveClass?.isPublic || false,
    chatEnabled: liveClass?.chatEnabled !== false,
    raiseHandEnabled: liveClass?.raiseHandEnabled !== false,
    createdAt: liveClass?.createdAt,
    updatedAt: liveClass?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  if (!liveClass) return null;

  const handleChange = (field, value) => {
    setEdited(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateLiveClass({
        liveClassId: edited._id,
        liveClassData: edited,
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update live class:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteLiveClass(edited._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete live class:', error);
      setShowDeleteModal(false);
    }
  };

  const handleEndLiveClass = async () => {
    try {
      await dispatch(endLiveClass(edited._id)).unwrap();
      setShowEndModal(false);
      onSave();
    } catch (error) {
      console.error('Failed to end live class:', error);
      setShowEndModal(false);
    }
  };

  const handleCancelLiveClass = async () => {
    try {
      await dispatch(cancelLiveClass({ liveClassId: edited._id, reason: cancelReason })).unwrap();
      setShowCancelModal(false);
      onSave();
    } catch (error) {
      console.error('Failed to cancel live class:', error);
      setShowCancelModal(false);
    }
  };

  const handleJoinWatch = async () => {
    await dispatch(joinLiveClassAdmin(edited._id)).unwrap();
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isLive = liveClass.status === 'live';
  const isScheduled = liveClass.status === 'scheduled';
  const instructorName = liveClass.instructor?.firstName
    ? `${liveClass.instructor.firstName} ${liveClass.instructor.lastName || ''}`
    : liveClass.instructor;

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Edit Live Class</h2>
            {isLive && (
              <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full animate-pulse">LIVE</span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{liveClass.sessionType} session</p>
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

          {/* Live Actions — shown when live or scheduled */}
          {(isLive || isScheduled) && (
            <div className="flex gap-2 flex-wrap">
              {isLive && (
                <>
                  <button
                    onClick={handleJoinWatch}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Watch Stream
                  </button>
                  <button
                    onClick={() => setShowEndModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    Force End
                  </button>
                </>
              )}
              {isScheduled && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* Signed Playback URL (after join) */}
          {signedPlayback?.hls && (
            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <Label className="text-green-400 text-xs">Signed HLS Playback</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs text-gray-300 bg-black/30 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                  {signedPlayback.hls}
                </code>
                <button onClick={() => copyToClipboard(signedPlayback.hls, 'hls')} className="text-gray-400 hover:text-white">
                  {copiedField === 'hls' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Live Class Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Live Class Information</h3>
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
                  rows={3}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-black rounded-md px-3 py-2 mt-2 focus:outline-none focus:border-gray-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionType" className="text-gray-300">Session Type</Label>
                  <select
                    id="sessionType"
                    value={edited.sessionType}
                    onChange={(e) => handleChange('sessionType', e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-gray-800 text-black rounded-md px-3 py-2 mt-2 focus:outline-none focus:border-gray-600"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="doubt">Doubt Session</option>
                    <option value="instant">Instant</option>
                    <option value="instructor">Instructor-to-Instructor</option>
                    <option value="business">Business Call</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="status" className="text-gray-300">Status</Label>
                  <select
                    id="status"
                    value={edited.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-gray-800 text-black rounded-md px-3 py-2 mt-2 focus:outline-none focus:border-gray-600"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledAt" className="text-gray-300">Scheduled At</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={edited.scheduledAt}
                    onChange={(e) => handleChange('scheduledAt', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-gray-300">Duration (mins)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={edited.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value) || '')}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxParticipants" className="text-gray-300">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={edited.maxParticipants}
                    onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || 500)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={edited.isPublic}
                      onChange={(e) => handleChange('isPublic', e.target.checked)}
                      className="accent-blue-600"
                    />
                    Public
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={edited.chatEnabled}
                      onChange={(e) => handleChange('chatEnabled', e.target.checked)}
                      className="accent-blue-600"
                    />
                    Chat
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Cloudflare Stream Info (read-only) */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Stream Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-gray-400">Instructor</Label>
                <p className="text-gray-300 mt-1">{instructorName}</p>
              </div>
              {liveClass.cfLiveInputId && (
                <div>
                  <Label className="text-gray-400">CF Live Input ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs text-gray-300 bg-black/30 px-2 py-1 rounded">{liveClass.cfLiveInputId}</code>
                    <button onClick={() => copyToClipboard(liveClass.cfLiveInputId, 'cfid')} className="text-gray-400 hover:text-white">
                      {copiedField === 'cfid' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
              {liveClass.actualParticipants !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{liveClass.actualParticipants} participants (peak: {liveClass.peakParticipants || 0})</span>
                </div>
              )}
              {liveClass.recordingStatus && liveClass.recordingStatus !== 'none' && (
                <div>
                  <Label className="text-gray-400">Recording</Label>
                  <p className="text-gray-300 mt-1 capitalize">{liveClass.recordingStatus}</p>
                </div>
              )}
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
                {liveClass.startedAt && (
                  <div>
                    <Label className="text-gray-400">Started At</Label>
                    <p className="text-gray-300 mt-1">{new Date(liveClass.startedAt).toLocaleString()}</p>
                  </div>
                )}
                {liveClass.endedAt && (
                  <div>
                    <Label className="text-gray-400">Ended At</Label>
                    <p className="text-gray-300 mt-1">{new Date(liveClass.endedAt).toLocaleString()}</p>
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
                  <p className="text-black font-medium">Delete Live Class</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this live class and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteLoading || isLive}
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
        title="Delete Live Class"
        message={`Are you sure you want to delete "${edited.title}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* End Live Modal */}
      <WarningModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="End Live Class"
        message={`Are you sure you want to force-end "${edited.title}"? This will stop the stream for all viewers.`}
        confirmText="End Now"
        cancelText="Cancel"
        onConfirm={handleEndLiveClass}
        onCancel={() => setShowEndModal(false)}
      />

      {/* Cancel Modal */}
      <WarningModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Live Class"
        message={`Cancel "${edited.title}"? Enter a reason below.`}
        confirmText="Cancel Session"
        cancelText="Keep"
        onConfirm={handleCancelLiveClass}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
