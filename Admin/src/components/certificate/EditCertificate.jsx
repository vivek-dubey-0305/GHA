import { X, Save, Trash2, ShieldOff } from 'lucide-react';
import { Button, Input, Label, Separator, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, WarningModal } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateCertificate,
  deleteCertificate,
  revokeCertificate,
  selectUpdateCertificateLoading,
  selectUpdateCertificateError,
  selectDeleteCertificateLoading,
  selectRevokeCertificateLoading,
} from '../../redux/slices/certificate.slice.js';


export function EditCertificate({ certificate, onClose, onSave, onDelete }) {
  const dispatch = useDispatch();
  const updateLoading = useSelector(selectUpdateCertificateLoading);
  const updateError = useSelector(selectUpdateCertificateError);
  const deleteLoading = useSelector(selectDeleteCertificateLoading);
  const revokeLoading = useSelector(selectRevokeCertificateLoading);

  const [editedCertificate, setEditedCertificate] = useState({
    _id: certificate?._id,
    userId: certificate?.userId || '',
    courseId: certificate?.courseId || '',
    certificateUrl: certificate?.certificateUrl || '',
    status: certificate?.status || 'issued',
    issuedAt: certificate?.issuedAt,
    createdAt: certificate?.createdAt,
    updatedAt: certificate?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  if (!certificate) return null;

  const handleChange = (field, value) => {
    setEditedCertificate(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    try {
      await dispatch(updateCertificate({
        certificateId: editedCertificate._id,
        certificateData: {
          certificateUrl: editedCertificate.certificateUrl,
          status: editedCertificate.status,
        },
      })).unwrap();
      onSave();
    } catch (error) {
      console.error('Failed to update certificate:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteCertificate(editedCertificate._id)).unwrap();
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete certificate:', error);
      setShowDeleteModal(false);
    }
  };

  const handleConfirmRevoke = async () => {
    try {
      await dispatch(revokeCertificate({
        certificateId: editedCertificate._id,
        reason: revokeReason,
      })).unwrap();
      setEditedCertificate(prev => ({ ...prev, status: 'revoked' }));
      setShowRevokeModal(false);
      setRevokeReason('');
    } catch (error) {
      console.error('Failed to revoke certificate:', error);
      setShowRevokeModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Certificate</h2>
          <p className="text-sm text-gray-400 mt-1">Update certificate details</p>
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
          {/* Certificate Information (read-only) */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Certificate Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Certificate ID</Label>
                <p className="text-xs font-mono text-gray-500 mt-1">{editedCertificate._id}</p>
              </div>

              <div>
                <Label className="text-gray-300">User ID</Label>
                <p className="text-xs font-mono text-gray-500 mt-1">{editedCertificate.userId}</p>
              </div>

              <div>
                <Label className="text-gray-300">Course ID</Label>
                <p className="text-xs font-mono text-gray-500 mt-1">{editedCertificate.courseId}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Editable Fields */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Editable Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="certificateUrl" className="text-gray-300">Certificate URL</Label>
                <Input
                  id="certificateUrl"
                  value={editedCertificate.certificateUrl}
                  onChange={(e) => handleChange('certificateUrl', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="https://example.com/certificate.pdf"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-gray-300">Status</Label>
                <Select value={editedCertificate.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedCertificate.issuedAt && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Timestamps</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-400">Issued At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedCertificate.issuedAt).toLocaleString()}</p>
                  </div>
                  {editedCertificate.createdAt && (
                    <div>
                      <Label className="text-gray-400">Created At</Label>
                      <p className="text-gray-300 mt-1">{new Date(editedCertificate.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                  {editedCertificate.updatedAt && (
                    <div>
                      <Label className="text-gray-400">Updated At</Label>
                      <p className="text-gray-300 mt-1">{new Date(editedCertificate.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator className="bg-gray-800" />
            </>
          )}

          {/* Revoke Section */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Revoke Certificate</h3>
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Revoke this certificate</p>
                  <p className="text-sm text-gray-400 mt-1">Mark the certificate as revoked with a reason</p>
                </div>
                <Button
                  onClick={() => setShowRevokeModal(true)}
                  disabled={revokeLoading || editedCertificate.status === 'revoked'}
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                >
                  <ShieldOff className="w-4 h-4 mr-2" />
                  {revokeLoading ? 'Revoking...' : 'Revoke'}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium">Delete Certificate</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this certificate record</p>
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
        title="Delete Certificate"
        message={`Are you sure you want to delete this certificate? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Revoke Warning Modal */}
      <WarningModal
        isOpen={showRevokeModal}
        onClose={() => { setShowRevokeModal(false); setRevokeReason(''); }}
        title="Revoke Certificate"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to revoke this certificate? This will mark it as invalid.</p>
            <div>
              <Label htmlFor="revokeReason" className="text-gray-300 text-sm">Reason for revocation *</Label>
              <Input
                id="revokeReason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                placeholder="Enter reason for revoking..."
              />
            </div>
          </div>
        }
        confirmText={revokeLoading ? 'Revoking...' : 'Revoke'}
        cancelText="Cancel"
        onConfirm={handleConfirmRevoke}
        onCancel={() => { setShowRevokeModal(false); setRevokeReason(''); }}
      />
    </div>
  );
}
